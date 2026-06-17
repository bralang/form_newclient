import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeKind = "person" | "company";

type OwnerLabel = { name: string; pct?: string };

type TreeNode = {
  kind: NodeKind;
  label: string;
  owners?: OwnerLabel[]; // who owns this company and at what %
  isNew?: boolean;
  isHolding?: boolean;
  children: TreeNode[];
};

type Ctx = { selfName: string; spouseName: string };

// ─── Factories ────────────────────────────────────────────────────────────────

const mkPerson = (name: string): TreeNode =>
  ({ kind: "person", label: name, children: [] });

const mkCompany = (
  label: string,
  opts: { isNew?: boolean; isHolding?: boolean; owners?: OwnerLabel[] } = {}
): TreeNode => ({
  kind: "company",
  label,
  isNew: opts.isNew,
  isHolding: opts.isHolding,
  owners: opts.owners,
  children: [],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isSelf = (sh: any, selfName: string) =>
  sh?.isSelf ||
  sh?.personOwnerType === "self" ||
  (sh?.holderType !== "company" && sh?.name?.trim() === selfName?.trim());

const holderName = (sh: any, ctx: Ctx): string => {
  if (sh?.isSelf || sh?.personOwnerType === "self") return ctx.selfName;
  if (sh?.isSpouse || sh?.personOwnerType === "spouse") return ctx.spouseName;
  if (sh?.personOwnerType === "other") return sh?.personOwner?.name?.trim() || "אדם פרטי";
  return sh?.name?.trim() || "אדם פרטי";
};

// Build the owners list for a company: self first, then others
const collectOwners = (
  shList: any[],
  ctx: Ctx,
  overrideSelfPct?: string
): OwnerLabel[] => {
  const list = shList || [];
  const selfEntry = list.find((s: any) => isSelf(s, ctx.selfName));

  let selfPct = overrideSelfPct || selfEntry?.percentage;
  if (!selfPct) {
    const othersSum = list
      .filter((s: any) => !isSelf(s, ctx.selfName))
      .reduce((acc: number, s: any) => acc + (parseFloat(s?.percentage) || 0), 0);
    if (othersSum > 0 && othersSum < 100) selfPct = String(100 - othersSum);
  }

  const result: OwnerLabel[] = [{ name: ctx.selfName, pct: selfPct }];
  for (const sh of list) {
    if (isSelf(sh, ctx.selfName)) continue;
    result.push({ name: holderName(sh, ctx), pct: sh.percentage });
  }
  return result;
};

// ─── Build target company ─────────────────────────────────────────────────────

const buildTarget = (t: any, isNew: boolean, ctx: Ctx, depth = 0): TreeNode => {
  // Use the company name exactly as stored — do not substitute fallbacks that rename it
  const label = isNew
    ? (t.requestedName1?.trim() || "חברה חדשה")
    : (t.name?.trim() || "חברה קיימת");

  const st = t.shareholderType;

  if (!st || st === "alone") {
    return mkCompany(label, { isNew, owners: [{ name: ctx.selfName, pct: "100" }] });
  }

  if (st === "other") {
    const owners = collectOwners(t.shareholders || [], ctx);
    return mkCompany(label, { isNew, owners });
  }

  if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    // Other DIRECT shareholders of the target (besides the holding company)
    const otherDirect = (t.shareholders || []).filter((s: any) => !isSelf(s, ctx.selfName));
    const targetOwners: OwnerLabel[] = otherDirect.map((sh: any) => ({
      name: holderName(sh, ctx),
      pct: sh.percentage,
    }));
    const target = mkCompany(label, { isNew, owners: targetOwners.length ? targetOwners : undefined });
    return buildHoldingChain(svc, ctx, target, depth + 1);
  }

  return mkCompany(label, { isNew });
};

// ─── Build holding chain (self is always the top owner) ──────────────────────

const buildHoldingChain = (svc: any, ctx: Ctx, bottomNode: TreeNode, depth = 0): TreeNode => {
  if (!svc || depth > 10) return bottomNode;

  const isNew = svc?.isExistingCompany === false;
  // Use the actual company name — prefer companyName then name, don't fabricate
  const label = isNew
    ? (svc?.requestedName1?.trim() || "חברה חדשה")
    : (svc?.companyName?.trim() || svc?.name?.trim() || "חברה מחזיקה");

  const shList = svc?.shareholders || [];
  const owners = shList.length > 0
    ? collectOwners(shList, ctx, svc?.selfPercentage)
    : [{ name: ctx.selfName }];

  const holding = mkCompany(label, { isNew, isHolding: true, owners });
  holding.children.push(bottomNode);

  const sub = svc?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && svc.childCompany) {
    return buildHoldingChain(svc.childCompany, ctx, holding, depth + 1);
  }

  return holding;
};

// ─── Build owner tree ─────────────────────────────────────────────────────────

const buildOwnerTree = (bi: any, ownerName: string, ctx: Ctx): TreeNode | null => {
  const companies: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTarget(c, false, ctx)),
    ...(bi?.newCompanies || []).map((c: any) => buildTarget(c, true, ctx)),
  ];
  if (companies.length === 0) return null;
  const root = mkPerson(ownerName);
  root.children = companies;
  return root;
};

// ─── Visual ───────────────────────────────────────────────────────────────────

const LINE = "rgba(100,116,139,0.45)";

const NodeBox = ({ node, compact }: { node: TreeNode; compact: boolean }) => {
  const isPerson = node.kind === "person";
  const isHolding = node.isHolding;
  const w = compact ? "w-[100px]" : "w-[124px]";

  let boxCls = "", textCls = "", dividerCls = "";
  if (isPerson) {
    boxCls = "bg-amber-100 border-amber-400";
    textCls = "text-amber-900";
    dividerCls = "border-amber-300";
  } else if (isHolding) {
    boxCls = "bg-primary/10 border-amber-500 border-dashed";
    textCls = "text-primary";
    dividerCls = "border-amber-400";
  } else {
    boxCls = "bg-primary/10 border-primary";
    textCls = "text-primary";
    dividerCls = "border-primary/30";
  }

  const pad = compact ? "px-1.5 py-1" : "px-2 py-1.5";
  const iconSz = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const lblSz = compact ? "text-[9px]" : "text-[10px]";
  const ownerSz = compact ? "text-[8px]" : "text-[9px]";

  return (
    <div className={`${w} rounded-lg border-2 ${boxCls} overflow-hidden shadow-sm shrink-0`}>
      {/* Header */}
      <div className={`${pad} flex flex-col items-center gap-0.5`}>
        {isPerson
          ? <User className={`${iconSz} ${textCls}`} />
          : <Building2 className={`${iconSz} ${textCls}`} />}
        <span className={`${lblSz} font-bold text-center leading-tight break-words ${textCls}`}>
          {node.label}
        </span>
        {node.isNew && <span className={`text-[8px] ${textCls} opacity-60`}>חדש</span>}
        {node.isHolding && !node.isNew && <span className={`text-[8px] ${textCls} opacity-60`}>אחזקות</span>}
      </div>
      {/* Ownership breakdown — one row per owner */}
      {node.owners && node.owners.length > 0 && (
        <div className={`border-t-2 ${dividerCls}`}>
          {node.owners.map((o, i) => (
            <div
              key={i}
              className={`${ownerSz} font-semibold text-center py-0.5 px-1 leading-tight ${textCls} ${i > 0 ? `border-t ${dividerCls}` : ""}`}
            >
              {o.name}{o.pct ? ` ${o.pct}%` : ""}
            </div>
          ))}
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
  const {
    currentStep,
    businessInfo,
    spouseBusinessInfo,
    personalInfo,
  } = useFormContext() as any;

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

    const userCtx: Ctx = { selfName, spouseName };
    const my = buildOwnerTree(businessInfo, selfName, userCtx);
    if (my) result.push(my);

    // Spouse always gets a separate top-level tree when they have their own companies
    if (spouseRaw) {
      const spouseCtx: Ctx = { selfName: spouseName, spouseName: selfName };
      const sp = buildOwnerTree(spouseBusinessInfo, spouseName, spouseCtx);
      if (sp) result.push(sp);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(businessInfo),
    JSON.stringify(spouseBusinessInfo),
    selfName, spouseName, tick,
  ]);

  if (currentStep !== 3 || trees.length === 0) return null;

  return (
    <div
      className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-4"}`}
      dir="rtl"
    >
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
