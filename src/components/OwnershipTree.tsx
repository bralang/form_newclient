import { useState } from "react";
import { useFormContext } from "@/contexts/FormContext";
import { Building2, User, UserCircle2, ChevronDown, ChevronUp, Network } from "lucide-react";

type NodeKind = "target-new" | "target-existing" | "company" | "company-new" | "person" | "self";

type TreeNode = {
  kind: NodeKind;
  label: string;
  percentage?: string;
  children?: TreeNode[];
};

const fillerLabel = (name: string) => name?.trim() || "אני";

// Convert a CompanyChainBlock-shaped node to TreeNode
const chainToNode = (data: any, fallbackName: string, fillerName: string): TreeNode => {
  if (!data) return { kind: "person", label: "—" };
  const isNew = data.isExistingCompany === false;
  const label = data.companyName?.trim() || fallbackName;
  const node: TreeNode = {
    kind: isNew ? "company-new" : "company",
    label,
    percentage: data.percentage,
    children: [],
  };

  const sub = data.subOwnerType;
  if (sub === "self_via_company") {
    node.children!.push({ kind: "self", label: fillerName });
  } else if (sub === "person") {
    node.children!.push({
      kind: "person",
      label: data.personOwner?.name?.trim() || "אדם פרטי",
    });
  } else if (sub === "company") {
    node.children!.push(chainToNode(data.childCompany || {}, "חברה מחזיקה", fillerName));
  } else {
    // Unspecified — show placeholder
    node.children!.push({ kind: "person", label: "טרם נבחר" });
  }
  return node;
};

// Build subtree from a "shareholder" object (used in renderShareholdersSection)
const shareholderToNode = (sh: any, fillerName: string): TreeNode => {
  if (sh?.isSelf || sh?.isSpouse) {
    return {
      kind: "self",
      label: sh.name?.trim() || (sh.isSelf ? fillerName : "בן/בת זוג"),
      percentage: sh.percentage,
    };
  }
  const ht = sh?.holderType || "person";
  if (ht === "person") {
    return {
      kind: "person",
      label: sh.name?.trim() || "אדם פרטי",
      percentage: sh.percentage,
    };
  }
  if (ht === "self_via_company") {
    // user via a holding company
    const node: TreeNode = {
      kind: "company",
      label: sh.companyName?.trim() || "חברת אחזקות",
      percentage: sh.percentage,
      children: [],
    };
    const sub = sh.subOwnerType || "self_via_company";
    if (sub === "self_via_company") {
      node.children!.push({ kind: "self", label: fillerName });
    } else if (sub === "person") {
      node.children!.push({
        kind: "person",
        label: sh.personOwner?.name?.trim() || "אדם פרטי",
      });
    } else if (sub === "company") {
      node.children!.push(chainToNode(sh.childCompany || {}, "חברה מחזיקה", fillerName));
    }
    return node;
  }
  // company (third-party)
  const node: TreeNode = {
    kind: "company",
    label: sh.companyName?.trim() || "חברה",
    percentage: sh.percentage,
    children: [],
  };
  const sub = sh.subOwnerType;
  if (sub === "self_via_company") {
    node.children!.push({ kind: "self", label: fillerName });
  } else if (sub === "person") {
    node.children!.push({
      kind: "person",
      label: sh.personOwner?.name?.trim() || "אדם פרטי",
    });
  } else if (sub === "company") {
    node.children!.push(chainToNode(sh.childCompany || {}, "חברה מחזיקה", fillerName));
  }
  return node;
};

const companyToTree = (company: any, isNew: boolean, idx: number, fillerName: string): TreeNode => {
  const targetLabel = isNew
    ? (company.requestedName1?.trim() || `חברה חדשה #${idx + 1}`)
    : (company.name?.trim() || `חברה קיימת #${idx + 1}`);

  const root: TreeNode = {
    kind: isNew ? "target-new" : "target-existing",
    label: targetLabel,
    children: [],
  };

  const st = company.shareholderType;
  if (st === "alone") {
    root.children!.push({
      kind: "self",
      label: fillerName,
      percentage: isNew ? "100" : undefined,
    });
  } else if (st === "self_via_company") {
    root.children!.push(
      chainToNode(company.selfViaCompany || {}, "חברת אחזקות", fillerName),
    );
  } else if (st === "other") {
    (company.shareholders || []).forEach((sh: any) =>
      root.children!.push(shareholderToNode(sh, fillerName)),
    );
  } else {
    root.children!.push({ kind: "person", label: "טרם נבחר" });
  }
  return root;
};

// ─── Rendering ───
const iconFor = (kind: NodeKind) => {
  switch (kind) {
    case "self":
      return <UserCircle2 className="w-3.5 h-3.5" />;
    case "person":
      return <User className="w-3.5 h-3.5" />;
    case "target-new":
    case "company-new":
      return <Building2 className="w-3.5 h-3.5" />;
    default:
      return <Building2 className="w-3.5 h-3.5" />;
  }
};

const colorFor = (kind: NodeKind) => {
  switch (kind) {
    case "target-new":
    case "target-existing":
      return "bg-primary text-primary-foreground border-primary";
    case "self":
      return "bg-secondary text-secondary-foreground border-secondary";
    case "company-new":
      return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-100";
    case "company":
      return "bg-card text-foreground border-primary/30";
    case "person":
      return "bg-card text-foreground border-border";
  }
};

const TreeNodeView = ({ node, level = 0, compact = false }: { node: TreeNode; level?: number; compact?: boolean }) => {
  const isLeaf = !node.children || node.children.length === 0;
  const sizes = compact
    ? { pad: "px-2 py-1", text: "text-[11px]", icon: "w-3.5 h-3.5", pct: "text-[10px]", tag: "text-[9px]", indent: "mr-3 pr-2 space-y-1.5", border: "border-r-2" }
    : { pad: "px-3 py-2", text: "text-sm", icon: "w-4 h-4", pct: "text-xs", tag: "text-[11px]", indent: "mr-5 pr-3 space-y-2.5", border: "border-r-[3px]" };
  return (
    <div className="relative">
      <div
        className={`inline-flex items-center gap-2 ${sizes.pad} rounded-lg border ${sizes.text} font-semibold leading-tight max-w-full ${colorFor(node.kind)}`}
      >
        <span className={`shrink-0 [&_svg]:${sizes.icon}`}>{iconFor(node.kind)}</span>
        <span className="truncate" title={node.label}>{node.label}</span>
        {node.percentage && (
          <span className={`shrink-0 ${sizes.pct} opacity-80`}>({node.percentage}%)</span>
        )}
        {node.kind === "company-new" && (
          <span className={`shrink-0 ${sizes.tag} bg-amber-200/60 dark:bg-amber-800/60 rounded px-1.5 py-0.5`}>חדשה</span>
        )}
        {node.kind === "target-new" && (
          <span className={`shrink-0 ${sizes.tag} bg-primary-foreground/20 rounded px-1.5 py-0.5`}>חדשה</span>
        )}
      </div>
      {!isLeaf && (
        <div className={`mt-2 ${sizes.indent} ${sizes.border} border-primary/30`}>
          {node.children!.map((c, i) => (
            <TreeNodeView key={i} node={c} level={level + 1} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Main component ───
export const OwnershipTree = ({ compact = false }: { compact?: boolean }) => {
  const { currentStep, businessInfo, spouseBusinessInfo, personalInfo } = useFormContext() as any;
  const [collapsed, setCollapsed] = useState(false);

  // Only show on Step 2 (business info), which is currentStep === 3
  if (currentStep !== 3) return null;

  const fillerName = fillerLabel(personalInfo?.firstName || "");
  const spouseName = fillerLabel(personalInfo?.spouseFirstName || "בן/בת זוג");

  const buildAll = (bi: any, owner: string) => {
    const trees: { tree: TreeNode; key: string }[] = [];
    (bi?.existingCompanies || []).forEach((c: any, i: number) =>
      trees.push({ tree: companyToTree(c, false, i, owner), key: `e-${i}` }),
    );
    (bi?.newCompanies || []).forEach((c: any, i: number) =>
      trees.push({ tree: companyToTree(c, true, i, owner), key: `n-${i}` }),
    );
    return trees;
  };

  const myTrees = buildAll(businessInfo, fillerName);
  const spouseTrees = buildAll(spouseBusinessInfo, spouseName);

  if (myTrees.length === 0 && spouseTrees.length === 0) return null;

  return (
    <div
      className={`bg-card/95 backdrop-blur border-2 border-primary/20 rounded-2xl shadow-lg ${
        compact ? "p-3" : "p-5"
      }`}
      dir="rtl"
    >
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
        <div className={`mt-3 space-y-4 ${compact ? "max-h-[40vh]" : "max-h-[70vh]"} overflow-y-auto pr-1`}>
          {myTrees.map((t) => (
            <TreeNodeView key={`me-${t.key}`} node={t.tree} compact={compact} />
          ))}
          {spouseTrees.length > 0 && (
            <>
              <div className={`font-bold text-muted-foreground border-t border-border pt-2 ${compact ? "text-[11px]" : "text-xs"}`}>
                חברות של {spouseName}
              </div>
              {spouseTrees.map((t) => (
                <TreeNodeView key={`sp-${t.key}`} node={t.tree} compact={compact} />
              ))}
            </>
          )}
          <div className={`border-t border-border pt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted-foreground ${compact ? "text-[10px]" : "text-[11px]"}`}>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary inline-block" /> חברת היעד</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary inline-block" /> אני / ממלא/ת</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-300 inline-block" /> חברה חדשה</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-card border border-primary/40 inline-block" /> חברה קיימת</span>
          </div>
        </div>
      )}
    </div>
  );
};

