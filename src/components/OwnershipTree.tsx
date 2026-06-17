import { useFormContext } from "@/contexts/FormContext";
import { Building2, Network, User } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeKind = "person" | "company";

type OwnerLabel = {
  name: string;
  pct?: string;
  isSpouseLink?: boolean; // spouse is also a root node in another tree
};

type TreeNode = {
  kind: NodeKind;
  label: string;
  owners?: OwnerLabel[];
  isNew?: boolean;
  isHolding?: boolean;
  isActive?: boolean;    // currently being edited in the form
  isSpouseRoot?: boolean; // spouse's root person box
  children: TreeNode[];
};

type Ctx = {
  selfName: string;
  spouseName: string;
  spouseHasOwnTree: boolean; // whether spouse has a separate tree (so we add isSpouseLink)
  activeLabel: string | null;
};

// ─── Factories ────────────────────────────────────────────────────────────────

const mkPerson = (name: string, opts: { isSpouseRoot?: boolean } = {}): TreeNode =>
  ({ kind: "person", label: name, isSpouseRoot: opts.isSpouseRoot, children: [] });

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

const isSelf = (sh: any, selfName: string) =>
  sh?.isSelf ||
  sh?.personOwnerType === "self" ||
  (sh?.holderType !== "company" && sh?.name?.trim() === selfName?.trim());

// Resolve a shareholder's display name — handles persons AND company shareholders
const holderName = (sh: any, ctx: Ctx): string => {
  if (sh?.isSelf || sh?.personOwnerType === "self") return ctx.selfName;
  if (sh?.isSpouse || sh?.personOwnerType === "spouse") return ctx.spouseName;
  if (sh?.personOwnerType === "other") return sh?.personOwner?.name?.trim() || "אדם פרטי";
  // Company-type shareholder (holderType === "company" in new-company flow)
  if (sh?.holderType === "company") {
    return sh?.isExistingCompany === false
      ? (sh?.requestedName1?.trim() || "חברה")
      : (sh?.companyName?.trim() || sh?.name?.trim() || "חברה");
  }
  return sh?.name?.trim() || "אדם פרטי";
};

// Collect owner labels for a company box, self first then others
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
    const name = holderName(sh, ctx);
    result.push({
      name,
      pct: sh.percentage,
      isSpouseLink: ctx.spouseHasOwnTree && name === ctx.spouseName,
    });
  }
  return result;
};

// ─── Build target company ─────────────────────────────────────────────────────

const buildTarget = (t: any, isNew: boolean, ctx: Ctx, depth = 0): TreeNode => {
  const label = isNew
    ? (t.requestedName1?.trim() || "חברה חדשה")
    : (t.name?.trim() || "חברה קיימת");

  const active = !!ctx.activeLabel && ctx.activeLabel === (isNew ? t.requestedName1?.trim() : t.name?.trim());
  const st = t.shareholderType;

  if (!st || st === "alone") {
    return mkCompany(label, {
      isNew,
      active,
      owners: [{ name: ctx.selfName, pct: "100" }],
    });
  }

  if (st === "other") {
    const owners = collectOwners(t.shareholders || [], ctx);
    return mkCompany(label, { isNew, active, owners });
  }

  if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    const otherDirect = (t.shareholders || []).filter((s: any) => !isSelf(s, ctx.selfName));
    const targetOwners: OwnerLabel[] = otherDirect.map((sh: any) => ({
      name: holderName(sh, ctx),
      pct: sh.percentage,
      isSpouseLink: ctx.spouseHasOwnTree && holderName(sh, ctx) === ctx.spouseName,
    }));
    const target = mkCompany(label, { isNew, active, owners: targetOwners.length ? targetOwners : undefined });
    return buildHoldingChain(svc, ctx, target, depth + 1, active);
  }

  return mkCompany(label, { isNew, active });
};

// ─── Build holding chain ──────────────────────────────────────────────────────

const buildHoldingChain = (svc: any, ctx: Ctx, bottomNode: TreeNode, depth = 0, parentActive = false): TreeNode => {
  if (!svc || depth > 10) return bottomNode;

  // Match the form's own display logic: companyName first, then requestedName1
  const label =
    svc?.companyName?.trim() ||
    svc?.requestedName1?.trim() ||
    svc?.name?.trim() ||
    "חברה מחזיקה";

  const isNew = svc?.isExistingCompany === false;
  const shList = svc?.shareholders || [];
  const owners =
    shList.length > 0
      ? collectOwners(shList, ctx, svc?.selfPercentage)
      : [{ name: ctx.selfName }];

  const holding = mkCompany(label, { isNew, isHolding: true, owners, active: parentActive });
  holding.children.push(bottomNode);

  const sub = svc?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && svc.childCompany) {
    return buildHoldingChain(svc.childCompany, ctx, holding, depth + 1, parentActive);
  }

  return holding;
};

// ─── Build owner tree ─────────────────────────────────────────────────────────

const buildOwnerTree = (bi: any, ownerName: string, isSpouseTree: boolean, ctx: Ctx): TreeNode | null => {
  const companies: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTarget(c, false, ctx)),
    ...(bi?.newCompanies || []).map((c: any) => buildTarget(c, true, ctx)),
  ];
  if (companies.length === 0) return null;
  const root = mkPerson(ownerName, { isSpouseRoot: isSpouseTree });
  root.children = companies;
  return root;
};

// ─── Visual ───────────────────────────────────────────────────────────────────

const LINE = "rgba(100,116,139,0.45)";
const SPOUSE_COLOR = "#f59e0b"; // amber-500

type NodeBoxProps = {
  node: TreeNode;
  compact: boolean;
  spouseName: string;
};

const NodeBox = ({ node, compact, spouseName }: NodeBoxProps) => {
  const isPerson = node.kind === "person";
  const isHolding = node.isHolding;
  const isActive = node.isActive;
  const isSpouseRoot = node.isSpouseRoot;
  const w = compact ? "w-[100px]" : "w-[124px]";

  let boxCls = "", textCls = "", dividerCls = "";
  if (isPerson) {
    boxCls = isSpouseRoot
      ? "bg-amber-100 border-amber-500 border-2"
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

  const pad = compact ? "px-1.5 py-1" : "px-2 py-1.5";
  const iconSz = compact ? "w-3 h-3" : "w-3.5 h-3.5";
  const lblSz = compact ? "text-[9px]" : "text-[10px]";
  const ownerSz = compact ? "text-[8px]" : "text-[9px]";

  const activeRing = isActive ? " ring-2 ring-yellow-400 shadow-yellow-300 shadow-md" : "";

  const dataAttr = isPerson
    ? { "data-person-root": node.label }
    : {};

  return (
    <div
      {...dataAttr}
      className={`${w} rounded-lg border-2 ${boxCls}${activeRing} overflow-hidden shadow-sm shrink-0`}
    >
      <div className={`${pad} flex flex-col items-center gap-0.5`}>
        {isPerson
          ? <User className={`${iconSz} ${textCls}`} />
          : <Building2 className={`${iconSz} ${textCls}`} />}
        <span className={`${lblSz} font-bold text-center leading-tight break-words ${textCls}`}>
          {node.label}
        </span>
        {node.isNew && <span className={`text-[8px] ${textCls} opacity-60`}>חדש</span>}
        {isHolding && !node.isNew && <span className={`text-[8px] ${textCls} opacity-60`}>אחזקות</span>}
      </div>
      {node.owners && node.owners.length > 0 && (
        <div className={`border-t-2 ${dividerCls}`}>
          {node.owners.map((o, i) => (
            <div
              key={i}
              data-owner-ref={o.isSpouseLink ? o.name : undefined}
              className={[
                ownerSz,
                "font-semibold text-center py-0.5 px-1 leading-tight",
                o.isSpouseLink ? "text-amber-700 bg-amber-50/80" : textCls,
                i > 0 ? `border-t ${dividerCls}` : "",
              ].join(" ")}
            >
              {o.name}{o.pct ? ` ${o.pct}%` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type TreeNodeViewProps = {
  node: TreeNode;
  compact: boolean;
  spouseName: string;
};

const TreeNodeView = ({ node, compact, spouseName }: TreeNodeViewProps) => {
  const drop = compact ? 18 : 24;
  const gapX = compact ? 8 : 14;
  const hasChildren = node.children.length > 0;

  return (
    <div className="inline-flex flex-col items-center shrink-0">
      <NodeBox node={node} compact={compact} spouseName={spouseName} />
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
                  <TreeNodeView node={child} compact={compact} spouseName={spouseName} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── SVG connector lines between spouse root and spouse owner labels ──────────

type LineSpec = { x1: number; y1: number; x2: number; y2: number };

const ConnectorSVG = ({ lines }: { lines: LineSpec[] }) => (
  <>
    {lines.map((l, i) => {
      const mx = (l.x1 + l.x2) / 2;
      const my = (l.y1 + l.y2) / 2;
      return (
        <path
          key={i}
          d={`M ${l.x1} ${l.y1} Q ${mx} ${l.y1} ${mx} ${my} Q ${mx} ${l.y2} ${l.x2} ${l.y2}`}
          stroke={SPOUSE_COLOR}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeDasharray="5 3"
          fill="none"
        />
      );
    })}
  </>
);

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
  const [connLines, setConnLines] = useState<LineSpec[]>([]);
  const overflowRef = useRef<HTMLDivElement>(null);
  const prevBIRef = useRef<string>("");
  const prevSpouseBIRef = useRef<string>("");

  // React to input events for tree re-render
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

  // Track which company was last modified → active highlight
  useEffect(() => {
    const currStr = JSON.stringify(businessInfo || {});
    if (currStr === prevBIRef.current) return;
    const prev = prevBIRef.current ? JSON.parse(prevBIRef.current) : null;
    prevBIRef.current = currStr;
    if (!prev) return;

    const currExisting = (businessInfo?.existingCompanies || []) as any[];
    const prevExisting = (prev?.existingCompanies || []) as any[];
    for (let i = 0; i < currExisting.length; i++) {
      if (JSON.stringify(currExisting[i]) !== JSON.stringify(prevExisting[i])) {
        setActiveLabel(currExisting[i]?.name?.trim() || null);
        return;
      }
    }
    const currNew = (businessInfo?.newCompanies || []) as any[];
    const prevNew = (prev?.newCompanies || []) as any[];
    for (let i = 0; i < currNew.length; i++) {
      if (JSON.stringify(currNew[i]) !== JSON.stringify(prevNew[i])) {
        setActiveLabel(currNew[i]?.requestedName1?.trim() || null);
        return;
      }
    }
  }, [businessInfo]);

  useEffect(() => {
    const currStr = JSON.stringify(spouseBusinessInfo || {});
    if (currStr === prevSpouseBIRef.current) return;
    const prev = prevSpouseBIRef.current ? JSON.parse(prevSpouseBIRef.current) : null;
    prevSpouseBIRef.current = currStr;
    if (!prev) return;

    const currExisting = (spouseBusinessInfo?.existingCompanies || []) as any[];
    const prevExisting = (prev?.existingCompanies || []) as any[];
    for (let i = 0; i < currExisting.length; i++) {
      if (JSON.stringify(currExisting[i]) !== JSON.stringify(prevExisting[i])) {
        setActiveLabel(currExisting[i]?.name?.trim() || null);
        return;
      }
    }
    const currNew = (spouseBusinessInfo?.newCompanies || []) as any[];
    const prevNew = (prev?.newCompanies || []) as any[];
    for (let i = 0; i < currNew.length; i++) {
      if (JSON.stringify(currNew[i]) !== JSON.stringify(prevNew[i])) {
        setActiveLabel(currNew[i]?.requestedName1?.trim() || null);
        return;
      }
    }
  }, [spouseBusinessInfo]);

  const selfName = (personalInfo?.firstName || "").trim() || "אני";
  const spouseRaw = (personalInfo?.spouseName || personalInfo?.spouseFirstName || "").trim();
  const spouseName = spouseRaw || "בן/בת זוג";

  const spouseHasOwnTree =
    !!spouseRaw &&
    ((spouseBusinessInfo?.existingCompanies?.length || 0) +
      (spouseBusinessInfo?.newCompanies?.length || 0)) > 0;

  const trees = useMemo(() => {
    const result: TreeNode[] = [];

    const userCtx: Ctx = { selfName, spouseName, spouseHasOwnTree, activeLabel };
    const my = buildOwnerTree(businessInfo, selfName, false, userCtx);
    if (my) result.push(my);

    if (spouseRaw) {
      const spouseCtx: Ctx = {
        selfName: spouseName,
        spouseName: selfName,
        spouseHasOwnTree: false,
        activeLabel,
      };
      const sp = buildOwnerTree(spouseBusinessInfo, spouseName, true, spouseCtx);
      if (sp) result.push(sp);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(businessInfo),
    JSON.stringify(spouseBusinessInfo),
    selfName, spouseName, spouseHasOwnTree, activeLabel, tick,
  ]);

  // Draw SVG lines between spouse owner labels and spouse root box
  useLayoutEffect(() => {
    const container = overflowRef.current;
    if (!container || !spouseHasOwnTree) {
      setConnLines([]);
      return;
    }

    const cRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const spouseRoot = container.querySelector(`[data-person-root="${CSS.escape(spouseName)}"]`);
    const ownerRefs = container.querySelectorAll(`[data-owner-ref="${CSS.escape(spouseName)}"]`);

    if (!spouseRoot || ownerRefs.length === 0) {
      setConnLines([]);
      return;
    }

    const sRect = spouseRoot.getBoundingClientRect();
    const sx = sRect.left + sRect.width / 2 - cRect.left + scrollLeft;
    const sy = sRect.top + sRect.height / 2 - cRect.top + scrollTop;

    const lines: LineSpec[] = [];
    for (const ref of ownerRefs) {
      const rRect = ref.getBoundingClientRect();
      const rx = rRect.left + rRect.width / 2 - cRect.left + scrollLeft;
      const ry = rRect.top + rRect.height / 2 - cRect.top + scrollTop;
      lines.push({ x1: sx, y1: sy, x2: rx, y2: ry });
    }
    setConnLines(lines);
  }, [trees, tick, spouseHasOwnTree, spouseName]);

  if (currentStep !== 3 || trees.length === 0) return null;

  const svgW = overflowRef.current?.scrollWidth ?? 0;
  const svgH = overflowRef.current?.scrollHeight ?? 0;

  return (
    <div
      className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-4"}`}
      dir="rtl"
    >
      <div className={`flex items-center gap-2 text-primary font-bold mb-3 text-sm`}>
        <Network className="w-4 h-4" />
        מפת השליטה בחברה
      </div>

      <div ref={overflowRef} className="overflow-auto relative">
        {/* SVG connector lines overlay */}
        {connLines.length > 0 && svgW > 0 && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: svgW,
              height: svgH,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <ConnectorSVG lines={connLines} />
          </svg>
        )}

        <div className="flex items-start justify-center gap-10 min-w-max pb-2 pt-1">
          {trees.map((tree, i) => (
            <TreeNodeView key={i} node={tree} compact={compact} spouseName={spouseName} />
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
          <span className="w-3.5 h-3.5 rounded border-2 border-yellow-400 ring-1 ring-yellow-400 shrink-0" /> נמלא כעת
        </span>
      </div>
    </div>
  );
};
