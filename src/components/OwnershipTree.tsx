import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeKind = "person" | "company";

type TreeNode = {
  kind: NodeKind;
  label: string;
  sublabel?: string;    // ח.פ. / סוג
  percentage?: string;
  isNew?: boolean;
  isHolding?: boolean;  // חברת אחזקות ביניים
  children: TreeNode[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const person = (label: string, pct?: string): TreeNode =>
  ({ kind: "person", label, percentage: pct, children: [] });

const company = (label: string, opts: { isNew?: boolean; isHolding?: boolean; pct?: string } = {}): TreeNode =>
  ({ kind: "company", label, isNew: opts.isNew, isHolding: opts.isHolding, percentage: opts.pct, children: [] });

const isSelf = (sh: any, name: string) =>
  sh?.isSelf || sh?.personOwnerType === "self" ||
  (sh?.holderType === "person" && sh?.name?.trim() === name?.trim());

const isSpouse = (sh: any) =>
  sh?.isSpouse || sh?.personOwnerType === "spouse";

// ─── Build shareholder node ───────────────────────────────────────────────────

const buildShareholder = (sh: any, selfName: string, spouseName: string, depth = 0): TreeNode | null => {
  if (!sh || depth > 10) return null;
  if (isSpouse(sh)) return person(spouseName, sh.percentage);

  const ht = sh.holderType || "person";

  if (ht === "person") {
    const name = sh.personOwnerType === "other"
      ? sh?.personOwner?.name?.trim() || "אדם פרטי"
      : sh?.name?.trim() || "אדם פרטי";
    return person(name, sh.percentage);
  }

  // חברה בתור בעל מניות
  const isNew = sh?.isExistingCompany === false;
  const label = isNew
    ? sh?.requestedName1?.trim() || "חברה חדשה"
    : sh?.companyName?.trim() || sh?.name?.trim() || "חברה";
  const node = company(label, { isNew, isHolding: true, pct: sh.percentage });

  // בעלי מניות של החברה הזו
  for (const inner of (sh?.shareholders || [])) {
    if (isSelf(inner, selfName)) continue;
    const child = buildShareholder(inner, selfName, spouseName, depth + 1);
    if (child) node.children.push(child);
  }
  const sub = sh?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && sh.childCompany) {
    const child = buildShareholder(sh.childCompany, selfName, spouseName, depth + 1);
    if (child) node.children.push(child);
  } else if (sub === "person") {
    if (sh.personOwnerType === "spouse") node.children.push(person(spouseName));
    else if (sh.personOwnerType === "other")
      node.children.push(person(sh?.personOwner?.name?.trim() || "אדם פרטי"));
  }

  return node;
};

// ─── Build holding chain (top-down) ──────────────────────────────────────────
// מחזיר את הצומת העליון בשרשרת, כשה-bottomNode נמצא בתחתית

const buildHoldingChain = (svc: any, selfName: string, spouseName: string, bottomNode: TreeNode, depth = 0): TreeNode => {
  if (!svc || depth > 10) return bottomNode;

  const isNew = svc?.isExistingCompany === false;
  const label = isNew
    ? svc?.requestedName1?.trim() || "חברה חדשה"
    : svc?.companyName?.trim() || "חברה מחזיקה";

  const holding = company(label, { isNew, isHolding: true });
  holding.children.push(bottomNode);

  // בעלי מניות נוספים של חברת ההחזקה
  for (const sh of (svc?.shareholders || [])) {
    if (isSelf(sh, selfName)) continue;
    const child = buildShareholder(sh, selfName, spouseName, depth + 1);
    if (child) holding.children.push(child);
  }

  // מי מחזיק בחברת ההחזקה (שרשרת למעלה)
  const sub = svc?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && svc.childCompany) {
    return buildHoldingChain(svc.childCompany, selfName, spouseName, holding, depth + 1);
  }

  return holding;
};

// ─── Build target company node ────────────────────────────────────────────────

const buildTarget = (t: any, isNew: boolean, selfName: string, spouseName: string): TreeNode => {
  const label = isNew
    ? t.requestedName1?.trim() || "חברה חדשה"
    : t.name?.trim() || "חברה קיימת";
  const st = t.shareholderType;

  if (st === "alone") return company(label, { isNew, pct: "100" });

  if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    const target = company(label, { isNew, pct: svc.percentage });
    for (const sh of (t.shareholders || [])) {
      if (isSelf(sh, selfName)) continue;
      const child = buildShareholder(sh, selfName, spouseName);
      if (child) target.children.push(child);
    }
    return buildHoldingChain(svc, selfName, spouseName, target);
  }

  if (st === "other") {
    const shList: any[] = t.shareholders || [];
    const selfEntry = shList.find((s: any) => isSelf(s, selfName));
    let myPct: string | undefined = selfEntry?.percentage;
    if (!myPct) {
      const othersSum = shList
        .filter((s: any) => !isSelf(s, selfName))
        .reduce((acc: number, s: any) => acc + (parseFloat(s?.percentage) || 0), 0);
      myPct = othersSum > 0 && othersSum <= 100 ? String(100 - othersSum) : undefined;
    }
    const node = company(label, { isNew, pct: myPct });
    for (const sh of shList) {
      if (isSelf(sh, selfName)) continue;
      const child = buildShareholder(sh, selfName, spouseName);
      if (child) node.children.push(child);
    }
    return node;
  }

  return company(label, { isNew });
};

// ─── Build owner tree ─────────────────────────────────────────────────────────

const buildOwnerTree = (bi: any, ownerName: string, spouseName: string): TreeNode | null => {
  const companies: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTarget(c, false, ownerName, spouseName)),
    ...(bi?.newCompanies || []).map((c: any) => buildTarget(c, true, ownerName, spouseName)),
  ];
  if (companies.length === 0) return null;
  const root = person(ownerName);
  root.children = companies;
  return root;
};

// ─── Visual ───────────────────────────────────────────────────────────────────

const LINE = "rgba(100,116,139,0.45)";

const NodeBox = ({ node, compact }: { node: TreeNode; compact: boolean }) => {
  const isPerson = node.kind === "person";
  const isHolding = node.isHolding;
  const w = compact ? "w-[88px]" : "w-[112px]";

  let boxCls = "";
  let textCls = "";
  let pctCls = "";

  if (isPerson) {
    boxCls = "bg-amber-100 border-amber-400";
    textCls = "text-amber-900";
    pctCls = "bg-amber-50 border-amber-300 text-amber-800";
  } else if (isHolding) {
    boxCls = "bg-primary/10 border-amber-500 border-dashed";
    textCls = "text-primary";
    pctCls = "bg-white/80 border-amber-400 text-amber-700";
  } else {
    boxCls = "bg-primary/10 border-primary";
    textCls = "text-primary";
    pctCls = "bg-white/80 border-primary/40 text-primary";
  }

  const pad = compact ? "px-1.5 py-1" : "px-2 py-1.5";
  const iconSz = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const lblSz = compact ? "text-[9px]" : "text-[10px]";
  const pctSz = compact ? "text-[9px]" : "text-[10px]";

  return (
    <div className={`${w} rounded-lg border-2 ${boxCls} overflow-hidden shadow-sm shrink-0`}>
      <div className={`${pad} flex flex-col items-center gap-0.5`}>
        {isPerson
          ? <User className={`${iconSz} ${textCls}`} />
          : <Building2 className={`${iconSz} ${textCls}`} />}
        <span className={`${lblSz} font-bold text-center leading-tight break-words ${textCls}`}>
          {node.label}
        </span>
        {node.isNew && (
          <span className={`text-[8px] ${textCls} opacity-60`}>חדש</span>
        )}
        {node.isHolding && !node.isNew && (
          <span className={`text-[8px] ${textCls} opacity-60`}>אחזקות</span>
        )}
      </div>
      {node.percentage && (
        <div className={`border-t-2 ${pctCls} text-center ${pctSz} font-bold py-0.5`}>
          {node.percentage}%
        </div>
      )}
    </div>
  );
};

const TreeNodeView = ({ node, compact }: { node: TreeNode; compact: boolean }) => {
  const drop = compact ? 18 : 24;
  const gapX = compact ? 8 : 14;
  const hasChildren = node.children.length > 0;

  return (
    <div className="inline-flex flex-col items-center shrink-0">
      <NodeBox node={node} compact={compact} />
      {hasChildren && (
        <>
          <div className="w-px" style={{ height: drop, backgroundColor: LINE }} />
          <div className="flex items-start">
            {node.children.map((child, i) => {
              const isFirst = i === 0;
              const isLast = i === node.children.length - 1;
              const multi = node.children.length > 1;
              return (
                <div
                  key={`${child.label}-${i}`}
                  className="relative flex flex-col items-center"
                  style={{ paddingTop: drop, paddingInline: gapX / 2 }}
                >
                  {multi && !isFirst && (
                    <div className="absolute top-0 left-1/2 right-0 h-px" style={{ backgroundColor: LINE }} />
                  )}
                  {multi && !isLast && (
                    <div className="absolute top-0 right-1/2 left-0 h-px" style={{ backgroundColor: LINE }} />
                  )}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-px"
                    style={{ top: 0, height: drop, backgroundColor: LINE }}
                  />
                  <TreeNodeView node={child} compact={compact} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const OwnershipTree = ({ compact = false }: { compact?: boolean }) => {
  const { currentStep, businessInfo, spouseBusinessInfo, personalInfo } = useFormContext() as any;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (currentStep !== 3) return;
    const bump = () => setTick(t => t + 1);
    document.addEventListener("input", bump, true);
    document.addEventListener("change", bump, true);
    document.addEventListener("blur", bump, true);
    return () => {
      document.removeEventListener("input", bump, true);
      document.removeEventListener("change", bump, true);
      document.removeEventListener("blur", bump, true);
    };
  }, [currentStep]);

  const selfName = (personalInfo?.firstName || "").trim() || "אני";
  const spouseRaw = (personalInfo?.spouseName || personalInfo?.spouseFirstName || "").trim();
  const spouseName = spouseRaw || "בן/בת זוג";

  const trees = useMemo(() => {
    const result: TreeNode[] = [];
    const my = buildOwnerTree(businessInfo, selfName, spouseName);
    if (my) result.push(my);
    if (spouseRaw) {
      const sp = buildOwnerTree(spouseBusinessInfo, spouseName, selfName);
      if (sp) result.push(sp);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(businessInfo), JSON.stringify(spouseBusinessInfo), selfName, spouseName, tick]);

  if (currentStep !== 3 || trees.length === 0) return null;

  return (
    <div className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-4"}`} dir="rtl">
      <div className={`flex items-center gap-2 text-primary font-bold mb-3 ${compact ? "text-sm" : "text-sm"}`}>
        <Network className="w-4 h-4" />
        מפת השליטה בחברה
      </div>

      <div className="overflow-auto">
        <div className="flex items-start justify-center gap-10 min-w-max pb-2 pt-1">
          {trees.map((tree, i) => (
            <TreeNodeView key={i} node={tree} compact={compact} />
          ))}
        </div>
      </div>

      {/* מקרא */}
      <div className="border-t border-border mt-3 pt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground/70">
          <span className="w-3.5 h-3.5 rounded border-2 border-amber-400 bg-amber-100 shrink-0" /> אדם פרטי
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground/70">
          <span className="w-3.5 h-3.5 rounded border-2 border-primary bg-primary/10 shrink-0" /> חברה
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground/70">
          <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-amber-500 bg-primary/10 shrink-0" /> חברת אחזקות
        </span>
      </div>
    </div>
  );
};
