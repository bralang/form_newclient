import { useState } from "react";
import { useFormContext } from "@/contexts/FormContext";
import { Building2, User, ChevronDown, ChevronUp, Network } from "lucide-react";

type NodeKind = "person" | "company";

type TreeNode = {
  kind: NodeKind;
  label: string;
  isNew?: boolean;
  isAlsoShareholder?: boolean; // company that also holds shares in another company
  percentage?: string;
  children: TreeNode[];
};

const fillerLabel = (name: string) => name?.trim() || "אני";

const personNode = (label: string, pct?: string): TreeNode => ({
  kind: "person", label, percentage: pct, children: [],
});
const companyNode = (label: string, isNew = false, pct?: string): TreeNode => ({
  kind: "company", label, isNew, percentage: pct, children: [],
});

// Resolve the owner-node for a chain object (the holding company directly above the target).
// Walks upward, linking by company name where possible, and attaches the topmost owner under userRoot.
const resolveOwnerNode = (
  chain: any,
  userRoot: TreeNode,
  spouseRoot: TreeNode | null,
  companyMap: Map<string, TreeNode>,
  fillerName: string,
  spouseName: string,
): TreeNode => {
  const cname =
    chain?.companyName?.trim() ||
    chain?.requestedName1?.trim() ||
    "חברה מחזיקה";
  let node = companyMap.get(cname);
  const isNew = chain?.isExistingCompany === false;
  if (!node) {
    node = companyNode(cname, isNew);
    companyMap.set(cname, node);

    const sub = chain?.subOwnerType;
    if (sub === "self_via_company" || sub === "self" || !sub) {
      // user owns this holding directly
      userRoot.children.push(node);
    } else if (sub === "company") {
      const parent = resolveOwnerNode(
        chain.childCompany || {},
        userRoot, spouseRoot, companyMap, fillerName, spouseName,
      );
      parent.isAlsoShareholder = true;
      parent.children.push(node);
    } else if (sub === "person") {
      const pType = chain?.personOwnerType;
      let pLabel: string;
      if (pType === "self") pLabel = fillerName;
      else if (pType === "spouse") pLabel = spouseName;
      else pLabel = chain?.personOwner?.name?.trim() || "אדם פרטי";
      const root = pType === "spouse" && spouseRoot ? spouseRoot : userRoot;
      // if this is a third-party person (not self/spouse), nest under user as a separate branch
      if (pType === "self" || pType === "spouse") {
        root.children.push(node);
      } else {
        const p = personNode(pLabel);
        p.children.push(node);
        userRoot.children.push(p);
      }
    } else {
      userRoot.children.push(node);
    }
  }
  // mark as also-shareholder because something is being attached below it
  node.isAlsoShareholder = true;
  return node;
};

const resolveShareholderOwner = (
  sh: any,
  userRoot: TreeNode,
  spouseRoot: TreeNode | null,
  companyMap: Map<string, TreeNode>,
  fillerName: string,
  spouseName: string,
  extraRoots: TreeNode[],
): TreeNode | null => {
  if (sh?.isSelf) return userRoot;
  if (sh?.isSpouse) return spouseRoot || userRoot;
  const ht = sh?.holderType || "person";
  if (ht === "person") {
    // third-party person — render as its own root branch (not owned by the user)
    const p = personNode(sh?.name?.trim() || "אדם פרטי");
    extraRoots.push(p);
    return p;
  }
  if (ht === "self_via_company") {
    return resolveOwnerNode(sh, userRoot, spouseRoot, companyMap, fillerName, spouseName);
  }
  // company (third-party) — render as its own root branch
  const cname = sh?.companyName?.trim() || sh?.name?.trim() || "חברה מחזיקה";
  let node = companyMap.get(cname);
  if (!node) {
    const isNew = sh?.isExistingCompany === false;
    node = companyNode(cname, isNew);
    companyMap.set(cname, node);
    extraRoots.push(node);
  }
  node.isAlsoShareholder = true;
  return node;
};

const buildForOwner = (
  bi: any,
  ownerName: string,
  spouseName: string,
  hasSpouse: boolean,
): { root: TreeNode; spouseRoot: TreeNode | null; extraRoots: TreeNode[] } => {
  const root = personNode(ownerName);
  const spouseRoot = hasSpouse ? personNode(spouseName) : null;
  const map = new Map<string, TreeNode>();
  const extraRoots: TreeNode[] = [];

  const targets = [
    ...(bi?.existingCompanies || []).map((c: any) => ({ ...c, _isNew: false })),
    ...(bi?.newCompanies || []).map((c: any) => ({ ...c, _isNew: true })),
  ];

  // Pre-create target nodes so chains can reference them by name
  for (const t of targets) {
    const label = t._isNew
      ? (t.requestedName1?.trim() || "חברה חדשה")
      : (t.name?.trim() || "חברה קיימת");
    if (!map.has(label)) map.set(label, companyNode(label, t._isNew));
  }

  for (const t of targets) {
    const label = t._isNew
      ? (t.requestedName1?.trim() || "חברה חדשה")
      : (t.name?.trim() || "חברה קיימת");
    const node = map.get(label)!;
    const st = t.shareholderType;

    if (st === "alone") {
      node.percentage = "100";
      root.children.push(node);
    } else if (st === "self_via_company") {
      const svc = t.selfViaCompany || {};
      node.percentage = svc.percentage;
      const owner = resolveOwnerNode(svc, root, spouseRoot, map, ownerName, spouseName);
      owner.children.push(node);
    } else if (st === "other") {
      const shs = t.shareholders || [];
      let attached = false;
      for (const sh of shs) {
        const owner = resolveShareholderOwner(sh, root, spouseRoot, map, ownerName, spouseName, extraRoots);
        if (!owner) continue;
        if (!attached) {
          node.percentage = sh.percentage;
          owner.children.push(node);
          attached = true;
        } else {
          // additional shareholder: render a small clone under that owner
          const clone = companyNode(label, t._isNew, sh.percentage);
          owner.children.push(clone);
        }
      }
      if (!attached) root.children.push(node);
    } else {
      root.children.push(node);
    }
  }

  return { root, spouseRoot, extraRoots };
};

// ─── Rendering ───
const iconFor = (kind: NodeKind) =>
  kind === "person" ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />;

// Purple = company, Yellow = shareholder (person), Yellow dashed = company that also holds shares
const classesFor = (n: TreeNode) => {
  if (n.kind === "person") {
    return "bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-900/40 dark:text-amber-100";
  }
  // company
  if (n.isAlsoShareholder) {
    return "bg-primary/10 text-primary border-amber-500 border-dashed";
  }
  return "bg-primary/10 text-primary border-primary";
};

const TreeNodeView = ({ node, compact = false }: { node: TreeNode; compact?: boolean }) => {
  const hasChildren = node.children && node.children.length > 0;
  const sizes = compact
    ? { pad: "px-2 py-1", text: "text-[11px]", pct: "text-[10px]", tag: "text-[9px]", gap: "gap-3", drop: "h-3" }
    : { pad: "px-3 py-2", text: "text-sm", pct: "text-xs", tag: "text-[11px]", gap: "gap-5", drop: "h-4" };
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className={`inline-flex items-center gap-2 ${sizes.pad} rounded-lg border-2 ${sizes.text} font-semibold leading-tight whitespace-nowrap ${classesFor(node)}`}>
        <span className="shrink-0">{iconFor(node.kind)}</span>
        <span title={node.label}>{node.label}</span>
        {node.percentage && (
          <span className={`shrink-0 ${sizes.pct} opacity-80`}>({node.percentage}%)</span>
        )}
        {node.isNew && (
          <span className={`shrink-0 ${sizes.tag} bg-amber-200/60 dark:bg-amber-800/60 rounded px-1.5 py-0.5`}>חדשה</span>
        )}
      </div>
      {hasChildren && (
        <>
          <div className={`w-px ${sizes.drop} bg-primary/40`} />
          <div className={`relative flex items-start ${sizes.gap}`}>
            {node.children.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-px bg-primary/40" />
            )}
            {node.children.map((c, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-px ${sizes.drop} bg-primary/40`} />
                <TreeNodeView node={c} compact={compact} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const OwnershipTree = ({ compact = false }: { compact?: boolean }) => {
  const { currentStep, businessInfo, spouseBusinessInfo, personalInfo } = useFormContext() as any;
  const [collapsed, setCollapsed] = useState(false);

  if (currentStep !== 3) return null;

  const fillerName = fillerLabel(personalInfo?.firstName || "");
  const spouseName = fillerLabel(personalInfo?.spouseFirstName || "בן/בת זוג");
  const hasSpouse = !!personalInfo?.spouseFirstName;

  const my = buildForOwner(businessInfo, fillerName, spouseName, hasSpouse);
  const sp = hasSpouse && spouseBusinessInfo
    ? buildForOwner(spouseBusinessInfo, spouseName, fillerName, true)
    : null;

  if (my.root.children.length === 0 && (!sp || sp.root.children.length === 0)) return null;

  return (
    <div className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-5"}`} dir="rtl">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-primary"
      >
        <span className={`inline-flex items-center gap-2 font-bold ${compact ? "text-sm" : "text-base"}`}>
          <Network className={compact ? "w-4 h-4" : "w-5 h-5"} />
          מפת השליטה בחברה
        </span>
        {collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>

      {!collapsed && (
        <div className={`mt-3 space-y-4 ${compact ? "max-h-[40vh]" : "max-h-[70vh]"} overflow-auto pr-1`}>
          {(my.root.children.length > 0 || (my.spouseRoot && my.spouseRoot.children.length > 0) || my.extraRoots.length > 0) && (
            <div className={`flex justify-center items-start ${compact ? "gap-4" : "gap-8"} min-w-max pb-2`}>
              {my.root.children.length > 0 && <TreeNodeView node={my.root} compact={compact} />}
              {my.spouseRoot && my.spouseRoot.children.length > 0 && (
                <TreeNodeView node={my.spouseRoot} compact={compact} />
              )}
              {my.extraRoots.map((r, i) => (
                <TreeNodeView key={`er-${i}`} node={r} compact={compact} />
              ))}
            </div>
          )}
          {sp && (sp.root.children.length > 0 || (sp.spouseRoot && sp.spouseRoot.children.length > 0)) && (
            <>
              <div className={`font-bold text-muted-foreground border-t border-border pt-2 ${compact ? "text-[11px]" : "text-xs"}`}>
                חברות של {spouseName}
              </div>
              <div className={`flex justify-center items-start ${compact ? "gap-4" : "gap-8"} min-w-max pb-2`}>
                {sp.root.children.length > 0 && <TreeNodeView node={sp.root} compact={compact} />}
                {sp.spouseRoot && sp.spouseRoot.children.length > 0 && (
                  <TreeNodeView node={sp.spouseRoot} compact={compact} />
                )}
              </div>
            </>
          )}
          {(() => {
            return (
              <div className={`border-t-2 border-border pt-3 mt-2 grid grid-cols-1 gap-2 text-foreground font-medium ${compact ? "text-xs" : "text-sm"}`}>
                <div className={`font-bold text-primary ${compact ? "text-sm" : "text-base"}`}>מקרא</div>
                <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-amber-200 border-2 border-amber-400 inline-block shrink-0" /> אדם פרטי</span>
                <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-primary/20 border-2 border-amber-500 border-dashed inline-block shrink-0" /> חברה אם</span>
                <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-primary/30 border-2 border-primary inline-block shrink-0" /> חברה</span>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
};
