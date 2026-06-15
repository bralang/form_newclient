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
  coOwners?: TreeNode[]; // בעלי מניות נוספים — מוצגים לצד באותה רמה
};

const fillerLabel = (name: string) => name?.trim() || "אני";

const personNode = (label: string, pct?: string): TreeNode => ({
  kind: "person", label, percentage: pct, children: [],
});

const companyNode = (label: string, isNew = false, pct?: string): TreeNode => ({
  kind: "company", label, isNew, percentage: pct, children: [],
});

const isSelfShareholder = (sh: any, fillerName: string) => {
  if (!sh) return false;
  if (sh.isSelf) return true;
  if (sh.personOwnerType === "self") return true;
  if (sh.holderType === "person" && sh?.name?.trim() && sh.name.trim() === fillerName?.trim()) return true;
  return false;
};

const isSpouseShareholder = (sh: any) => {
  if (!sh) return false;
  if (sh.isSpouse) return true;
  if (sh.personOwnerType === "spouse") return true;
  return false;
};

// ─── buildShareholderCoOwner ─────────────────────────────────────────────────
// בונה צומת לבעל מניות שאינו ממלא השאלון (אדם פרטי או חברה).
// כשמדובר בחברה — מציגה את הבעלים שלה כילדים (מי שמאחורי החברה).
const buildShareholderCoOwner = (
  sh: any,
  fillerName: string,
  spouseName: string,
  depth = 0,
): TreeNode | null => {
  if (!sh || depth > 20) return null;

  if (isSpouseShareholder(sh)) return personNode(spouseName, sh.percentage);

  const ht = sh.holderType || "person";

  if (ht === "person") {
    const name =
      sh.personOwnerType === "other"
        ? sh?.personOwner?.name?.trim() || sh?.name?.trim() || "אדם פרטי"
        : sh?.name?.trim() || sh?.personOwner?.name?.trim() || "אדם פרטי";
    return personNode(name, sh.percentage);
  }

  // חברה שהיא בעלת מניות — בונה אותה עם הבעלים שלה כילדים
  const isNew = sh?.isExistingCompany === false;
  const label = isNew
    ? sh?.requestedName1?.trim() || "חברה חדשה"
    : sh?.companyName?.trim() || sh?.name?.trim() || "חברה";
  const node = companyNode(label, isNew, sh.percentage);
  node.isAlsoShareholder = true;

  // בעלי מניות של החברה הזו (מי שמאחוריה)
  const shList: any[] = Array.isArray(sh?.shareholders) ? sh.shareholders : [];
  for (const inner of shList) {
    if (isSelfShareholder(inner, fillerName)) continue;
    const child = buildShareholderCoOwner(inner, fillerName, spouseName, depth + 1);
    if (child) node.children.push(child);
  }

  // Path B — שרשרת subOwnerType
  const sub = sh?.subOwnerType;
  if (sub === "company" || sub === "self_via_company") {
    const child = buildShareholderCoOwner(sh.childCompany, fillerName, spouseName, depth + 1);
    if (child) node.children.push(child);
  } else if (sub === "person") {
    const pType = sh?.personOwnerType;
    if (pType === "spouse") node.children.push(personNode(spouseName));
    else if (pType === "other") node.children.push(personNode(sh?.personOwner?.name?.trim() || "אדם פרטי"));
  }

  return node;
};

// ─── buildHoldingTop ─────────────────────────────────────────────────────────
// בונה שרשרת חברות אחזקה מלמעלה למטה.
// מחזיר את הצומת העליונה ביותר בשרשרת, כשה-bottomNode הוא מה שהשרשרת מחזיקה.
const buildHoldingTop = (
  svc: any,
  fillerName: string,
  spouseName: string,
  bottomNode: TreeNode,
  depth = 0,
): TreeNode => {
  if (!svc || depth > 20) return bottomNode;

  const isNew = svc?.isExistingCompany === false;
  const label = isNew
    ? svc?.requestedName1?.trim() || "חברה חדשה"
    : svc?.companyName?.trim() || "חברה מחזיקה";

  const holdingNode = companyNode(label, isNew);
  holdingNode.isAlsoShareholder = true;
  // חברת ההחזקה מחזיקה ב-bottomNode
  holdingNode.children.push(bottomNode);

  // בעלי מניות נוספים של חברת ההחזקה (coOwners)
  const shList: any[] = Array.isArray(svc?.shareholders) ? svc.shareholders : [];
  const coOwners: TreeNode[] = [];
  for (const sh of shList) {
    if (isSelfShareholder(sh, fillerName)) continue;
    const co = buildShareholderCoOwner(sh, fillerName, spouseName, depth + 1);
    if (co) coOwners.push(co);
  }
  if (coOwners.length > 0) holdingNode.coOwners = coOwners;

  // מי מחזיק בחברת ההחזקה הזו?
  const sub = svc?.subOwnerType;
  if ((sub === "company" || sub === "self_via_company") && svc.childCompany) {
    // חברה נוספת מחזיקה בה — ממשיכים את השרשרת למעלה
    return buildHoldingTop(svc.childCompany, fillerName, spouseName, holdingNode, depth + 1);
  }

  // sub = "self" / "person" / לא מוגדר — זו הנקודה העליונה
  if (sub === "person" && svc?.personOwnerType === "other") {
    holdingNode.coOwners = [
      ...(holdingNode.coOwners || []),
      personNode(svc?.personOwner?.name?.trim() || "אדם פרטי"),
    ];
  }

  return holdingNode;
};

// ─── buildTargetNode ─────────────────────────────────────────────────────────
const buildTargetNode = (
  t: any,
  isNew: boolean,
  fillerName: string,
  spouseName: string,
): TreeNode => {
  const label = isNew
    ? t.requestedName1?.trim() || "חברה חדשה"
    : t.name?.trim() || "חברה קיימת";
  const st = t.shareholderType;

  if (st === "alone") {
    return companyNode(label, isNew, "100");
  }

  if (st === "self_via_company") {
    const svc = t.selfViaCompany || {};
    // חברת היעד היא בתחתית השרשרת
    const targetNode = companyNode(label, isNew, svc.percentage);
    // בעלי מניות נוספים של חברת היעד
    const targetCoOwners: TreeNode[] = [];
    for (const sh of (t.shareholders || [])) {
      if (isSelfShareholder(sh, fillerName)) continue;
      const co = buildShareholderCoOwner(sh, fillerName, spouseName);
      if (co) targetCoOwners.push(co);
    }
    if (targetCoOwners.length > 0) targetNode.coOwners = targetCoOwners;
    // מבנה נכון: [שרשרת ההחזקה] → [חברת יעד]
    return buildHoldingTop(svc, fillerName, spouseName, targetNode);
  }

  if (st === "other") {
    const shList = t.shareholders || [];
    const selfEntry = shList.find((s: any) => isSelfShareholder(s, fillerName));
    let ownerPct: string | undefined;
    if (selfEntry?.percentage) {
      ownerPct = selfEntry.percentage;
    } else {
      const sum = shList
        .filter((s: any) => !isSelfShareholder(s, fillerName))
        .reduce((acc: number, s: any) => acc + (parseFloat(s?.percentage) || 0), 0);
      ownerPct = sum > 0 && sum <= 100 ? String(100 - sum) : "?";
    }
    const node = companyNode(label, isNew, ownerPct);
    // בעלי מניות נוספים מוצגים לצד החברה
    const coOwners: TreeNode[] = [];
    for (const sh of shList) {
      if (isSelfShareholder(sh, fillerName)) continue;
      const co = buildShareholderCoOwner(sh, fillerName, spouseName);
      if (co) coOwners.push(co);
    }
    if (coOwners.length > 0) node.coOwners = coOwners;
    return node;
  }

  return companyNode(label, isNew);
};

// ─── buildForOwner ────────────────────────────────────────────────────────────
const buildForOwner = (bi: any, ownerName: string, spouseName: string): TreeNode | null => {
  const targets: TreeNode[] = [
    ...(bi?.existingCompanies || []).map((c: any) => buildTargetNode(c, false, ownerName, spouseName)),
    ...(bi?.newCompanies || []).map((c: any) => buildTargetNode(c, true, ownerName, spouseName)),
  ];
  if (targets.length === 0) return null;
  const root = personNode(ownerName);
  root.children = targets;
  return root;
};

// ─── Visual ───────────────────────────────────────────────────────────────────

const classesFor = (n: TreeNode) => {
  if (n.kind === "person")
    return { box: "bg-amber-100 border-amber-400", text: "text-amber-900", pct: "bg-amber-50 border-amber-300 text-amber-800" };
  if (n.isAlsoShareholder)
    return { box: "bg-primary/10 border-amber-500 border-dashed", text: "text-primary", pct: "bg-white/80 border-amber-400 text-amber-700" };
  return { box: "bg-primary/10 border-primary", text: "text-primary", pct: "bg-white/80 border-primary/40 text-primary" };
};

const NodeBox = ({ node, compact = false }: { node: TreeNode; compact?: boolean }) => {
  const c = classesFor(node);
  const w = compact ? "w-24" : "w-32";
  const pad = compact ? "px-2 py-1.5" : "px-3 py-2";
  const labelSize = compact ? "text-[10px]" : "text-xs";
  const pctSize = compact ? "text-[10px]" : "text-xs";

  return (
    <div className={`${w} rounded-md border-2 ${c.box} overflow-hidden shadow-sm shrink-0`}>
      <div className={`${pad} text-center`}>
        <div className="flex justify-center mb-1">
          {node.kind === "person"
            ? <User className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${c.text}`} />
            : <Building2 className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${c.text}`} />}
        </div>
        <div className={`${labelSize} font-bold leading-tight break-words ${c.text}`}>{node.label}</div>
        {node.isNew && (
          <div className={`mt-0.5 ${compact ? "text-[8px]" : "text-[10px]"} ${c.text} opacity-70`}>חדש</div>
        )}
      </div>
      {node.percentage && (
        <div className={`border-t-2 ${c.pct} text-center ${pctSize} font-bold py-0.5`}>
          {node.percentage}%
        </div>
      )}
    </div>
  );
};

const LINE = "rgba(100,116,139,0.5)";

const TreeNodeView = ({ node, compact = false }: { node: TreeNode; compact?: boolean }) => {
  const hasChildren = node.children.length > 0;
  const coOwners = node.coOwners ?? [];
  const hasCoOwners = coOwners.length > 0;
  const drop = compact ? 20 : 28;
  const gapX = compact ? 12 : 20;
  const coGap = compact ? 8 : 12;

  return (
    <div className="inline-flex flex-col items-center shrink-0">

      {/* שורת קופסאות: הצומת הראשי + coOwners — ממורכזות אנכית */}
      <div className="flex items-center">
        <NodeBox node={node} compact={compact} />
        {hasCoOwners && coOwners.map((co, i) => (
          <div key={`co-${co.label}-${i}`} className="flex items-center shrink-0">
            <div style={{ width: i === 0 ? gapX : coGap, height: 1.5, backgroundColor: LINE, flexShrink: 0 }} />
            <NodeBox node={co} compact={compact} />
          </div>
        ))}
      </div>

      {/* ילדי הצומת הראשי */}
      {hasChildren && (
        <div className="flex flex-col items-center">
          <div className="w-px" style={{ height: drop, backgroundColor: LINE }} />
          <div className="flex items-start justify-center">
            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              const hasSiblings = node.children.length > 1;
              return (
                <div
                  key={`${child.kind}-${child.label}-${index}`}
                  className="relative flex flex-col items-center"
                  style={{ paddingTop: drop, paddingInline: gapX / 2 }}
                >
                  {hasSiblings && !isFirst && (
                    <div className="absolute top-0 left-1/2 right-0 h-px" style={{ backgroundColor: LINE }} />
                  )}
                  {hasSiblings && !isLast && (
                    <div className="absolute top-0 right-1/2 left-0 h-px" style={{ backgroundColor: LINE }} />
                  )}
                  <div
                    className="absolute left-1/2 w-px -translate-x-1/2"
                    style={{ top: 0, height: drop, backgroundColor: LINE }}
                  />
                  <TreeNodeView node={child} compact={compact} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ילדי coOwners — מוצגים מתחת לשורת הקופסאות */}
      {hasCoOwners && coOwners.some(co => co.children.length > 0) && (
        <div className="flex items-start justify-center">
          {/* spacer לרוחב הצומת הראשי */}
          <div style={{ width: compact ? 96 : 128 }} />
          {coOwners.map((co, i) => (
            <div key={`co-children-${co.label}-${i}`} className="flex items-start shrink-0">
              <div style={{ width: i === 0 ? gapX : coGap }} />
              {co.children.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="w-px" style={{ height: drop, backgroundColor: LINE }} />
                  <div className="flex items-start justify-center">
                    {co.children.map((child, index) => {
                      const isFirst = index === 0;
                      const isLast = index === co.children.length - 1;
                      const hasSiblings = co.children.length > 1;
                      return (
                        <div
                          key={`${child.kind}-${child.label}-${index}`}
                          className="relative flex flex-col items-center"
                          style={{ paddingTop: drop, paddingInline: gapX / 2 }}
                        >
                          {hasSiblings && !isFirst && (
                            <div className="absolute top-0 left-1/2 right-0 h-px" style={{ backgroundColor: LINE }} />
                          )}
                          {hasSiblings && !isLast && (
                            <div className="absolute top-0 right-1/2 left-0 h-px" style={{ backgroundColor: LINE }} />
                          )}
                          <div
                            className="absolute left-1/2 w-px -translate-x-1/2"
                            style={{ top: 0, height: drop, backgroundColor: LINE }}
                          />
                          <TreeNodeView node={child} compact={compact} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ width: compact ? 96 : 128 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── OwnershipTree Component ──────────────────────────────────────────────────

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

  const branches = useMemo(() => {
    const result: TreeNode[] = [];
    const my = buildForOwner(businessInfo, fillerName, spouseName);
    if (my) result.push(my);
    if (hasSpouse && spouseBusinessInfo) {
      const sp = buildForOwner(spouseBusinessInfo, spouseName, fillerName);
      if (sp) result.push(sp);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(businessInfo), JSON.stringify(spouseBusinessInfo), fillerName, spouseName, hasSpouse, tick]);

  if (currentStep !== 3) return null;
  if (branches.length === 0) return null;

  return (
    <div className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${compact ? "p-3" : "p-5"}`} dir="rtl">
      <div className={`flex items-center gap-2 text-primary font-bold ${compact ? "text-sm" : "text-base"}`}>
        <Network className={compact ? "w-4 h-4" : "w-5 h-5"} />
        מפת השליטה בחברה
      </div>

      <div className="mt-3 overflow-x-auto overflow-y-auto pr-1">
        <div className="flex justify-center items-start gap-10 min-w-max pb-2 pt-1">
          {branches.map((branch, i) => (
            <TreeNodeView key={i} node={branch} compact={compact} />
          ))}
        </div>

        <div className={`border-t-2 border-border pt-3 mt-3 grid grid-cols-1 gap-2 text-foreground font-medium ${compact ? "text-xs" : "text-sm"}`}>
          <div className={`font-bold text-primary ${compact ? "text-sm" : "text-base"}`}>מקרא</div>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-amber-200 border-2 border-amber-400 inline-block shrink-0" /> אדם פרטי</span>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-primary/20 border-2 border-amber-500 border-dashed inline-block shrink-0" /> חברה אם</span>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-5 rounded bg-primary/30 border-2 border-primary inline-block shrink-0" /> חברה</span>
        </div>
      </div>
    </div>
  );
};
