import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const isSelfShareholder = (sh: any, fillerName: string) => {
  if (!sh) return false;
  if (sh.isSelf) return true;
  if (sh.holderType === "person" && sh?.name?.trim() && sh.name.trim() === fillerName?.trim()) return true;
  return false;
};

// Build a holding-company chain rendered DOWNWARDS from a target company.
// Stops before the owner so we don't duplicate the root person.
const buildHoldingChainBelowTarget = (
  chain: any,
  fillerName: string,
  spouseName: string,
  depth: number,
): TreeNode | null => {
  if (!chain || depth > 20) return null;
  const isNew = chain?.isExistingCompany === false;
  const label =
    chain?.companyName?.trim() ||
    chain?.requestedName1?.trim() ||
    (isNew ? "חברה חדשה" : "חברה מחזיקה");
  const node = companyNode(label, isNew);
  node.isAlsoShareholder = true;

  const sub = chain?.subOwnerType;
  if (sub === "company" || sub === "self_via_company") {
    const child = buildHoldingChainBelowTarget(chain.childCompany, fillerName, spouseName, depth + 1);
    if (child) node.children.push(child);
  } else if (sub === "person") {
    const pType = chain?.personOwnerType;
    if (pType === "self") {
      // ends at owner — skip to avoid duplication
    } else if (pType === "spouse") {
      node.children.push(personNode(spouseName));
    } else {
      node.children.push(personNode(chain?.personOwner?.name?.trim() || "אדם פרטי"));
    }
  }
  // sub === "self" → ends at owner, render nothing further
  return node;
};

const buildOtherShareholderNode = (
  sh: any,
  fillerName: string,
  spouseName: string,
): TreeNode | null => {
  if (!sh) return null;
  if (sh.isSpouse) return personNode(spouseName, sh.percentage);
  const ht = sh.holderType || "person";
  if (ht === "person") {
    return personNode(sh?.name?.trim() || "אדם פרטי", sh.percentage);
  }
  const inner = buildHoldingChainBelowTarget(sh, fillerName, spouseName, 0);
  if (inner) inner.percentage = sh.percentage;
  return inner;
};

const buildTargetNode = (
  t: any,
  isNew: boolean,
  fillerName: string,
  spouseName: string,
): TreeNode => {
  const label = isNew
    ? (t.requestedName1?.trim() || "חברה חדשה")
    : (t.name?.trim() || "חברה קיימת");
  const st = t.shareholderType;

  let ownerPct: string | undefined;
  const extraChildren: TreeNode[] = [];

  if (st === "alone") {
    ownerPct = "100";
  } else if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    ownerPct = svc.percentage;
    const chainNode = buildHoldingChainBelowTarget(svc, fillerName, spouseName, 0);
    if (chainNode) extraChildren.push(chainNode);
  } else if (st === "other") {
    const shList = t.shareholders || [];
    const selfEntry = shList.find((s: any) => isSelfShareholder(s, fillerName));
    if (selfEntry?.percentage) {
      ownerPct = selfEntry.percentage;
    } else {
      const sum = shList
        .filter((s: any) => !isSelfShareholder(s, fillerName))
        .reduce((acc: number, s: any) => {
          const n = parseFloat(s?.percentage);
          return acc + (isNaN(n) ? 0 : n);
        }, 0);
      ownerPct = sum > 0 && sum <= 100 ? String(100 - sum) : "?";
    }
    for (const sh of shList) {
      if (isSelfShareholder(sh, fillerName)) continue;
      const child = buildOtherShareholderNode(sh, fillerName, spouseName);
      if (child) extraChildren.push(child);
    }
  }

  const node = companyNode(label, isNew, ownerPct);
  node.children = extraChildren;
  return node;
};

const buildForOwner = (
  bi: any,
  ownerName: string,
  spouseName: string,
): TreeNode | null => {
  const targets: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTargetNode(c, false, ownerName, spouseName)),
    ...(bi?.newCompanies || []).map((c: any) => buildTargetNode(c, true, ownerName, spouseName)),
  ];
  if (targets.length === 0) return null;
  const root = personNode(ownerName);
  root.children = targets;
  return root;
};

const buildUnifiedTree = (branches: TreeNode[]) => {
  if (branches.length === 0) return null;
  if (branches.length === 1) return branches[0];
  return {
    kind: "company" as const,
    label: "מפת שליטה",
    children: branches,
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
                    <div className="absolute top-0 left-1/2 right-0 h-px bg-primary/40" />
                  )}
                  {hasSiblings && !isLast && (
                    <div className="absolute top-0 right-1/2 left-0 h-px bg-primary/40" />
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

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (currentStep !== 3) return;
    const bump = () => setTick((t) => t + 1);
    document.addEventListener("input", bump, true);
    document.addEventListener("change", bump, true);
    document.addEventListener("blur", bump, true);
    return () => {
      document.removeEventListener("input", bump, true);
      document.removeEventListener("change", bump, true);
      document.removeEventListener("blur", bump, true);
    };
  }, [currentStep]);

  const fillerName = fillerLabel(personalInfo?.firstName || "");
  const spouseRaw = personalInfo?.spouseName || personalInfo?.spouseFirstName || "";
  const spouseName = spouseRaw.trim() || "בן/בת זוג";
  const hasSpouse = !!spouseRaw.trim();

  const unifiedTree = useMemo(() => {
    const my = buildForOwner(businessInfo, fillerName, spouseName);
    const sp = hasSpouse && spouseBusinessInfo
      ? buildForOwner(spouseBusinessInfo, spouseName, fillerName)
      : [];
    return buildUnifiedTree([...my, ...sp]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(businessInfo), JSON.stringify(spouseBusinessInfo), fillerName, spouseName, hasSpouse, tick]);

  if (currentStep !== 3) return null;
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
