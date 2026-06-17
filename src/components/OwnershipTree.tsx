import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeKind = "person" | "company";

type TreeNode = {
  kind: NodeKind;
  label: string;
  percentage?: string;
  isNew?: boolean;
  isHolding?: boolean;
  isReference?: boolean; // second occurrence of same person — dashed reference box
  nodeId?: string;       // ת.ז. or unique key for dedup tracking
  children: TreeNode[];
};

type BuildCtx = {
  selfName: string;
  selfId: string;
  spouseName: string;
  spouseId: string;
  spouseBI: any;                  // spouse's businessInfo (for injection)
  spouseInjected: { v: boolean }; // mutated when spouse is expanded in tree
  seenIds: Set<string>;           // person IDs already rendered (for dedup)
};

// ─── Node factories ───────────────────────────────────────────────────────────

const mkPerson = (label: string, pct?: string, nodeId?: string): TreeNode =>
  ({ kind: "person", label, percentage: pct, nodeId, children: [] });

const mkRef = (label: string, pct?: string, nodeId?: string): TreeNode =>
  ({ kind: "person", label, percentage: pct, nodeId, isReference: true, children: [] });

const mkCompany = (label: string, opts: { isNew?: boolean; isHolding?: boolean; pct?: string } = {}): TreeNode =>
  ({ kind: "company", label, isNew: opts.isNew, isHolding: opts.isHolding, percentage: opts.pct, children: [] });

// ─── Identity helpers ─────────────────────────────────────────────────────────

const isSelf = (sh: any, selfName: string) =>
  sh?.isSelf ||
  sh?.personOwnerType === "self" ||
  (sh?.holderType === "person" && sh?.name?.trim() === selfName?.trim());

const isSpouseHolder = (sh: any) =>
  sh?.isSpouse || sh?.personOwnerType === "spouse";

const personKey = (sh: any): string =>
  sh?.idNumber?.trim() ||
  sh?.personOwner?.idNumber?.trim() ||
  sh?.name?.trim() ||
  sh?.personOwner?.name?.trim() ||
  "";

// ─── Shareholder builder ──────────────────────────────────────────────────────

const buildShareholder = (sh: any, ctx: BuildCtx, depth = 0): TreeNode | null => {
  if (!sh || depth > 10) return null;

  // ── Spouse ──────────────────────────────────────────────────────────────────
  if (isSpouseHolder(sh)) {
    const spouseCompanyCount =
      (ctx.spouseBI?.existingCompanies?.length || 0) +
      (ctx.spouseBI?.newCompanies?.length || 0);

    if (spouseCompanyCount > 0 && !ctx.spouseInjected.v) {
      // First time we see the spouse AND they have own companies → expand sub-tree
      ctx.spouseInjected.v = true;
      if (ctx.spouseId) ctx.seenIds.add(ctx.spouseId);
      const spouseNode = mkPerson(ctx.spouseName, sh.percentage, ctx.spouseId || ctx.spouseName);
      // Build spouse's companies (swap self/spouse roles to avoid double-skip)
      const spouseCtx: BuildCtx = {
        selfName: ctx.spouseName,
        selfId: ctx.spouseId,
        spouseName: ctx.selfName,
        spouseId: ctx.selfId,
        spouseBI: null, // prevent recursive injection
        spouseInjected: { v: false },
        seenIds: ctx.seenIds, // share registry
      };
      const spouseCompanies = [
        ...(ctx.spouseBI?.existingCompanies || []).map((c: any) =>
          buildTarget(c, false, spouseCtx, depth + 1)
        ),
        ...(ctx.spouseBI?.newCompanies || []).map((c: any) =>
          buildTarget(c, true, spouseCtx, depth + 1)
        ),
      ];
      spouseNode.children = spouseCompanies;
      return spouseNode;
    }

    if (spouseCompanyCount > 0 && ctx.spouseInjected.v) {
      // Spouse already rendered elsewhere — show reference
      return mkRef(ctx.spouseName, sh.percentage, ctx.spouseId || ctx.spouseName);
    }

    // Spouse has no own companies — plain leaf
    return mkPerson(ctx.spouseName, sh.percentage, ctx.spouseId || ctx.spouseName);
  }

  // ── Person ───────────────────────────────────────────────────────────────────
  const ht = sh.holderType || "person";

  if (ht === "person") {
    const nameStr =
      sh.personOwnerType === "other"
        ? sh?.personOwner?.name?.trim() || "אדם פרטי"
        : sh?.name?.trim() || "אדם פרטי";
    const id = sh?.idNumber?.trim() || sh?.personOwner?.idNumber?.trim() || nameStr;

    if (id && ctx.seenIds.has(id)) {
      return mkRef(nameStr, sh.percentage, id);
    }
    if (id) ctx.seenIds.add(id);
    return mkPerson(nameStr, sh.percentage, id);
  }

  // ── Company as shareholder (holding) ─────────────────────────────────────────
  const isNew = sh?.isExistingCompany === false;
  const label = isNew
    ? sh?.requestedName1?.trim() || "חברה חדשה"
    : sh?.companyName?.trim() || sh?.name?.trim() || "חברה";
  const node = mkCompany(label, { isNew, isHolding: true, pct: sh.percentage });

  for (const inner of (sh?.shareholders || [])) {
    if (isSelf(inner, ctx.selfName)) continue;
    const child = buildShareholder(inner, ctx, depth + 1);
    if (child) node.children.push(child);
  }
  const sub = sh?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && sh.childCompany) {
    const child = buildShareholder(sh.childCompany, ctx, depth + 1);
    if (child) node.children.push(child);
  } else if (sub === "person") {
    if (sh.personOwnerType === "spouse") {
      const c = buildShareholder({ isSpouse: true }, ctx, depth + 1);
      if (c) node.children.push(c);
    } else if (sh.personOwnerType === "other") {
      node.children.push(mkPerson(sh?.personOwner?.name?.trim() || "אדם פרטי"));
    }
  }

  return node;
};

// ─── Holding chain (top-down) ─────────────────────────────────────────────────

const buildHoldingChain = (
  svc: any, ctx: BuildCtx, bottomNode: TreeNode, depth = 0
): TreeNode => {
  if (!svc || depth > 10) return bottomNode;

  const isNew = svc?.isExistingCompany === false;
  const label = isNew
    ? svc?.requestedName1?.trim() || "חברה חדשה"
    : svc?.companyName?.trim() || "חברה מחזיקה";

  const holding = mkCompany(label, { isNew, isHolding: true });
  holding.children.push(bottomNode);

  for (const sh of (svc?.shareholders || [])) {
    if (isSelf(sh, ctx.selfName)) continue;
    const child = buildShareholder(sh, ctx, depth + 1);
    if (child) holding.children.push(child);
  }

  const sub = svc?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && svc.childCompany) {
    return buildHoldingChain(svc.childCompany, ctx, holding, depth + 1);
  }

  return holding;
};

// ─── Target company ───────────────────────────────────────────────────────────

const buildTarget = (t: any, isNew: boolean, ctx: BuildCtx, depth = 0): TreeNode => {
  const label = isNew
    ? t.requestedName1?.trim() || "חברה חדשה"
    : t.name?.trim() || "חברה קיימת";
  const st = t.shareholderType;

  if (st === "alone") return mkCompany(label, { isNew, pct: "100" });

  if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    const target = mkCompany(label, { isNew, pct: svc.percentage });
    for (const sh of (t.shareholders || [])) {
      if (isSelf(sh, ctx.selfName)) continue;
      const child = buildShareholder(sh, ctx, depth + 1);
      if (child) target.children.push(child);
    }
    return buildHoldingChain(svc, ctx, target, depth + 1);
  }

  if (st === "other") {
    const shList: any[] = t.shareholders || [];
    const selfEntry = shList.find((s: any) => isSelf(s, ctx.selfName));
    let myPct = selfEntry?.percentage;
    if (!myPct) {
      const othersSum = shList
        .filter((s: any) => !isSelf(s, ctx.selfName))
        .reduce((acc: number, s: any) => acc + (parseFloat(s?.percentage) || 0), 0);
      myPct = othersSum > 0 && othersSum <= 100 ? String(100 - othersSum) : undefined;
    }
    const node = mkCompany(label, { isNew, pct: myPct });
    for (const sh of shList) {
      if (isSelf(sh, ctx.selfName)) continue;
      const child = buildShareholder(sh, ctx, depth + 1);
      if (child) node.children.push(child);
    }
    return node;
  }

  return mkCompany(label, { isNew });
};

// ─── Owner tree ───────────────────────────────────────────────────────────────

const buildOwnerTree = (bi: any, ctx: BuildCtx): TreeNode | null => {
  const companies: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTarget(c, false, ctx)),
    ...(bi?.newCompanies || []).map((c: any) => buildTarget(c, true, ctx)),
  ];
  if (companies.length === 0) return null;
  const root = mkPerson(ctx.selfName, undefined, ctx.selfId || ctx.selfName);
  root.children = companies;
  return root;
};

// ─── Visual ───────────────────────────────────────────────────────────────────

const LINE = "rgba(100,116,139,0.45)";

const NodeBox = ({ node, compact }: { node: TreeNode; compact: boolean }) => {
  const isPerson = node.kind === "person";
  const isHolding = node.isHolding;
  const isRef = node.isReference;
  const w = compact ? "w-[88px]" : "w-[112px]";

  let boxCls = "";
  let textCls = "";
  let pctCls = "";

  if (isPerson) {
    boxCls = isRef
      ? "bg-amber-50 border-amber-300 border-dashed opacity-70"
      : "bg-amber-100 border-amber-400";
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
        {isRef && (
          <span className={`text-[8px] ${textCls} opacity-50`}>↑ מוצג לעיל</span>
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
  const {
    currentStep,
    businessInfo,
    spouseBusinessInfo,
    personalInfo,
    detailedInfo,
    spouseInfo,
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
  const selfId = (detailedInfo?.idNumber || "").trim();
  const spouseRaw = (personalInfo?.spouseName || personalInfo?.spouseFirstName || "").trim();
  const spouseName = spouseRaw || "בן/בת זוג";
  const spouseId = (spouseInfo?.idNumber || "").trim();

  const trees = useMemo(() => {
    const spouseInjected = { v: false };
    const seenIds = new Set<string>();

    // Mark the self person as seen so they never appear as a duplicate node
    if (selfId) seenIds.add(selfId);
    else seenIds.add(selfName);

    // Build user's tree (spouse injection happens here if spouse is co-owner)
    const userCtx: BuildCtx = {
      selfName,
      selfId,
      spouseName,
      spouseId,
      spouseBI: spouseBusinessInfo,
      spouseInjected,
      seenIds,
    };
    const my = buildOwnerTree(businessInfo, userCtx);

    // Spouse gets a separate tree only if they were NOT injected into user's tree
    const result: TreeNode[] = [];
    if (my) result.push(my);

    if (spouseRaw && !spouseInjected.v) {
      const spouseCtx: BuildCtx = {
        selfName: spouseName,
        selfId: spouseId,
        spouseName: selfName,
        spouseId: selfId,
        spouseBI: null,
        spouseInjected: { v: false },
        seenIds, // share registry so cross-tree dedup works
      };
      const sp = buildOwnerTree(spouseBusinessInfo, spouseCtx);
      if (sp) result.push(sp);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(businessInfo),
    JSON.stringify(spouseBusinessInfo),
    selfName, selfId,
    spouseName, spouseId,
    tick,
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
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground/70">
          <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-amber-300 bg-amber-50 shrink-0" /> מוצג לעיל
        </span>
      </div>
    </div>
  );
};
