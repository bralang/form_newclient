import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeKind = "person" | "company";

type OwnerLabel = {
  name: string;
  pct?: string;
  isSpouseLink?: boolean;
};

type TreeNode = {
  kind: NodeKind;
  label: string;
  owners?: OwnerLabel[];
  isNew?: boolean;
  isHolding?: boolean;
  isActive?: boolean;
  isSpouseRoot?: boolean;
  children: TreeNode[];
};

type Ctx = {
  selfName: string;
  spouseName: string;
  spouseHasOwnTree: boolean;
  activeLabel: string | null;
};

// ─── Factories ────────────────────────────────────────────────────────────────

const mkPerson = (name: string, isSpouseRoot = false): TreeNode =>
  ({ kind: "person", label: name, isSpouseRoot, children: [] });

const mkCompany = (
  label: string,
  opts: { isNew?: boolean; isHolding?: boolean; owners?: OwnerLabel[]; active?: boolean } = {}
): TreeNode => ({
  kind: "company",
  label,
  isNew: opts.isNew,
  isHolding: opts.isHolding,
  owners: opts.owners,
  isActive: opts.active,
  children: [],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isSelf = (sh: any, selfName: string): boolean =>
  !!sh?.isSelf ||
  sh?.personOwnerType === "self" ||
  (!sh?.holderType && sh?.name?.trim() === selfName?.trim());

const isCompanyHolder = (sh: any): boolean =>
  sh?.holderType === "company" || sh?.holderType === "self_via_company";

// Resolve display name for any shareholder type
const holderName = (sh: any, ctx: Ctx): string => {
  if (sh?.isSelf || sh?.personOwnerType === "self") return ctx.selfName;
  if (sh?.isSpouse || sh?.personOwnerType === "spouse") return ctx.spouseName;
  if (sh?.personOwnerType === "other") return sh?.personOwner?.name?.trim() || "אדם פרטי";
  if (isCompanyHolder(sh)) {
    // Company-type shareholder — name is in companyName (existing) or requestedName1 (new)
    return sh?.isExistingCompany === false
      ? (sh?.requestedName1?.trim() || "חברה חדשה")
      : (sh?.companyName?.trim() || sh?.requestedName1?.trim() || sh?.name?.trim() || "חברה");
  }
  return sh?.name?.trim() || "אדם פרטי";
};

// Collect owner labels for a company footer (self first, then others)
const collectOwners = (shList: any[], ctx: Ctx, overrideSelfPct?: string): OwnerLabel[] => {
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
    if (isCompanyHolder(sh)) continue; // company shareholders show as nodes, not owner labels
    const name = holderName(sh, ctx);
    result.push({
      name,
      pct: sh.percentage,
      isSpouseLink: ctx.spouseHasOwnTree && name === ctx.spouseName,
    });
  }
  return result;
};

// ─── Holding chain (top-down) ─────────────────────────────────────────────────

const buildHoldingChain = (svc: any, ctx: Ctx, bottomNode: TreeNode, depth = 0): TreeNode => {
  if (!svc || depth > 10) return bottomNode;

  const label =
    svc?.companyName?.trim() ||
    svc?.requestedName1?.trim() ||
    svc?.name?.trim() ||
    "חברה מחזיקה";

  const isNew = svc?.isExistingCompany === false;

  const shList = svc?.shareholders || [];
  const sub = svc?.subOwnerType;
  const hasChildCompany = (sub === "company" || sub === "self_via_company") && !!svc.childCompany;
  const owners = shList.length > 0
    ? collectOwners(shList, ctx)
    : hasChildCompany
      // This holding company is itself held by the child company — show that as owner
      ? [{ name: svc.childCompany?.companyName?.trim() || svc.childCompany?.requestedName1?.trim() || "חברת אחזקות" }]
      : [{ name: ctx.selfName }];

  const holdingActive = !!ctx.activeLabel && ctx.activeLabel === label;
  const holding = mkCompany(label, { isNew, isHolding: true, owners, active: holdingActive });
  holding.children.push(bottomNode);

  if (hasChildCompany) {
    return buildHoldingChain(svc.childCompany, ctx, holding, depth + 1);
  }

  return holding;
};

// ─── Build target company ─────────────────────────────────────────────────────

const buildTarget = (t: any, isNew: boolean, ctx: Ctx, depth = 0): TreeNode => {
  const label = isNew
    ? (t.requestedName1?.trim() || "חברה חדשה")
    : (t.name?.trim() || "חברה קיימת");

  const active = !!ctx.activeLabel &&
    ctx.activeLabel === (isNew ? t.requestedName1?.trim() : t.name?.trim());

  const st = t.shareholderType;

  // ── Not yet chosen ─────────────────────────────────────────────────────────
  if (!st) {
    return mkCompany(label, { isNew, active });
  }

  // ── Alone ──────────────────────────────────────────────────────────────────
  if (st === "alone") {
    return mkCompany(label, { isNew, active, owners: [{ name: ctx.selfName, pct: "100" }] });
  }

  // ── Self via holding company (explicit shareholderType) ────────────────────
  if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    const holdingLabel = svc?.companyName?.trim() || svc?.requestedName1?.trim() || null;
    const otherDirect = (t.shareholders || []).filter((s: any) => !isSelf(s, ctx.selfName) && !isCompanyHolder(s) && !s.isSpouse);
    const targetOwners: OwnerLabel[] = [
      ...(holdingLabel ? [{ name: holdingLabel, pct: isNew ? svc?.percentage : undefined }] : []),
      ...otherDirect.map((sh: any) => ({
        name: holderName(sh, ctx),
        pct: sh.percentage,
        isSpouseLink: ctx.spouseHasOwnTree && holderName(sh, ctx) === ctx.spouseName,
      })),
    ];
    const target = mkCompany(label, { isNew, active, owners: targetOwners.length ? targetOwners : undefined });
    return buildHoldingChain(svc, ctx, target, depth + 1);
  }

  // ── Other (co-owners; possibly one is a company holding vehicle) ───────────
  if (st === "other") {
    const shList: any[] = t.shareholders || [];

    // If self's entry is a "self_via_company" type — build holding chain
    const selfViaEntry = shList.find((s: any) =>
      s.holderType === "self_via_company" ||
      (isSelf(s, ctx.selfName) && s.holderType === "company")
    );

    if (selfViaEntry) {
      const holdingLabel = selfViaEntry?.companyName?.trim() || selfViaEntry?.requestedName1?.trim() || null;
      const otherPersonOwners: OwnerLabel[] = [
        ...(holdingLabel ? [{ name: holdingLabel, pct: isNew ? selfViaEntry?.percentage : undefined }] : []),
        // Exclude self (via holding chain) and auto-included spouse (isSpouse:true);
        // the spouse's indirect ownership is shown via the holding company's owner list
        ...shList
          .filter((s: any) => !isSelf(s, ctx.selfName) && !isCompanyHolder(s) && !s.isSpouse)
          .map((sh: any) => ({
            name: holderName(sh, ctx),
            pct: sh.percentage,
            isSpouseLink: ctx.spouseHasOwnTree && holderName(sh, ctx) === ctx.spouseName,
          })),
      ];
      const target = mkCompany(label, {
        isNew,
        active,
        owners: otherPersonOwners.length ? otherPersonOwners : undefined,
      });
      return buildHoldingChain(selfViaEntry, ctx, target, depth + 1);
    }

    // All shareholders are persons — collect into footer
    const owners = collectOwners(shList, ctx);
    return mkCompany(label, { isNew, active, owners });
  }

  return mkCompany(label, { isNew, active });
};

// ─── Build owner tree ─────────────────────────────────────────────────────────

const buildOwnerTree = (bi: any, ownerName: string, isSpouseTree: boolean, ctx: Ctx): TreeNode | null => {
  const companies: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTarget(c, false, ctx)),
    ...(bi?.newCompanies || []).map((c: any) => buildTarget(c, true, ctx)),
  ];
  if (companies.length === 0) return null;
  const root = mkPerson(ownerName, isSpouseTree);
  root.children = companies;
  return root;
};

// ─── Spouse co-ownership tree ─────────────────────────────────────────────────

// Checks if an entry refers to the spouse — by flag, role, or matching display name
const isSpouseEntry = (s: any, spouseName: string): boolean =>
  !!s.isSpouse ||
  s.personOwnerType === "spouse" ||
  (!!s.name && !!spouseName && s.name.trim() === spouseName.trim());

// Returns holding-company nodes for cases where the SPOUSE appears as a co-owner
// in the user's holding-company shareholder list (isSelf/isSpouse relative to the filler).
const buildSpouseCoownedNodes = (
  bi: any,
  selfName: string,
  spouseName: string,
  activeLabel: string | null,
): TreeNode[] => {
  const nodes: TreeNode[] = [];

  const processHolding = (svc: any, targetLabel: string, targetIsNew: boolean) => {
    const holdingShList: any[] = svc?.shareholders || [];
    if (!holdingShList.some((s: any) => isSpouseEntry(s, spouseName))) return;

    const holdingLabel = svc?.companyName?.trim() || svc?.requestedName1?.trim() || "חברת אחזקות";
    const holdingIsNew = svc?.isExistingCompany === false;

    // Target node — show holding company's stake if new
    const targetOwners: OwnerLabel[] = targetIsNew && holdingLabel
      ? [{ name: holdingLabel, pct: svc?.percentage }] : [];
    const target = mkCompany(targetLabel, {
      isNew: targetIsNew,
      active: activeLabel === targetLabel,
      owners: targetOwners.length ? targetOwners : undefined,
    });

    // Holding company owners — use collectOwners so the implicit self-owner is always included
    const ownerCtx: Ctx = { selfName, spouseName, spouseHasOwnTree: false, activeLabel: null };
    const holdingOwners: OwnerLabel[] = collectOwners(holdingShList, ownerCtx);
    const holding = mkCompany(holdingLabel, {
      isNew: holdingIsNew,
      isHolding: true,
      owners: holdingOwners.length ? holdingOwners : undefined,
      active: activeLabel === holdingLabel,
    });
    holding.children.push(target);
    nodes.push(holding);
  };

  const allCompanies = [
    ...(bi?.existingCompanies || []).map((c: any) => ({ c, isNew: false })),
    ...(bi?.newCompanies || []).map((c: any) => ({ c, isNew: true })),
  ];

  for (const { c, isNew } of allCompanies) {
    const label = isNew
      ? (c.requestedName1?.trim() || "חברה חדשה")
      : (c.name?.trim() || "חברה קיימת");

    if (c.shareholderType === "self_via_company") {
      processHolding(c.selfViaCompany, label, isNew);
    } else if (c.shareholderType === "other") {
      const selfViaEntry = (c.shareholders || []).find(
        (s: any) => s.holderType === "self_via_company" || (s.isSelf && s.holderType === "company")
      );
      if (selfViaEntry) processHolding(selfViaEntry, label, isNew);
    }
  }

  return nodes;
};

// Deduplicates holding company nodes with the same label (merge their children)
const deduplicateHolding = (nodes: TreeNode[]): TreeNode[] => {
  const seen = new Map<string, TreeNode>();
  const result: TreeNode[] = [];
  for (const node of nodes) {
    if (!node.isHolding) { result.push(node); continue; }
    const prev = seen.get(node.label);
    if (prev) {
      for (const child of node.children) {
        if (!prev.children.some(c => c.label === child.label)) prev.children.push(child);
      }
    } else {
      seen.set(node.label, node);
      result.push(node);
    }
  }
  return result;
};

// Finds the label of whichever holding chain level was actually edited
const findEditedHoldingLabel = (curr: any, prev: any): string | null => {
  const deepLabel = (svc: any, prevSvc: any): string | null => {
    if (!svc) return null;
    const name = svc?.companyName?.trim() || svc?.requestedName1?.trim() || null;
    const flat = (x: any) => ({ ...x, childCompany: undefined, shareholders: undefined });
    if (JSON.stringify(flat(svc)) !== JSON.stringify(flat(prevSvc || {}))) return name;
    if (JSON.stringify(svc.shareholders || []) !== JSON.stringify((prevSvc || {}).shareholders || [])) return name;
    if (svc?.childCompany) return deepLabel(svc.childCompany, (prevSvc || {}).childCompany);
    return null;
  };
  const currSVC = curr?.selfViaCompany;
  const prevSVC = (prev || {})?.selfViaCompany;
  if (currSVC && JSON.stringify(currSVC) !== JSON.stringify(prevSVC || {})) {
    return deepLabel(currSVC, prevSVC);
  }
  const currSh: any[] = curr?.shareholders || [];
  const prevSh: any[] = (prev || {})?.shareholders || [];
  for (let j = 0; j < currSh.length; j++) {
    const s = currSh[j];
    if (s?.holderType === "self_via_company" && JSON.stringify(s) !== JSON.stringify(prevSh[j] || {})) {
      return deepLabel(s, prevSh[j]);
    }
  }
  return null;
};

const hasSpouseCoowned = (bi: any, spouseName: string): boolean => {
  for (const c of [...(bi?.existingCompanies || []), ...(bi?.newCompanies || [])]) {
    if (c.shareholderType === "self_via_company") {
      if ((c.selfViaCompany?.shareholders || []).some((s: any) => isSpouseEntry(s, spouseName))) return true;
    } else if (c.shareholderType === "other") {
      const sve = (c.shareholders || []).find(
        (s: any) => s.holderType === "self_via_company" || (s.isSelf && s.holderType === "company")
      );
      if (sve && (sve.shareholders || []).some((s: any) => isSpouseEntry(s, spouseName))) return true;
    }
  }
  return false;
};

// ─── Visual ───────────────────────────────────────────────────────────────────

const LINE = "rgba(100,116,139,0.45)";

const NodeBox = ({ node, compact }: { node: TreeNode; compact: boolean }) => {
  const isPerson = node.kind === "person";
  const isHolding = node.isHolding;
  const isActive = node.isActive;
  const isSpouseRoot = node.isSpouseRoot;
  const w = compact ? "w-[100px]" : "w-[124px]";

  let boxCls = "", textCls = "", dividerCls = "";
  if (isPerson) {
    boxCls = isSpouseRoot
      ? "bg-amber-100 border-amber-500"
      : "bg-amber-100 border-amber-400";
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

  const activeRing = isActive ? " ring-4 ring-red-500 shadow-red-400 shadow-md" : "";
  const pad = compact ? "px-1.5 py-1" : "px-2 py-1.5";
  const iconSz = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const lblSz = compact ? "text-[9px]" : "text-[10px]";
  const ownerSz = compact ? "text-[8px]" : "text-[9px]";

  return (
    <div
      className={`${w} rounded-lg border-2 ${boxCls}${activeRing} overflow-hidden shadow-sm shrink-0`}
    >
      <div className={`${pad} flex flex-col items-center gap-0.5`}>
        {isPerson
          ? <User className={`${iconSz} ${textCls}`} />
          : <Building2 className={`${iconSz} ${textCls}`} />}
        <span className={`${lblSz} font-bold text-center leading-tight break-words ${textCls}`}>
          {node.label}
        </span>
        {node.isNew && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-400 leading-none">
            חדש
          </span>
        )}
        {!node.isNew && !isPerson && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${isHolding ? "bg-amber-100 text-amber-700 border border-amber-400" : "bg-slate-100 text-slate-500 border border-slate-300"}`}>
            {isHolding ? "אחזקות" : "קיים"}
          </span>
        )}
      </div>
      {node.owners && node.owners.length > 0 && (
        <div className={`border-t-2 ${dividerCls}`}>
          {node.owners.map((o, i) => (
            <div
              key={i}
              className={[
                ownerSz,
                "font-semibold text-center py-0.5 px-1 leading-tight",
                o.isSpouseLink ? "text-amber-700 bg-amber-50" : textCls,
                i > 0 ? `border-t ${dividerCls}` : "",
              ].join(" ")}
            >
              {o.name}{(node.isNew && o.pct) ? ` ${o.pct}%` : ""}
            </div>
          ))}
          {(() => {
            const total = node.owners.reduce((s, o) => s + (parseFloat(o.pct || "0") || 0), 0);
            if (node.isNew && total > 0 && Math.abs(total - 100) < 0.01) {
              return (
                <div className={`${ownerSz} text-center py-0.5 font-bold text-green-700 border-t ${dividerCls} bg-green-50`}>
                  ✓ 100%
                </div>
              );
            }
            return null;
          })()}
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
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const prevBIRef = useRef<string>("");
  const prevSpouseBIRef = useRef<string>("");

  // Re-render on any form input event
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

  // Track last modified company → active highlight.
  // Highlights the holding company when its own fields are being edited,
  // otherwise highlights the top-level target company.
  useEffect(() => {
    const curr = JSON.stringify(businessInfo || {});
    if (curr === prevBIRef.current) return;
    const prev = prevBIRef.current ? JSON.parse(prevBIRef.current) : null;
    prevBIRef.current = curr;
    if (!prev) return;
    for (const [key, suffix] of [["existingCompanies", "name"], ["newCompanies", "requestedName1"]] as const) {
      const currList = ((businessInfo || {})[key] || []) as any[];
      const prevList = ((prev)[key] || []) as any[];
      for (let i = 0; i < currList.length; i++) {
        if (JSON.stringify(currList[i]) !== JSON.stringify(prevList[i] || {})) {
          const holdingLabel = findEditedHoldingLabel(currList[i], prevList[i] || {});
          if (holdingLabel) { setActiveLabel(holdingLabel); return; }
          setActiveLabel(currList[i]?.[suffix]?.trim() || null);
          return;
        }
      }
    }
  }, [businessInfo]);

  useEffect(() => {
    const curr = JSON.stringify(spouseBusinessInfo || {});
    if (curr === prevSpouseBIRef.current) return;
    const prev = prevSpouseBIRef.current ? JSON.parse(prevSpouseBIRef.current) : null;
    prevSpouseBIRef.current = curr;
    if (!prev) return;
    for (const [key, suffix] of [["existingCompanies", "name"], ["newCompanies", "requestedName1"]] as const) {
      const currList = ((spouseBusinessInfo || {})[key] || []) as any[];
      const prevList = ((prev)[key] || []) as any[];
      for (let i = 0; i < currList.length; i++) {
        if (JSON.stringify(currList[i]) !== JSON.stringify(prevList[i] || {})) {
          const holdingLabel = findEditedHoldingLabel(currList[i], prevList[i] || {});
          if (holdingLabel) { setActiveLabel(holdingLabel); return; }
          setActiveLabel(currList[i]?.[suffix]?.trim() || null);
          return;
        }
      }
    }
  }, [spouseBusinessInfo]);

  // Set active company on focus (click on any field in a company section)
  useEffect(() => {
    if (currentStep !== 3) return;
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as Element | null;
      if (!el) return;
      let node: Element | null = el.parentElement;
      while (node && node !== document.body) {
        for (const child of Array.from(node.children)) {
          if (child.tagName === "H4") {
            const text = child.textContent || "";
            if (text.includes("חברה קיימת") || text.includes("חברה חדשה")) {
              const match = text.match(/[–—]\s*(.+)$/);
              if (match) { setActiveLabel(match[1].trim()); return; }
            }
          }
        }
        node = node.parentElement;
      }
    };
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, [currentStep]);

  const selfName = (personalInfo?.firstName || "").trim() || "אני";
  const spouseRaw = (personalInfo?.spouseName || personalInfo?.spouseFirstName || "").trim();
  const spouseName = spouseRaw || "בן/בת זוג";

  const spouseHasOwnTree =
    !!spouseRaw &&
    (
      ((spouseBusinessInfo?.existingCompanies?.length || 0) + (spouseBusinessInfo?.newCompanies?.length || 0)) > 0 ||
      hasSpouseCoowned(businessInfo, spouseName)
    );

  const trees = useMemo(() => {
    const result: TreeNode[] = [];
    const userCtx: Ctx = { selfName, spouseName, spouseHasOwnTree, activeLabel };
    // Also pull in spouse's companies where the user appears as a co-owner
    const reverseCoowned = spouseRaw
      ? buildSpouseCoownedNodes(spouseBusinessInfo, spouseName, selfName, activeLabel)
      : [];
    const my = buildOwnerTree(businessInfo, selfName, false, userCtx);
    if (my) {
      my.children = deduplicateHolding([...my.children, ...reverseCoowned]);
      result.push(my);
    }
    if (spouseRaw) {
      const spouseCtx: Ctx = { selfName: spouseName, spouseName: selfName, spouseHasOwnTree: false, activeLabel };
      const sp = buildOwnerTree(spouseBusinessInfo, spouseName, true, spouseCtx);
      const coowned = buildSpouseCoownedNodes(businessInfo, selfName, spouseName, activeLabel);
      if (sp) {
        sp.children = deduplicateHolding([...sp.children, ...coowned]);
        result.push(sp);
      } else if (coowned.length > 0) {
        const spouseRoot = mkPerson(spouseName, true);
        spouseRoot.children = deduplicateHolding(coowned);
        result.push(spouseRoot);
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(businessInfo),
    JSON.stringify(spouseBusinessInfo),
    selfName, spouseName, spouseHasOwnTree, activeLabel, tick,
  ]);

  if (currentStep !== 3 || trees.length === 0) return null;

  return (
    <div
      className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-4"}`}
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-primary font-bold mb-3 text-sm">
        <Network className="w-4 h-4" />
        מפת השליטה בחברה
      </div>

      <div ref={overflowRef} className="overflow-auto">
        <div className="flex items-start justify-center gap-10 min-w-max pb-2 pt-1">
          {trees.map((tree, i) => (
            <TreeNodeView key={i} node={tree} compact={compact} />
          ))}
        </div>
      </div>

      {/* מקרא */}
      <div className="border-t border-border mt-3 pt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-foreground">
          <span className="w-3.5 h-3.5 rounded border-2 border-amber-400 bg-amber-100 shrink-0" /> אדם פרטי
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-foreground">
          <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-amber-500 bg-primary/10 shrink-0" /> חברת אחזקות
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-foreground">
          <span className="w-3.5 h-3.5 rounded border-2 border-primary bg-primary/10 shrink-0" /> חברה
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-600">
          <span className="w-3.5 h-3.5 rounded border-2 border-red-500 ring-2 ring-red-500 shrink-0" /> אתה כאן
        </span>
      </div>
    </div>
  );
};
