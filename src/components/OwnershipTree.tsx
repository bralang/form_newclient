import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";

type NodeKind = "person" | "company";

type TreeNode = {
  kind: NodeKind;
  label: string;
  isNew?: boolean;
  isAlsoShareholder?: boolean;
  percentage?: string;
  children: TreeNode[];
};

const fillerLabel = (name: string) => name?.trim() || "אני";

const personNode = (label: string, pct?: string): TreeNode => ({
  kind: "person",
  label,
  percentage: pct,
  children: [],
});

const companyNode = (label: string, isNew = false, pct?: string): TreeNode => ({
  kind: "company",
  label,
  isNew,
  percentage: pct,
  children: [],
});

const cloneTree = (node: TreeNode): TreeNode => ({
  ...node,
  children: node.children.map(cloneTree),
});

const mergeTopLevelBranches = (branches: TreeNode[]) => {
  const merged = new Map<string, TreeNode>();

  for (const branch of branches) {
    const key = `${branch.kind}:${branch.label}:${branch.isNew ? "1" : "0"}`;
    const copy = cloneTree(branch);
    const existing = merged.get(key);

    if (existing) {
      existing.children.push(...copy.children);
      existing.isAlsoShareholder = existing.isAlsoShareholder || copy.isAlsoShareholder;
      existing.percentage = existing.percentage || copy.percentage;
    } else {
      merged.set(key, copy);
    }
  }

  return Array.from(merged.values());
};

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
    if (sub === "self" || !sub) {
      userRoot.children.push(node);
    } else if (sub === "company" || sub === "self_via_company") {
      const parent = resolveOwnerNode(
        chain.childCompany || {},
        userRoot,
        spouseRoot,
        companyMap,
        fillerName,
        spouseName,
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
    const p = personNode(sh?.name?.trim() || "אדם פרטי");
    extraRoots.push(p);
    return p;
  }

  if (ht === "self_via_company" || ht === "company") {
    return resolveOwnerNode(sh, userRoot, spouseRoot, companyMap, fillerName, spouseName);
  }

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
        const owner = resolveShareholderOwner(
          sh,
          root,
          spouseRoot,
          map,
          ownerName,
          spouseName,
          extraRoots,
        );
        if (!owner) continue;

        if (!attached) {
          node.percentage = sh.percentage;
          owner.children.push(node);
          attached = true;
        } else {
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

const buildUnifiedTree = (
  my: { root: TreeNode; spouseRoot: TreeNode | null; extraRoots: TreeNode[] },
  sp: { root: TreeNode; spouseRoot: TreeNode | null; extraRoots: TreeNode[] } | null,
) => {
  const branches: TreeNode[] = [];

  if (my.root.children.length > 0) branches.push(my.root);
  if (my.spouseRoot && my.spouseRoot.children.length > 0) branches.push(my.spouseRoot);
  branches.push(...my.extraRoots.filter((node) => node.children.length > 0));

  if (sp) {
    if (sp.root.children.length > 0) branches.push(sp.root);
    if (sp.spouseRoot && sp.spouseRoot.children.length > 0) branches.push(sp.spouseRoot);
    branches.push(...sp.extraRoots.filter((node) => node.children.length > 0));
  }

  const mergedBranches = mergeTopLevelBranches(branches);
  if (mergedBranches.length === 0) return null;
  if (mergedBranches.length === 1) return mergedBranches[0];

  return {
    kind: "company" as const,
    label: "מפת שליטה",
    children: mergedBranches,
  };
};

const iconFor = (kind: NodeKind) =>
  kind === "person" ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />;

const classesFor = (n: TreeNode) => {
  if (n.kind === "person") {
    return "bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-900/40 dark:text-amber-100";
  }

  if (n.isAlsoShareholder) {
    return "bg-primary/10 text-primary border-amber-500 border-dashed";
  }

  return "bg-primary/10 text-primary border-primary";
};

const TreeNodeView = ({ node, compact = false }: { node: TreeNode; compact?: boolean }) => {
  const hasChildren = node.children.length > 0;
  const sizes = compact
    ? {
        pad: "px-2 py-1",
        text: "text-[11px]",
        pct: "text-[10px]",
        tag: "text-[9px]",
        gapX: 24,
        drop: 18,
      }
    : {
        pad: "px-3 py-2",
        text: "text-sm",
        pct: "text-xs",
        tag: "text-[11px]",
        gapX: 36,
        drop: 24,
      };

  return (
    <div className="inline-flex flex-col items-center align-top shrink-0">
      <div
        className={`inline-flex max-w-[280px] items-center gap-2 ${sizes.pad} rounded-lg border-2 ${sizes.text} font-semibold leading-tight whitespace-nowrap ${classesFor(node)}`}
      >
        <span className="shrink-0">{iconFor(node.kind)}</span>
        <span className="truncate" title={node.label}>{node.label}</span>
        {node.percentage && (
          <span className={`shrink-0 ${sizes.pct} opacity-80`}>({node.percentage}%)</span>
        )}
        {node.isNew && (
          <span className={`shrink-0 ${sizes.tag} bg-amber-200/60 dark:bg-amber-800/60 rounded px-1.5 py-0.5`}>
            חדשה
          </span>
        )}
      </div>

      {hasChildren && (
        <div className="flex flex-col items-center">
          <div className="w-px bg-primary/40" style={{ height: sizes.drop }} />
          <div className="flex items-start justify-center min-w-max">
            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              const hasSiblings = node.children.length > 1;

              return (
                <div
                  key={`${child.kind}-${child.label}-${index}`}
                  className="relative flex flex-col items-center"
                  style={{ paddingTop: sizes.drop, paddingInline: sizes.gapX / 2 }}
                >
                  {hasSiblings && !isFirst && (
                    <div className="absolute top-0 right-1/2 left-0 h-px bg-primary/40" />
                  )}
                  {hasSiblings && !isLast && (
                    <div className="absolute top-0 left-1/2 right-0 h-px bg-primary/40" />
                  )}
                  <div
                    className="absolute top-0 left-1/2 w-px -translate-x-1/2 bg-primary/40"
                    style={{ height: sizes.drop }}
                  />
                  <TreeNodeView node={child} compact={compact} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const OwnershipTree = ({ compact = false }: { compact?: boolean }) => {
  const { currentStep, businessInfo, spouseBusinessInfo, personalInfo } = useFormContext() as any;

  if (currentStep !== 3) return null;

  const fillerName = fillerLabel(personalInfo?.firstName || "");
  const spouseName = fillerLabel(personalInfo?.spouseFirstName || "בן/בת זוג");
  const hasSpouse = !!personalInfo?.spouseFirstName;

  const my = buildForOwner(businessInfo, fillerName, spouseName, hasSpouse);
  const sp = hasSpouse && spouseBusinessInfo
    ? buildForOwner(spouseBusinessInfo, spouseName, fillerName, true)
    : null;

  const unifiedTree = buildUnifiedTree(my, sp);
  if (!unifiedTree) return null;

  return (
    <div className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-5"}`} dir="rtl">
      <div className={`flex items-center gap-2 text-primary font-bold ${compact ? "text-sm" : "text-base"}`}>
        <Network className={compact ? "w-4 h-4" : "w-5 h-5"} />
        מפת השליטה בחברה
      </div>

      <div className={`mt-3 space-y-4 ${compact ? "max-h-[40vh]" : "max-h-[70vh]"} overflow-x-auto overflow-y-auto pr-1`}>
        <div className="flex justify-center items-start min-w-max pb-2">
          <TreeNodeView node={unifiedTree} compact={compact} />
        </div>

        <div className={`border-t-2 border-border pt-3 mt-2 grid grid-cols-1 gap-2 text-foreground font-medium ${compact ? "text-xs" : "text-sm"}`}>
          <div className={`font-bold text-primary ${compact ? "text-sm" : "text-base"}`}>מקרא</div>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-amber-200 border-2 border-amber-400 inline-block shrink-0" /> אדם פרטי</span>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-primary/20 border-2 border-amber-500 border-dashed inline-block shrink-0" /> חברה אם</span>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-primary/30 border-2 border-primary inline-block shrink-0" /> חברה</span>
        </div>
      </div>
    </div>
  );
};
