import { useEffect, useRef } from "react";
import { useFormContext, NonprofitBoardMember, NonprofitAuditMember, NonprofitInfo, GovPortalIdMethod } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { g } from "@/lib/gender-utils";
import { AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const PercentageInput = ({
  value,
  onChange,
  placeholder = "לדוגמה: 50",
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  max?: number;
}) => (
  <div className="relative w-full min-w-0">
    <Input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*\.?[0-9]*"
      value={value}
      onChange={(e) => {
        let v = e.target.value.replace(/[^0-9.]/g, "");
        if (typeof max === "number" && v !== "") {
          const num = parseFloat(v);
          if (!isNaN(num) && num > max) {
            v = String(Math.max(0, Math.round(max * 100) / 100));
          }
        }
        onChange(v);
      }}
      placeholder={placeholder}
      className="h-14 rounded-2xl pl-9 pr-3 text-right text-xl font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl font-black text-primary leading-none">
      %
    </span>
  </div>
);

// Wrapper that auto-fills the remaining percentage when all other slots are filled.
// The auto-filled value is "soft" — it updates when siblings change, and stops auto-updating
// once the user manually edits it. No max constraint, so users can type freely; the sibling
// will re-auto-adjust to keep totals at 100%.
const AutoPercentageInput = ({
  value,
  onChange,
  autoFillTo,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  autoFillTo?: number;
  placeholder?: string;
  max?: number;
}) => {
  const isAutoFilled = useRef(false);
  const lastEmitted = useRef<string>("");

  useEffect(() => {
    if (autoFillTo === undefined || autoFillTo < 0) return;
    // Auto-fill if empty, or refresh if value was previously auto-filled by us
    if (!value || (isAutoFilled.current && value === lastEmitted.current)) {
      const v = String(Math.round(autoFillTo * 100) / 100);
      if (v !== value) {
        isAutoFilled.current = true;
        lastEmitted.current = v;
        onChange(v);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillTo]);

  const handleChange = (v: string) => {
    // User typed — clear auto flag so subsequent sibling changes don't overwrite
    if (v !== lastEmitted.current) {
      isAutoFilled.current = false;
    }
    onChange(v);
  };

  return <PercentageInput value={value} onChange={handleChange} {...rest} max={undefined} />;
};


// Helper: validate partnership percentages sum to exactly 100
export const isPartnershipValid = (info: any, partnersKey: string = "partners"): boolean => {
  if (!info || info.ownershipType !== "partnership") return true;
  const partners = info[partnersKey] || [];
  if (partners.length === 0) return true;
  const total = partners.reduce(
    (s: number, p: any) => s + (parseFloat(p?.percentage) || 0),
    0
  );
  return Math.abs(total - 100) < 0.01;
};


// Checkbox-style option card (replaces radio/Select for shareholder type)
const OptionCard = ({
  label,
  selected,
  onClick,
  description,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  description?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-right p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
      selected
        ? "border-primary bg-primary/10 shadow-sm"
        : "border-border bg-card hover:border-primary/40"
    }`}
  >
    <span
      className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
        selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
      }`}
    >
      {selected && <span className="text-sm font-bold">✓</span>}
    </span>
    <span className="flex-1">
      <span className={`block text-base font-bold ${selected ? "text-primary" : ""}`}>{label}</span>
      {description && <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>}
    </span>
  </button>
);

const OptionCardGroup = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="grid grid-cols-1 gap-2">
    {options.map((opt) => (
      <OptionCard
        key={opt.value}
        label={opt.label}
        description={opt.description}
        selected={value === opt.value}
        onClick={() => onChange(opt.value)}
      />
    ))}
  </div>
);

// Pill-style choice group (like Step1) for compact 2-3 option selections
const PillGroup = ({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) => (
  <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 border ${
            active
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);


// Recursive block representing a holding company (and who owns it)
type CompanyNode = {
  companyName?: string;
  companyNumber?: string;
  subOwnerType?: "person" | "company" | "self_via_company" | "self" | "";
  personOwner?: {
    name?: string;
    idNumber?: string;
    idFile?: File;
    phone?: string;
    email?: string;
    additionalIdType?: "parentId" | "license" | "passport" | "";
    additionalIdNumber?: string;
    additionalIdFile?: File;
  };
  childCompany?: CompanyNode;
};

const CompanyChainBlock = ({
  data,
  onChange,
  heldName,
  depth = 0,
  fillerName = "אני",
  gender = "",
  chainAllowsNewCompany = false,
  selfName,
  spouseName,
  showSpouseOption = false,
  restrictToPersonOrCompany: _restrictToPersonOrCompany = false,
  offerSelfInPersonOption = false,
  personIsSelfOnly = false,
  renderNewCompanyShareholders,
}: {
  data: CompanyNode & { isExistingCompany?: boolean; personOwnerType?: "self" | "spouse" | "other" | ""; personOwnerWithOther?: boolean };
  onChange: (next: CompanyNode & { isExistingCompany?: boolean; personOwnerType?: "self" | "spouse" | "other" | ""; personOwnerWithOther?: boolean }) => void;
  heldName: string;
  depth?: number;
  fillerName?: string;
  gender?: "male" | "female" | "";
  chainAllowsNewCompany?: boolean;
  selfName?: string;
  spouseName?: string;
  showSpouseOption?: boolean;
  restrictToPersonOrCompany?: boolean;
  offerSelfInPersonOption?: boolean;
  personIsSelfOnly?: boolean;
  renderNewCompanyShareholders?: (
    node: any,
    onNodeChange: (next: any) => void,
    displayName: string,
    keyPrefix: string,
  ) => React.ReactNode;
}) => {
  const update = (patch: Partial<CompanyNode & { isExistingCompany?: boolean; personOwnerType?: "self" | "spouse" | "other" | ""; personOwnerWithOther?: boolean }>) =>
    onChange({ ...data, ...patch });
  const updatePerson = (patch: any) => onChange({ ...data, personOwner: { ...(data.personOwner || {}), ...patch } });
  const subOwnerType = data.subOwnerType || "";
  const heShe = gender ? g(gender, "הוא", "היא") : "הוא/היא";
  const owner = gender ? g(gender, "בעל", "בעלת") : "בעל/ת";
  const sole = gender ? g(gender, "היחיד", "היחידה") : "היחיד/ה";
  const isExistingCompany = chainAllowsNewCompany ? (data.isExistingCompany ?? true) : true;
  const displayName = data.companyName || (data as any).requestedName1 || "החברה המחזיקה";
  const personOwnerType = data.personOwnerType || "";
  const effectiveSelfName = selfName || (fillerName !== "אני" ? fillerName : "ממלא/ת השאלון");
  const personOwnerWithOther = !!data.personOwnerWithOther;
  const normalizedSubOwnerType = subOwnerType === "self" ? "person" : subOwnerType === "self_via_company" ? "company" : subOwnerType;
  const effectivePersonOwnerType = personOwnerType || (subOwnerType === "self" ? "self" : "");

  // When a NEW company is selected inside the chain, show the full shareholders flow
  const showNewCompanyShareholders = !isExistingCompany && !!renderNewCompanyShareholders;

  return (
    <div className={`space-y-3 ${depth > 0 ? "p-3 bg-card rounded-lg border border-border/50 mr-4" : ""}`}>
      {depth > 0 && (
        <p className="text-xs text-muted-foreground">
          חברה אם: <span className="font-semibold">{heldName}</span>
        </p>
      )}

      {chainAllowsNewCompany && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">האם החברה המחזיקה כבר קיימת או טרם הוקמה?</Label>
          <PillGroup
            value={isExistingCompany ? "existing" : "new"}
            onChange={(v) => update({ isExistingCompany: v === "existing" })}
            options={[
              { value: "existing", label: "חברה קיימת" },
              { value: "new", label: "חברה חדשה" },
            ]}
          />
        </div>
      )}

      {isExistingCompany ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>שם החברה המחזיקה את {heldName} *</Label>
            <Input value={data.companyName || ""} onChange={(e) => update({ companyName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>ח.פ. *</Label>
            <Input value={data.companyNumber || ""} onChange={(e) => update({ companyNumber: e.target.value })} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="font-semibold">3 שמות רצויים לחברה המחזיקה את {heldName} החדשה (לפי סדר עדיפות)</Label>
          {[1, 2, 3].map((n) => (
            <Input
              key={n}
              placeholder={`שם רצוי ${n}`}
              value={(data as any)[`requestedName${n}`] || ""}
              onChange={(e) => update({ [`requestedName${n}`]: e.target.value } as any)}
            />
          ))}
        </div>
      )}

      {showNewCompanyShareholders ? (
        renderNewCompanyShareholders!(
          data,
          (next) => onChange(next),
          displayName,
          `chain_d${depth}_`,
        )
      ) : (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              {isExistingCompany ? `אחד מבעלי המניות של ${displayName}` : `סוג בעל המניות של ${displayName}`}
            </Label>
            <Select value={normalizedSubOwnerType} onValueChange={(v: any) => update({ subOwnerType: v, ...(personIsSelfOnly && v === "person" ? { personOwnerType: "self" as const } : {}) })}>
              <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="person">{personIsSelfOnly ? `אדם פרטי - ${effectiveSelfName}` : "אדם פרטי"}</SelectItem>
                <SelectItem value="company">חברה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {normalizedSubOwnerType === "person" && offerSelfInPersonOption && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-sm font-semibold">מי בעל המניות?</Label>
              <PillGroup
                value={effectivePersonOwnerType}
                onChange={(v) => update({ personOwnerType: v as any })}
                options={[
                  { value: "self", label: effectiveSelfName },
                  ...(showSpouseOption && spouseName ? [{ value: "spouse", label: spouseName }] : []),
                  { value: "other", label: "אחר" },
                ]}
              />
              {effectivePersonOwnerType === "self" && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">{effectiveSelfName} {heShe} {owner} המניות {sole} של {displayName}.</p>
                </div>
              )}
              {effectivePersonOwnerType === "spouse" && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">{spouseName} (בן/בת הזוג) {owner} המניות של {displayName}.</p>
                </div>
              )}
              {effectivePersonOwnerType === "other" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>שם מלא *</Label><Input value={data.personOwner?.name || ""} onChange={(e) => updatePerson({ name: e.target.value })} /></div>
                    <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={data.personOwner?.idNumber || ""} onChange={(e) => updatePerson({ idNumber: e.target.value })} /></div>
                    <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={data.personOwner?.phone || ""} onChange={(e) => updatePerson({ phone: e.target.value })} /></div>
                    <div className="space-y-1"><Label>מייל</Label><Input type="email" value={data.personOwner?.email || ""} onChange={(e) => updatePerson({ email: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>אמצעי זיהוי נוסף (מומלץ)</Label>
                    <Select value={data.personOwner?.additionalIdType || ""} onValueChange={(v: any) => updatePerson({ additionalIdType: v })}>
                      <SelectTrigger><SelectValue placeholder="בחר אמצעי זיהוי" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parentId">מס׳ זהות של הורה</SelectItem>
                        <SelectItem value="license">רישיון נהיגה</SelectItem>
                        <SelectItem value="passport">דרכון</SelectItem>
                      </SelectContent>
                    </Select>
                    {data.personOwner?.additionalIdType && (
                      <Input placeholder="מספר אמצעי זיהוי" value={data.personOwner?.additionalIdNumber || ""} onChange={(e) => updatePerson({ additionalIdNumber: e.target.value })} />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {normalizedSubOwnerType === "person" && personIsSelfOnly && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm">{effectiveSelfName} {heShe} {owner} המניות {sole} של {displayName}.</p>
            </div>
          )}

          {normalizedSubOwnerType === "person" && !offerSelfInPersonOption && !personIsSelfOnly && subOwnerType !== "self" && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground">בעל המניות הסופי (אדם פרטי) של {displayName}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1"><Label>שם מלא *</Label><Input value={data.personOwner?.name || ""} onChange={(e) => updatePerson({ name: e.target.value })} /></div>
                <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={data.personOwner?.idNumber || ""} onChange={(e) => updatePerson({ idNumber: e.target.value })} /></div>
                <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={data.personOwner?.phone || ""} onChange={(e) => updatePerson({ phone: e.target.value })} /></div>
                <div className="space-y-1"><Label>מייל</Label><Input type="email" value={data.personOwner?.email || ""} onChange={(e) => updatePerson({ email: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>אמצעי זיהוי נוסף (מומלץ)</Label>
                <Select value={data.personOwner?.additionalIdType || ""} onValueChange={(v: any) => updatePerson({ additionalIdType: v })}>
                  <SelectTrigger><SelectValue placeholder="בחר אמצעי זיהוי" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parentId">מס׳ זהות של הורה</SelectItem>
                    <SelectItem value="license">רישיון נהיגה</SelectItem>
                    <SelectItem value="passport">דרכון</SelectItem>
                  </SelectContent>
                </Select>
                {data.personOwner?.additionalIdType && (
                  <Input placeholder="מספר אמצעי זיהוי" value={data.personOwner?.additionalIdNumber || ""} onChange={(e) => updatePerson({ additionalIdNumber: e.target.value })} />
                )}
              </div>
            </div>
          )}

          {subOwnerType === "self" && (
            <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm">{fillerName} {heShe} {owner} המניות {sole} של {displayName}.</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={personOwnerWithOther}
                  onCheckedChange={(v) => update({ personOwnerWithOther: !!v })}
                />
                <span>יחד עם אחר</span>
              </label>
              {personOwnerWithOther && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1"><Label>שם מלא של השותף *</Label><Input value={data.personOwner?.name || ""} onChange={(e) => updatePerson({ name: e.target.value })} /></div>
                  <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={data.personOwner?.idNumber || ""} onChange={(e) => updatePerson({ idNumber: e.target.value })} /></div>
                  <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={data.personOwner?.phone || ""} onChange={(e) => updatePerson({ phone: e.target.value })} /></div>
                  <div className="space-y-1"><Label>מייל</Label><Input type="email" value={data.personOwner?.email || ""} onChange={(e) => updatePerson({ email: e.target.value })} /></div>
                </div>
              )}
            </div>
          )}

          {normalizedSubOwnerType === "company" && (
            <CompanyChainBlock
              data={data.childCompany || {}}
              onChange={(c) => update({ childCompany: c })}
              heldName={displayName}
              depth={depth + 1}
              fillerName={fillerName}
              gender={gender}
              chainAllowsNewCompany={chainAllowsNewCompany && !isExistingCompany}
              selfName={selfName}
              spouseName={spouseName}
              showSpouseOption={showSpouseOption}
              restrictToPersonOrCompany={_restrictToPersonOrCompany}
              offerSelfInPersonOption={offerSelfInPersonOption}
              personIsSelfOnly={personIsSelfOnly}
              renderNewCompanyShareholders={renderNewCompanyShareholders}
            />
          )}
        </>
      )}
    </div>
  );
};

const withBet = (name: string) => `ב${name || ""}`;

// "אני באמצעות חברה" outer block - the user holds the parent company via a holding company
const SelfViaCompanyBlock = ({
  data,
  onChange,
  parentCompanyName,
  isNewCompany,
  fillerName = "אני",
  gender = "",
  selfName,
  spouseName,
  showSpouseOption = false,
  renderNewCompanyShareholders,
  knownChains,
}: {
  data: any;
  onChange: (next: any) => void;
  parentCompanyName: string;
  isNewCompany: boolean;
  fillerName?: string;
  gender?: "male" | "female" | "";
  selfName?: string;
  spouseName?: string;
  showSpouseOption?: boolean;
  renderNewCompanyShareholders?: (
    node: any,
    onNodeChange: (next: any) => void,
    displayName: string,
    keyPrefix: string,
  ) => React.ReactNode;
  knownChains?: Map<string, any>;
}) => {
  const update = (patch: any) => onChange({ ...(data || {}), ...patch });
  const updatePerson = (patch: any) =>
    onChange({ ...(data || {}), personOwner: { ...((data || {}).personOwner || {}), ...patch } });
  // No default — user must explicitly choose
  const subOwnerType = data?.subOwnerType || "";
  const holds = gender ? g(gender, "מחזיק", "מחזיקה") : "מחזיק/ה";
  const owner = gender ? g(gender, "בעל", "בעלת") : "בעל/ת";
  const sole = gender ? g(gender, "היחיד", "היחידה") : "היחיד/ה";
  const isExistingHolding = isNewCompany ? (data?.isExistingCompany ?? true) : true;
  const personOwnerType = data?.personOwnerType || "";
  const effectiveSelfName = selfName || (fillerName !== "אני" ? fillerName : "ממלא/ת השאלון");
  const personOwnerWithOther = !!data?.personOwnerWithOther;
  const holdingDisplayName = data?.companyName?.trim() || (data as any)?.requestedName1?.trim() || "החברה המחזיקה";
  const showNewHoldingShareholders = !isExistingHolding && !!renderNewCompanyShareholders;
  // When the chain was auto-filled from a known ח.פ., hide the shareholder question — it's already set
  const chainIsKnown = !!(data?.companyNumber?.trim() && knownChains?.get(data.companyNumber.trim())?.subOwnerType);

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
      <p className="text-xs text-primary font-semibold">
        {fillerName} {holds} {withBet(parentCompanyName)} באמצעות חברה.
      </p>

      {isNewCompany && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">האם חברת האחזקות כבר קיימת או טרם הוקמה?</Label>
          <PillGroup
            value={isExistingHolding ? "existing" : "new"}
            onChange={(v) => update({ isExistingCompany: v === "existing" })}
            options={[
              { value: "existing", label: "חברה קיימת" },
              { value: "new", label: "חברה חדשה" },
            ]}
          />
        </div>
      )}

      {isExistingHolding ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>שם החברה דרכה אני {holds} *</Label>
            <Input value={data?.companyName || ""} onChange={(e) => update({ companyName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>ח.פ. *</Label>
            <Input
              value={data?.companyNumber || ""}
              onChange={(e) => {
                const num = e.target.value;
                const known = knownChains?.get(num.trim());
                if (known && known.subOwnerType && num.trim().length >= 2) {
                  // Auto-fill the chain structure from a previously-defined holding company
                  update({
                    companyNumber: num,
                    companyName: data?.companyName || known.companyName || "",
                    subOwnerType: known.subOwnerType,
                    childCompany: known.childCompany,
                    shareholders: known.shareholders,
                  });
                } else {
                  update({ companyNumber: num });
                }
              }}
            />
          </div>
          {isNewCompany && (
            <div className="space-y-1">
              <Label>אחוזי אחזקה {withBet(parentCompanyName)} *</Label>
              <PercentageInput
                value={data?.percentage || ""}
                onChange={(value) => update({ percentage: value })}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="font-semibold">3 שמות רצויים לחברה דרכה אני {holds} (לפי סדר עדיפות)</Label>
          {[1, 2, 3].map((n) => (
            <Input
              key={n}
              placeholder={`שם רצוי ${n}`}
              value={(data as any)?.[`requestedName${n}`] || ""}
              onChange={(e) => update({ [`requestedName${n}`]: e.target.value } as any)}
            />
          ))}
          {isNewCompany && (
            <div className="space-y-1">
              <Label>אחוזי אחזקה {withBet(parentCompanyName)} *</Label>
              <PercentageInput
                value={data?.percentage || ""}
                onChange={(value) => update({ percentage: value })}
              />
            </div>
          )}
        </div>
      )}

      {showNewHoldingShareholders ? (
        renderNewCompanyShareholders!(
          data,
          (next) => onChange(next),
          holdingDisplayName || data?.requestedName1 || "חברת האחזקות",
          `selfvia_`,
        )
      ) : (
        <>
          {!chainIsKnown && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                אחד מבעלי המניות של {holdingDisplayName}
              </Label>
              <Select value={subOwnerType} onValueChange={(v: any) => update({ subOwnerType: v })}>
                <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">אדם פרטי - {effectiveSelfName}</SelectItem>
                  <SelectItem value="company">חברה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {subOwnerType === "person" && null}

          {!chainIsKnown && subOwnerType === "company" && (
            <CompanyChainBlock
              data={data?.childCompany || {}}
              onChange={(c) => update({ childCompany: c })}
              heldName={holdingDisplayName}
              depth={1}
              fillerName={fillerName}
              gender={gender}
              chainAllowsNewCompany={isNewCompany && !isExistingHolding}
              selfName={selfName}
              spouseName={spouseName}
              showSpouseOption={showSpouseOption}
              restrictToPersonOrCompany={true}
              personIsSelfOnly={true}
              renderNewCompanyShareholders={renderNewCompanyShareholders}
            />
          )}
        </>
      )}
    </div>
  );
};

export const Step2BusinessInfo = () => {
  const {
    serviceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
    nonprofitInfo,
    setNonprofitInfo,
    spouseNonprofitInfo,
    setSpouseNonprofitInfo,
    personalInfo,
    detailedInfo,
    spouseInfo,
  } = useFormContext();

  const isMarried = personalInfo.maritalStatus === "married";
  const userGender = detailedInfo.gender;
  const spouseGender = spouseInfo.gender;

  const userWarEntities = serviceType.userWarCompensationEntities || [];
  const spouseWarEntities = serviceType.spouseWarCompensationEntities || [];

  const userHasNewBusiness = serviceType.userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("new");
  const userHasExistingBusiness = (serviceType.userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("existing")) || userWarEntities.includes("business");
  const userHasCompany = serviceType.userPurposes.includes("company") || userWarEntities.includes("company");
  const userHasNonprofit = serviceType.userPurposes.includes("nonprofit") || userWarEntities.includes("nonprofit");

  const spouseHasNewBusiness = serviceType.spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("new");
  const spouseHasExistingBusiness = (serviceType.spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("existing")) || spouseWarEntities.includes("business");
  const spouseHasCompany = serviceType.spousePurposes.includes("company") || spouseWarEntities.includes("company");
  const spouseHasNonprofit = serviceType.spousePurposes.includes("nonprofit") || spouseWarEntities.includes("nonprofit");

  const userHasWarCompensation = serviceType.userPurposes.includes("war_compensation");
  const spouseHasWarCompensation = serviceType.spousePurposes.includes("war_compensation");
  // Show the generic war-compensation CTA only if war_compensation was selected without specifying any related entity
  const showWarCompensation =
    (userHasWarCompensation && userWarEntities.length === 0) ||
    (spouseHasWarCompensation && spouseWarEntities.length === 0);

  const userName = personalInfo.firstName || "המשתמש";
  const userLastName = personalInfo.lastName || "";
  const spouseName = personalInfo.spouseName || "בן/בת הזוג";

  // ─── Yes/No Select helper ───
  const YesNoSelect = ({
    value,
    onChange,
  }: {
    value: boolean | undefined;
    onChange: (v: boolean) => void;
  }) => (
    <Select
      value={value === true ? "yes" : value === false ? "no" : ""}
      onValueChange={(v) => onChange(v === "yes")}
    >
      <SelectTrigger>
        <SelectValue placeholder="בחר" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yes">כן</SelectItem>
        <SelectItem value="no">לא</SelectItem>
      </SelectContent>
    </Select>
  );

  // ─── Partnership Section (shared for new & existing) ───
  const renderPartnershipSection = (
    info: any,
    setInfo: any,
    selfName: string,
    selfIdNumber: string,
    prefix = "",
    isWarComp = false,
    partnersKey: string = "partners",
    fileKey: string = "partnershipAgreementFile"
  ) => {
    const partners = info[partnersKey] || [];


    const updatePartner = (idx: number, field: string, value: any) => {
      const updated = [...partners];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "isVatRepresentative" && value === true) {
        updated.forEach((p, i) => {
          if (i !== idx) updated[i] = { ...updated[i], isVatRepresentative: false };
        });
      }
      setInfo({ [partnersKey]: updated });
    };

    const handlePartnerCountChange = (count: number) => {
      const adjusted = Array.from({ length: count }, (_, i) => {
        if (i === 0) {
          // Partner #1 is always the questionnaire filler – auto-fill
          return {
            ...(partners[0] || {}),
            isSelf: true,
            name: selfName,
            idNumber: selfIdNumber,
          };
        }
        return partners[i] || {
          name: "",
          idNumber: "",
          percentage: "",
          phone: "",
          email: "",
          address: "",
          isVatRepresentative: false,
        };
      });
      setInfo({ [partnersKey]: adjusted });
    };

    return (
      <div className="space-y-5 mr-4">
        {!isWarComp && (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}partnerCount`}>מספר שותפים (כולל אותך)</Label>
            <Input
              id={`${prefix}partnerCount`}
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={partners.length || ""}
              onChange={(e) => handlePartnerCountChange(parseInt(e.target.value) || 0)}
            />
          </div>
        )}

        {!isWarComp && partners.length > 0 && (
          <div className="space-y-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
            <Label className="text-lg font-bold text-primary block">
              נציג השותפות למע״מ
            </Label>
            <p className="text-sm text-muted-foreground">
              סמנו מי מהשותפים יהיה הנציג מול מע״מ
            </p>
            <div className="space-y-2">
              {partners.map((partner: any, idx: number) => {
                const displayName =
                  idx === 0 ? selfName : partner.name || `שותף ${idx + 1}`;
                return (
                  <label
                    key={idx}
                    htmlFor={`${prefix}vatRep_${idx}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      partner.isVatRepresentative
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <Checkbox
                      id={`${prefix}vatRep_${idx}`}
                      checked={partner.isVatRepresentative || false}
                      onCheckedChange={(checked) =>
                        updatePartner(idx, "isVatRepresentative", !!checked)
                      }
                    />
                    <span className="text-base font-bold flex-1">
                      {displayName}
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground font-normal mr-2">
                          (אני – ממלא/ת השאלון)
                        </span>
                      )}
                    </span>
                    {idx > 0 && (
                      <Input
                        placeholder={`שם שותף ${idx + 1}`}
                        value={partner.name || ""}
                        onChange={(e) => updatePartner(idx, "name", e.target.value)}
                        className="flex-1 max-w-[260px]"
                        onClick={(e) => e.preventDefault()}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {!isWarComp && partners.map((partner: any, idx: number) => {
          const isSelf = idx === 0;
          const displayName = isSelf ? selfName : partner.name;
          if (!displayName) return null;
          return (
            <div key={`details-${idx}`} className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <h4 className="font-bold text-primary text-lg">
                פרטי שותף – {displayName}
                {isSelf && <span className="text-xs mr-2 text-muted-foreground font-normal">(הפרטים מולאו אוטומטית)</span>}
                {partner.isVatRepresentative && <span className="text-xs mr-2 text-primary/70">(נציג השותפות למע״מ)</span>}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {!isSelf && (
                  <div className="space-y-1">
                    <Label>מס׳ תעודת זהות</Label>
                    <Input value={partner.idNumber || ""} onChange={(e) => updatePartner(idx, "idNumber", e.target.value)} />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>אחוז בשותפות</Label>
                  {(() => {
                    const othersSum = partners.reduce((s: number, p: any, i: number) => i === idx ? s : s + (parseFloat(p?.percentage) || 0), 0);
                    const othersAllFilled = partners.length > 1 && partners.every((p: any, i: number) => i === idx || (parseFloat(p?.percentage) || 0) > 0);
                    const remainder = Math.max(0, 100 - othersSum);
                    return (
                      <AutoPercentageInput
                        value={partner.percentage || ""}
                        onChange={(value) => updatePartner(idx, "percentage", value)}
                        max={remainder}
                        autoFillTo={othersAllFilled ? remainder : undefined}
                      />
                    );
                  })()}
                </div>
                {!isSelf && (
                  <>
                    <div className="space-y-1">
                      <Label>טלפון</Label>
                      <Input type="tel" value={partner.phone || ""} onChange={(e) => updatePartner(idx, "phone", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>מייל</Label>
                      <Input type="email" value={partner.email || ""} onChange={(e) => updatePartner(idx, "email", e.target.value)} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>כתובת</Label>
                      <Input value={partner.address || ""} onChange={(e) => updatePartner(idx, "address", e.target.value)} />
                    </div>
                  </>
                )}
              </div>

              {/* Additional ID for VAT representative (only if not self – self already provided in personal step) */}
              {partner.isVatRepresentative && !isSelf && (
                <div className="space-y-3 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <Label className="font-semibold">אמצעי זיהוי נוסף *</Label>
                  <Select
                    value={partner.additionalIdType || ""}
                    onValueChange={(v) => updatePartner(idx, "additionalIdType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר אמצעי זיהוי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parentId">מס׳ זהות של הורה</SelectItem>
                      <SelectItem value="license">רישיון נהיגה</SelectItem>
                      <SelectItem value="passport">דרכון</SelectItem>
                    </SelectContent>
                  </Select>
                  {partner.additionalIdType && (
                    <Input
                      placeholder="מספר אמצעי זיהוי"
                      value={partner.additionalIdNumber || ""}
                      onChange={(e) => updatePartner(idx, "additionalIdNumber", e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Partnership percentages total validation */}
        {!isWarComp && partners.length > 0 && (() => {
          const total = partners.reduce(
            (s: number, p: any) => s + (parseFloat(p?.percentage) || 0),
            0
          );
          const isValid = Math.abs(total - 100) < 0.01;
          if (isValid) {
            return (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm font-semibold text-primary">
                  סה״כ אחוזי השותפות: 100% ✓
                </p>
              </div>
            );
          }
          return (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border-2 border-destructive rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">
                  סה״כ אחוזי השותפות חייב להיות בדיוק 100% (כרגע: {total}%)
                </p>
                <p className="text-xs text-destructive/90">
                  סכום אחוזי כל השותפים יחד חייב להסתכם ל-100%. אנא עדכנו את האחוזים כך שיתאזנו ל-100%, אחרת לא ניתן יהיה להמשיך הלאה.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Partnership agreement upload moved to Step3 (Documents) */}
      </div>
    );
  };

  // ─── Shareholders Section (for company) ───
  const renderShareholdersSection = (
    company: any,
    updateCompany: (field: string, value: any) => void,
    updateCompanyMulti: (updates: Record<string, any>) => void,
    selfName: string,
    selfIdNumber: string,
    selfPhone: string,
    selfEmail: string,
    spouseDisplayName: string,
    spouseIdNumber: string,
    spousePhone: string,
    spouseEmail: string,
    showSpouseOption: boolean,
    prefix = "",
    isNewCompany = false,
    parentCompanyName = "",
    includeSelfAsFirstShareholder = true,
  ) => {
    const rawShareholders = company.shareholders || [];
    const shareholders = includeSelfAsFirstShareholder
      ? rawShareholders
      : rawShareholders
          .filter((s: any) => !s?.isSelf && !s?.isSpouse)
          .map((s: any) => ({ ...s, isSelf: false, isSpouse: false }));
    const spouseIsShareholder = includeSelfAsFirstShareholder && !!company.spouseIsShareholder;

    const updateShareholder = (idx: number, field: string, value: any) => {
      const updated = [...shareholders];
      updated[idx] = { ...updated[idx], [field]: value };
      updateCompany("shareholders", updated);
    };

    // Build the list with auto-filled self (#1) and optional spouse (#2)
    const buildShareholders = (totalCount: number, spouseFlag: boolean) => {
      if (!includeSelfAsFirstShareholder) {
        const result: any[] = [];
        for (let i = 0; i < totalCount; i++) {
          result.push(
            shareholders[i] || {
              isSelf: false,
              isSpouse: false,
              name: "",
              idNumber: "",
              phone: "",
              email: "",
              percentage: "",
              additionalIdType: "",
              additionalIdNumber: "",
            }
          );
        }
        return result;
      }

      const result: any[] = [];
      // #1 — always self (auto-filled from personal info)
      result.push({
        ...(shareholders[0] || {}),
        isSelf: true,
        isSpouse: false,
        name: selfName,
        idNumber: selfIdNumber,
        phone: selfPhone,
        email: selfEmail,
      });
      let nextIdx = 1;
      // #2 — spouse if flagged
      if (spouseFlag) {
        result.push({
          ...(shareholders[nextIdx] || {}),
          isSelf: false,
          isSpouse: true,
          name: spouseDisplayName,
          idNumber: spouseIdNumber,
          phone: spousePhone,
          email: spouseEmail,
        });
        nextIdx++;
      }
      // Remaining manual shareholders
      for (let i = nextIdx; i < totalCount; i++) {
        // Find the next non-auto shareholder from existing data
        const existingManual = shareholders
          .filter((s: any) => !s?.isSelf && !s?.isSpouse)
          .map((s: any) => ({ ...s, isSelf: false, isSpouse: false }));
        const manualIdx = i - nextIdx;
        result.push(
          existingManual[manualIdx] || {
            isSelf: false,
            isSpouse: false,
            name: "",
            idNumber: "",
            phone: "",
            email: "",
            percentage: "",
            additionalIdType: "",
            additionalIdNumber: "",
          }
        );
      }
      return result;
    };

    const handleShareholderCountChange = (count: number) => {
      if (count < 1) count = 1;
      const adjusted = buildShareholders(count, spouseIsShareholder);
      updateCompanyMulti({
        shareholders: adjusted,
        shareholderCount: count,
        ...(includeSelfAsFirstShareholder ? {} : { spouseIsShareholder: false }),
      });
    };

    const toggleSpouseHolder = (checked: boolean) => {
      if (!includeSelfAsFirstShareholder) return;
      const currentCount = company.shareholderCount || shareholders.length || (checked ? 2 : 1);
      // Ensure count includes spouse slot
      let newCount = currentCount;
      if (checked && currentCount < 2) newCount = 2;
      const adjusted = buildShareholders(newCount, checked);
      updateCompanyMulti({
        shareholders: adjusted,
        shareholderCount: newCount,
        spouseIsShareholder: checked,
      });
    };

    // Renderer used by nested chain blocks: when the user picks "חברה חדשה"
    // inside the ownership chain, render the full shareholders flow (same as outermost)
    const renderNewCompanyShareholders = (
      node: any,
      onNodeChange: (next: any) => void,
      displayName: string,
      keyPrefix: string,
    ) =>
      renderShareholdersSection(
        node,
        (field: string, value: any) => onNodeChange({ ...node, [field]: value }),
        (updates: Record<string, any>) => onNodeChange({ ...node, ...updates }),
        selfName,
        selfIdNumber,
        selfPhone,
        selfEmail,
        spouseDisplayName,
        spouseIdNumber,
        spousePhone,
        spouseEmail,
        showSpouseOption,
        `${prefix}${keyPrefix}`,
        true,
        displayName,
        false,
      );

    return (
      <div className="space-y-4 mr-4">
        <div className="space-y-2">
          <Label>
            {includeSelfAsFirstShareholder
              ? `כמה בעלי מניות יש ב${parentCompanyName || "חברה"}? (כולל אותך)`
              : `כמה בעלי מניות יש ב${parentCompanyName || "חברה"}?`}
          </Label>
          <Input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={company.shareholderCount || ""}
            onChange={(e) => handleShareholderCountChange(parseInt(e.target.value) || 0)}
          />
          {includeSelfAsFirstShareholder && (
            <p className="text-xs text-muted-foreground">
              בעל מניות #1 הוא ממלא השאלון – הפרטים מולאו אוטומטית.
            </p>
          )}
        </div>

        {includeSelfAsFirstShareholder && showSpouseOption && (
          <label
            htmlFor={`${prefix}spouseHolder`}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              spouseIsShareholder
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <Checkbox
              id={`${prefix}spouseHolder`}
              checked={spouseIsShareholder}
              onCheckedChange={(c) => toggleSpouseHolder(!!c)}
            />
            <span className="text-base font-bold">
              גם {spouseDisplayName} (בן/בת הזוג) הוא בעל מניות
            </span>
          </label>
        )}




        {shareholders.map((sh: any, idx: number) => {
          const isAuto = includeSelfAsFirstShareholder && (sh?.isSelf || sh?.isSpouse);
          const ht = sh?.holderType;
          const isCompanyHolder = ht === "company" || ht === "self_via_company";
          const companyHolderName = isCompanyHolder
            ? (sh?.isExistingCompany === false
                ? (sh?.requestedName1?.trim() || "")
                : (sh?.companyName?.trim() || sh?.name?.trim() || ""))
            : "";
          const displayName = sh?.isSelf
            ? selfName
            : sh?.isSpouse
            ? spouseDisplayName
            : isCompanyHolder
            ? (companyHolderName || `בעל מניות ${idx + 1}`)
            : (sh?.name?.trim() || `בעל מניות ${idx + 1}`);
          const othersTotal = shareholders.reduce(
            (s: number, p: any, i: number) =>
              i === idx ? s : s + (parseFloat(p?.percentage) || 0),
            0
          );
          const maxPct = Math.max(0, 100 - othersTotal);
          const othersAllFilled = shareholders.length > 1 && shareholders.every((p: any, i: number) => i === idx || (parseFloat(p?.percentage) || 0) > 0);
          const pctAutoFill = othersAllFilled ? maxPct : undefined;
          return (
            <div key={idx} className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <h4 className="font-bold text-primary">
                בעל מניות #{idx + 1}{parentCompanyName ? <> של <span className="text-foreground">{parentCompanyName}</span></> : null} – {displayName}
                {sh?.isSelf && (
                  <span className="text-xs mr-2 text-muted-foreground font-normal">
                    (אני – ממלא/ת השאלון, הפרטים מולאו אוטומטית)
                  </span>
                )}
                {sh?.isSpouse && (
                  <span className="text-xs mr-2 text-muted-foreground font-normal">
                    (בן/בת הזוג, הפרטים מולאו אוטומטית)
                  </span>
                )}
              </h4>

              {isAuto ? (
                isNewCompany ? (
                  <div className="space-y-1 max-w-xs">
                    <Label>אחוזי אחזקה *</Label>
                    <AutoPercentageInput
                      value={sh.percentage || ""}
                      onChange={(value) => updateShareholder(idx, "percentage", value)}
                      max={maxPct}
                      autoFillTo={pctAutoFill}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">הפרטים מולאו אוטומטית.</p>
                )
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>סוג בעל המניות</Label>
                    <Select
                      value={sh.holderType || ""}
                      onValueChange={(v) => updateShareholder(idx, "holderType", v)}
                    >
                      <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">אדם פרטי</SelectItem>
                        <SelectItem value="company">חברה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sh.holderType === "person" ? (
                    <>
                      {!includeSelfAsFirstShareholder && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">מי בעל המניות?</Label>
                          <PillGroup
                            value={sh.personOwnerType || ""}
                            onChange={(v) => {
                              const updated = [...shareholders];
                              const cur = { ...updated[idx], personOwnerType: v };
                              if (v === "self") {
                                cur.name = selfName;
                                cur.idNumber = selfIdNumber;
                                cur.phone = selfPhone;
                                cur.email = selfEmail;
                              } else if (v === "spouse") {
                                cur.name = spouseDisplayName;
                                cur.idNumber = spouseIdNumber;
                                cur.phone = spousePhone;
                                cur.email = spouseEmail;
                              } else if (v === "other") {
                                cur.name = "";
                                cur.idNumber = "";
                                cur.phone = "";
                                cur.email = "";
                              }
                              updated[idx] = cur;
                              updateCompany("shareholders", updated);
                            }}
                            options={[
                              { value: "self", label: selfName },
                              ...(showSpouseOption && spouseDisplayName ? [{ value: "spouse", label: spouseDisplayName }] : []),
                              { value: "other", label: "אחר" },
                            ]}
                          />
                        </div>
                      )}
                      {includeSelfAsFirstShareholder && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>שם מלא *</Label><Input value={sh.name || ""} onChange={(e) => updateShareholder(idx, "name", e.target.value)} /></div>
                            <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={sh.idNumber || ""} onChange={(e) => updateShareholder(idx, "idNumber", e.target.value)} /></div>
                            {isNewCompany && (
                              <div className="space-y-1">
                                <Label>אחוזי אחזקה *</Label>
                                <AutoPercentageInput
                                  value={sh.percentage || ""}
                                  onChange={(value) => updateShareholder(idx, "percentage", value)}
                                  max={maxPct}
                                  autoFillTo={pctAutoFill}
                                />
                              </div>
                            )}
                            <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={sh.phone || ""} onChange={(e) => updateShareholder(idx, "phone", e.target.value)} /></div>
                            <div className="space-y-1"><Label>מייל</Label><Input type="email" value={sh.email || ""} onChange={(e) => updateShareholder(idx, "email", e.target.value)} /></div>
                          </div>
                          <div className="space-y-2">
                            <Label>אמצעי זיהוי נוסף (מומלץ)</Label>
                            <Select value={sh.additionalIdType || ""} onValueChange={(v) => updateShareholder(idx, "additionalIdType", v)}>
                              <SelectTrigger><SelectValue placeholder="בחר אמצעי זיהוי" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="parentId">מס׳ זהות של הורה</SelectItem>
                                <SelectItem value="license">רישיון נהיגה</SelectItem>
                                <SelectItem value="passport">דרכון</SelectItem>
                              </SelectContent>
                            </Select>
                            {sh.additionalIdType && (
                              <Input placeholder="מספר אמצעי זיהוי" value={sh.additionalIdNumber || ""} onChange={(e) => updateShareholder(idx, "additionalIdNumber", e.target.value)} />
                            )}
                          </div>
                        </>
                      )}
                      {sh.personOwnerType === "other" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>שם מלא *</Label><Input value={sh.name || ""} onChange={(e) => updateShareholder(idx, "name", e.target.value)} /></div>
                          <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={sh.idNumber || ""} onChange={(e) => updateShareholder(idx, "idNumber", e.target.value)} /></div>
                          {isNewCompany && (
                            <div className="space-y-1">
                              <Label>אחוזי אחזקה *</Label>
                              <AutoPercentageInput
                                value={sh.percentage || ""}
                                onChange={(value) => updateShareholder(idx, "percentage", value)}
                                max={maxPct}
                                autoFillTo={pctAutoFill}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {!includeSelfAsFirstShareholder && (sh.personOwnerType === "self" || sh.personOwnerType === "spouse") && isNewCompany && (
                        <div className="space-y-1">
                          <Label>אחוזי אחזקה *</Label>
                          <AutoPercentageInput
                            value={sh.percentage || ""}
                            onChange={(value) => updateShareholder(idx, "percentage", value)}
                            max={maxPct}
                            autoFillTo={pctAutoFill}
                          />
                        </div>
                      )}
                    </>
                  ) : (sh.holderType === "self_via_company") ? (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      {(() => {
                        const nestedNormalizedSubOwnerType = sh.subOwnerType === "self_via_company" ? "person" : sh.subOwnerType || "";
                        const nestedPersonOwnerType = sh.personOwnerType || (sh.subOwnerType === "self_via_company" ? "self" : "");
                        return (
                          <>
                      <p className="text-xs text-primary font-semibold">אני (ממלא/ת השאלון) מחזיק/ה ב{parentCompanyName || "חברה זו"} באמצעות חברה.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>שם החברה דרכה אני מחזיק/ה *</Label><Input value={sh.companyName || ""} onChange={(e) => updateShareholder(idx, "companyName", e.target.value)} /></div>
                        <div className="space-y-1"><Label>ח.פ. *</Label><Input value={sh.companyNumber || ""} onChange={(e) => updateShareholder(idx, "companyNumber", e.target.value)} /></div>
                        {isNewCompany && (
                          <div className="space-y-1">
                            <Label>אחוזי אחזקה ב{parentCompanyName || "חברה החדשה"} *</Label>
                            <AutoPercentageInput
                              value={sh.percentage || ""}
                              onChange={(value) => updateShareholder(idx, "percentage", value)}
                              max={maxPct}
                              autoFillTo={pctAutoFill}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">סוג בעל המניות של {sh.companyName || "החברה דרכה אני מחזיק/ה"}</Label>
                        <Select
                          value={nestedNormalizedSubOwnerType}
                          onValueChange={(v: any) => updateShareholder(idx, "subOwnerType", v)}
                        >
                          <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="person">אדם פרטי</SelectItem>
                            <SelectItem value="company">חברה</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {nestedNormalizedSubOwnerType === "person" && (
                        <div className="space-y-3 p-3 bg-card rounded-lg border border-border/50">
                          <Label className="text-sm font-semibold">מי בעל המניות?</Label>
                          <PillGroup
                            value={nestedPersonOwnerType}
                            onChange={(v) => updateShareholder(idx, "personOwnerType", v)}
                            options={[
                              { value: "self", label: selfName },
                              ...(showSpouseOption && spouseDisplayName ? [{ value: "spouse", label: spouseDisplayName }] : []),
                              { value: "other", label: "אחר" },
                            ]}
                          />
                          {nestedPersonOwnerType === "self" && (
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-sm">{selfName} הוא/היא בעל/ת המניות של {sh.companyName || "החברה המחזיקה"}.</p>
                            </div>
                          )}
                          {nestedPersonOwnerType === "spouse" && (
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-sm">{spouseDisplayName} (בן/בת הזוג) הוא/היא בעל/ת המניות של {sh.companyName || "החברה המחזיקה"}.</p>
                            </div>
                          )}
                          {nestedPersonOwnerType === "other" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1"><Label>שם מלא *</Label><Input value={sh.personOwner?.name || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), name: e.target.value })} /></div>
                              <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={sh.personOwner?.idNumber || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), idNumber: e.target.value })} /></div>
                              <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={sh.personOwner?.phone || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), phone: e.target.value })} /></div>
                              <div className="space-y-1"><Label>מייל</Label><Input type="email" value={sh.personOwner?.email || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), email: e.target.value })} /></div>
                            </div>
                          )}
                        </div>
                      )}

                      {sh.subOwnerType === "company" && (
                        <CompanyChainBlock
                          data={sh.childCompany || {}}
                          onChange={(c) => updateShareholder(idx, "childCompany", c)}
                          heldName={sh.companyName || "החברה המחזיקה"}
                          depth={1}
                          selfName={selfName}
                          spouseName={spouseDisplayName}
                          showSpouseOption={showSpouseOption}
                          renderNewCompanyShareholders={renderNewCompanyShareholders}
                        />
                      )}
                          </>
                        );
                      })()}
                    </div>
                  ) : sh.holderType === "company" ? (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      {isNewCompany && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">האם החברה המחזיקה כבר קיימת או טרם הוקמה?</Label>
                          <PillGroup
                            value={(sh.isExistingCompany ?? true) ? "existing" : "new"}
                            onChange={(v) => updateShareholder(idx, "isExistingCompany", v === "existing")}
                            options={[
                              { value: "existing", label: "חברה קיימת" },
                              { value: "new", label: "חברה חדשה" },
                            ]}
                          />
                        </div>
                      )}
                      {(sh.isExistingCompany ?? true) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>שם החברה המחזיקה *</Label><Input value={sh.companyName || ""} onChange={(e) => updateShareholder(idx, "companyName", e.target.value)} /></div>
                          <div className="space-y-1"><Label>ח.פ. *</Label><Input value={sh.companyNumber || ""} onChange={(e) => updateShareholder(idx, "companyNumber", e.target.value)} /></div>
                          {isNewCompany && (
                            <div className="space-y-1">
                              <Label>אחוזי אחזקה ב{parentCompanyName || "חברה החדשה"} *</Label>
                              <AutoPercentageInput
                                value={sh.percentage || ""}
                                onChange={(value) => updateShareholder(idx, "percentage", value)}
                                max={maxPct}
                                autoFillTo={pctAutoFill}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="font-semibold">3 שמות רצויים לחברה המחזיקה ב{parentCompanyName || "חברה החדשה"} (לפי סדר עדיפות)</Label>
                            {[1, 2, 3].map((n) => (
                              <Input
                                key={n}
                                placeholder={`שם רצוי ${n}`}
                                value={(sh as any)[`requestedName${n}`] || ""}
                                onChange={(e) => updateShareholder(idx, `requestedName${n}` as any, e.target.value)}
                              />
                            ))}
                          </div>
                          {isNewCompany && (
                            <div className="space-y-1">
                              <Label>אחוזי אחזקה ב{parentCompanyName || "חברה החדשה"} *</Label>
                              <AutoPercentageInput
                                value={sh.percentage || ""}
                                onChange={(value) => updateShareholder(idx, "percentage", value)}
                                max={maxPct}
                                autoFillTo={pctAutoFill}
                              />
                            </div>
                          )}
                        </div>
                      )}


                      {(() => {
                        const shIsExisting = isNewCompany ? (sh.isExistingCompany ?? true) : true;
                        const shNormalizedSubOwnerType = sh.subOwnerType === "self_via_company" ? "company" : sh.subOwnerType;

                        // When this shareholder is itself a NEW company, render the full
                        // shareholders flow on it (same as outermost), instead of the simple
                        // person/company picker.
                        if (!shIsExisting) {
                          return renderNewCompanyShareholders(
                            sh,
                            (next: any) => {
                              const updated = [...shareholders];
                              updated[idx] = next;
                              updateCompany("shareholders", updated);
                            },
                            sh.companyName || (sh as any).requestedName1 || "החברה המחזיקה החדשה",
                            `shholder_${idx}_`,
                          );
                        }

                        return (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">
                                אחד מבעלי המניות של {sh.companyName || "החברה המחזיקה"}
                              </Label>
                              <Select
                                value={sh.subOwnerType === "self_via_company" ? "company" : sh.subOwnerType || ""}
                                onValueChange={(v: any) => updateShareholder(idx, "subOwnerType", v)}
                              >
                                <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="person">אדם פרטי</SelectItem>
                                  <SelectItem value="company">חברה</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {shNormalizedSubOwnerType === "person" && (
                              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                <Label className="text-sm font-semibold">מי בעל המניות?</Label>
                                <PillGroup
                                  value={sh.personOwnerType || ""}
                                  onChange={(v) => updateShareholder(idx, "personOwnerType", v)}
                                  options={[
                                    { value: "self", label: selfName },
                                    ...(showSpouseOption && spouseDisplayName ? [{ value: "spouse", label: spouseDisplayName }] : []),
                                    { value: "other", label: "אחר" },
                                  ]}
                                />
                                {sh.personOwnerType === "self" && (
                                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="text-sm">{selfName} הוא/היא בעל/ת המניות של {sh.companyName || "החברה המחזיקה"}.</p>
                                  </div>
                                )}
                                {sh.personOwnerType === "spouse" && (
                                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="text-sm">{spouseDisplayName} (בן/בת הזוג) הוא/היא בעל/ת המניות של {sh.companyName || "החברה המחזיקה"}.</p>
                                  </div>
                                )}
                                {sh.personOwnerType === "other" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label>שם מלא *</Label><Input value={sh.personOwner?.name || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), name: e.target.value })} /></div>
                                    <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={sh.personOwner?.idNumber || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), idNumber: e.target.value })} /></div>
                                    <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={sh.personOwner?.phone || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), phone: e.target.value })} /></div>
                                    <div className="space-y-1"><Label>מייל</Label><Input type="email" value={sh.personOwner?.email || ""} onChange={(e) => updateShareholder(idx, "personOwner", { ...(sh.personOwner || {}), email: e.target.value })} /></div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(sh.subOwnerType === "company" || sh.subOwnerType === "self_via_company") && (
                              <CompanyChainBlock
                                data={sh.childCompany || {}}
                                onChange={(c) => updateShareholder(idx, "childCompany", c)}
                                heldName={sh.companyName || (sh as any).requestedName1 || "החברה הקודמת"}
                                depth={1}
                                chainAllowsNewCompany={false}
                                selfName={selfName}
                                spouseName={spouseDisplayName}
                                showSpouseOption={showSpouseOption}
                                offerSelfInPersonOption={true}
                                renderNewCompanyShareholders={renderNewCompanyShareholders}
                              />
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}



      </div>
    );
  };

  // ─── New Business ───
  const renderNewBusiness = (
    info: any,
    setInfo: any,
    name: string,
    lastName: string,
    gender: "male" | "female" | "",
    idNumber: string,
    prefix = ""
  ) => (
    <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
      <h3 className="text-xl font-bold text-primary">
        העסק החדש של <span className="underline decoration-primary/50">{name}</span>
      </h3>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}businessName`}>שם העסק</Label>
        <Input
          id={`${prefix}businessName`}
          value={info.businessName || ""}
          onChange={(e) => setInfo({ businessName: e.target.value })}
          placeholder={`ברירת מחדל: ${name} ${lastName}`.trim()}
        />
        <p className="text-xs text-muted-foreground">לא חייבים לבחור שם עסק, ברירת המחדל היא שמך המלא</p>
      </div>

      <div className="space-y-2">
        <Label>
          {g(gender, "האם אתה עכשיו באבטלה או בחופשת לידה?", "האם את עכשיו באבטלה או בחופשת לידה?")}
        </Label>
        <YesNoSelect value={info.isUnemployedOrMaternity} onChange={(v) => setInfo({ isUnemployedOrMaternity: v })} />
      </div>

      <div className="space-y-2">
        <Label>
          {g(gender, "האם היה לך עסק עצמאי בעבר?", "האם היה לך עסק עצמאי בעבר?")}
        </Label>
        <YesNoSelect value={info.hadPreviousBusiness} onChange={(v) => setInfo({ hadPreviousBusiness: v })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}businessField`}>תחום העיסוק</Label>
        <Input id={`${prefix}businessField`} value={info.businessField || ""} onChange={(e) => setInfo({ businessField: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <Select value={info.businessType || ""} onValueChange={(v: any) => setInfo({ businessType: v })}>
          <SelectTrigger>
            <SelectValue placeholder="בחר סוג עסק" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exempt">פטור</SelectItem>
            <SelectItem value="authorized">מורשה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Separate bank account question for authorized */}
      {info.businessType === "authorized" && (
        <div className="space-y-2">
          <Label>האם יש חשבון בנק נפרד לעסק?</Label>
          <YesNoSelect
            value={info.hasSeparateBankAccount}
            onChange={(v) => setInfo({ hasSeparateBankAccount: v })}
          />
          {info.hasSeparateBankAccount === false && (
            <div className="flex items-start gap-2 p-3 bg-muted/40 border border-border rounded-lg mt-2">
              <p className="text-sm text-muted-foreground">
                לתשומת ליבך — ניתן לעדכן כל חשבון בנק של בעל העסק ואין חובה לפתוח חשבון נפרד לעסק, אם כי מומלץ.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bank details for authorized - shown when separate account exists */}
      {info.businessType === "authorized" && info.hasSeparateBankAccount === true && (
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border">
          <Label className="text-base font-semibold">פרטי חשבון בנק של העסק *</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>בנק *</Label><Input value={info.bankDetails?.bank || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, bank: e.target.value } })} /></div>
            <div className="space-y-1"><Label>סניף *</Label><Input value={info.bankDetails?.branch || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, branch: e.target.value } })} /></div>
            <div className="space-y-1"><Label>מספר חשבון *</Label><Input value={info.bankDetails?.accountNumber || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountNumber: e.target.value } })} /></div>
            <div className="space-y-1"><Label>שם בעל החשבון *</Label><Input value={info.bankDetails?.accountHolder || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountHolder: e.target.value } })} /></div>
          </div>
        </div>
      )}


      <div className="space-y-2">
        <Label>{g(gender, "האם אתה רוצה להיות עוסק זעיר?", "האם את רוצה להיות עוסקת זעירה?")}</Label>
        <YesNoSelect value={info.wantSmallBusiness} onChange={(v) => setInfo({ wantSmallBusiness: v })} />
        {info.wantSmallBusiness === true && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mt-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">
              הגדרת עוסק זעיר בחוק דורשת עמידה בתנאים שונים ולכן יש לתאם מועד לשיחת בירור.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה בעלים יחיד או בשותפות?", "האם את בעלים יחידה או בשותפות?")}</Label>
        <Select value={info.ownershipType || ""} onValueChange={(v: any) => setInfo({ ownershipType: v })}>
          <SelectTrigger>
            <SelectValue placeholder="בחר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sole">{g(gender, "יחיד", "יחידה")}</SelectItem>
            <SelectItem value="partnership">שותפות</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {info.ownershipType === "partnership" && renderPartnershipSection(info, setInfo, name, idNumber, prefix)}

      <div className="space-y-2">
        <Label>האם העסק מתנהל מהבית?</Label>
        <YesNoSelect value={info.isHomeOffice} onChange={(v) => setInfo({ isHomeOffice: v })} />
      </div>


      {info.isHomeOffice === false && (
        <div className="space-y-3 mr-4">
          <Label className="text-base font-semibold">כתובת העסק</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${prefix}street`}>רחוב</Label>
              <Input id={`${prefix}street`} value={info.businessAddress?.street || ""} onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, street: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${prefix}number`}>מספר</Label>
              <Input id={`${prefix}number`} value={info.businessAddress?.number || ""} onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, number: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${prefix}city`}>עיר</Label>
              <Input id={`${prefix}city`} value={info.businessAddress?.city || ""} onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, city: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>האם העסק צפוי להעסיק עובדים?</Label>
        <YesNoSelect value={info.planningEmployees} onChange={(v) => setInfo({ planningEmployees: v })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}activityStartDate`}>מתי התחילה הפעילות העסקית?</Label>
        <Input id={`${prefix}activityStartDate`} type="date" value={info.activityStartDate || ""} onChange={(e) => setInfo({ activityStartDate: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}expectedRevenue`}>מה המחזור הצפוי בעסק השנה?</Label>
        <Input id={`${prefix}expectedRevenue`} value={info.expectedRevenue || ""} onChange={(e) => setInfo({ expectedRevenue: e.target.value })} placeholder="לדוגמה: 100,000 ₪" />
      </div>
    </div>
  );

  // ─── Existing Business ───
  const renderExistingBusiness = (
    info: any,
    setInfo: any,
    name: string,
    gender: "male" | "female" | "",
    idNumber: string,
    prefix = "",
    isWarComp = false
  ) => (
    <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
      <h3 className="text-xl font-bold text-primary">
        העסק הקיים של <span className="underline decoration-primary/50">{name}</span>
      </h3>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה בעלים יחיד או בשותפות?", "האם את בעלים יחידה או בשותפות?")}</Label>
        <Select value={info.ownershipType || ""} onValueChange={(v: any) => setInfo({ ownershipType: v })}>
          <SelectTrigger>
            <SelectValue placeholder="בחר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sole">{g(gender, "יחיד", "יחידה")}</SelectItem>
            <SelectItem value="partnership">שותפות</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Business / partnership number – only shown for partnership */}
      {info.ownershipType === "partnership" && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}exBusinessNumber`}>מספר עוסק / שותפות</Label>
          <Input
            id={`${prefix}exBusinessNumber`}
            value={info.businessNumber || ""}
            onChange={(e) => setInfo({ businessNumber: e.target.value })}
          />
        </div>
      )}

      {info.ownershipType === "partnership" && renderPartnershipSection(info, setInfo, name, idNumber, prefix, isWarComp, "existingPartners", "existingPartnershipAgreementFile")}

      <div className="space-y-2">
        <Label>האם העסק מעסיק עובדים?</Label>
        <YesNoSelect value={info.hasEmployees} onChange={(v) => setInfo({ hasEmployees: v })} />
      </div>
    </div>
  );

  // ─── Company (Purpose 4) ───
  const renderCompany = (
    info: any,
    setInfo: any,
    name: string,
    gender: "male" | "female" | "",
    selfIdNumber: string,
    selfPhone: string,
    selfEmail: string,
    spouseDisplayName: string,
    spouseIdNumber: string,
    spousePhone: string,
    spouseEmail: string,
    showSpouseOption: boolean,
    prefix = "",
    isWarComp: boolean = false
  ) => {
    // Collect all holding-company chain structures from OTHER companies (by ח.פ.)
    // so SelfViaCompanyBlock can auto-fill when the same holding company is reused.
    const collectKnownChains = (): Map<string, any> => {
      const map = new Map<string, any>();
      const walk = (svc: any) => {
        if (!svc) return;
        const key = svc?.companyNumber?.trim();
        if (key && svc.subOwnerType) map.set(key, svc);
        if (svc.childCompany) walk(svc.childCompany);
      };
      for (const c of [...(info?.existingCompanies || []), ...(info?.newCompanies || [])]) {
        if (c.selfViaCompany) walk(c.selfViaCompany);
        for (const sh of c.shareholders || []) {
          if (sh.childCompany) walk(sh.childCompany);
        }
      }
      return map;
    };
    const knownChains = collectKnownChains();

    const isSpouseSection = prefix.startsWith("sp");
    const hasExistingPurpose = isSpouseSection
      ? (serviceType.spousePurposeStatus?.company?.includes("existing") || spouseWarEntities.includes("company"))
      : (serviceType.userPurposeStatus?.company?.includes("existing") || userWarEntities.includes("company"));
    const hasNewPurpose = isSpouseSection
      ? serviceType.spousePurposeStatus?.company?.includes("new")
      : serviceType.userPurposeStatus?.company?.includes("new");

    const existingCount = info.existingCompanyCount || 0;
    const newCount = info.newCompanyCount || 0;

    const updateExistingCompany = (idx: number, field: string, value: any) => {
      const updated = [...(info.existingCompanies || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      setInfo({ existingCompanies: updated });
    };

    // Renderer for "new company" branches inside SelfViaCompanyBlock chain
    const renderNewCompanyShareholdersTop = (
      node: any,
      onNodeChange: (next: any) => void,
      displayName: string,
      keyPrefix: string,
    ) =>
      renderShareholdersSection(
        node,
        (field: string, value: any) => onNodeChange({ ...node, [field]: value }),
        (updates: Record<string, any>) => onNodeChange({ ...node, ...updates }),
        name,
        selfIdNumber,
        selfPhone,
        selfEmail,
        spouseDisplayName,
        spouseIdNumber,
        spousePhone,
        spouseEmail,
        showSpouseOption,
        `${prefix}svc_${keyPrefix}`,
        true,
        displayName,
        false,
      );



    return (
      <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
        <h3 className="text-xl font-bold text-primary">
          חברות של <span className="underline decoration-primary/50">{name}</span>
        </h3>

        {/* ── חברות חדשות ── */}
        {hasNewPurpose && (
          <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-background/40">
            <h4 className="font-bold text-base text-primary">חברות חדשות</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor={`${prefix}newCount`}>כמה חברות חדשות רוצה לפתוח?</Label>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  שאינן חברות אם
                </span>
              </div>
              <Input
                id={`${prefix}newCount`}
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={newCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 0;
                  const companies = info.newCompanies || [];
                  const adjusted = Array.from({ length: count }, (_, i) => companies[i] || {});
                  setInfo({ newCompanyCount: count, newCompanies: adjusted });
                }}
              />
            </div>
            {newCount > 0 && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-sm text-center text-primary font-medium">
                המשרד ייצור איתך קשר למילוי פרטי {newCount === 1 ? "החברה החדשה" : `${newCount} החברות החדשות`}
              </div>
            )}
          </div>
        )}

        {/* ── חברות קיימות ── */}
        {hasExistingPurpose && (
          <div className="space-y-3 p-4 border border-border/50 rounded-xl bg-background/40">
            <h4 className="font-bold text-base text-primary">חברות קיימות</h4>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}existingCount`}>לכמה חברות קיימות מעוניין לקבל שירות?</Label>
              <Input
                id={`${prefix}existingCount`}
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={existingCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 0;
                  const companies = info.existingCompanies || [];
                  const adjusted = Array.from({ length: count }, (_, i) => companies[i] || { name: "", companyNumber: "" });
                  setInfo({ existingCompanyCount: count, existingCompanies: adjusted });
                }}
              />
            </div>
            {existingCount > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">כיצד תרצה למלא את פרטי החברות הקיימות?</Label>
                <PillGroup
                  value={info.existingCompanyFillMode || ""}
                  onChange={(v) => setInfo({ existingCompanyFillMode: v as "self" | "office" })}
                  options={[
                    { value: "self", label: "אמלא את הפרטים עצמאית" },
                    { value: "office", label: "אשמח לעזרת המשרד במילוי השאלון" },
                  ]}
                />
              </div>
            )}
            {existingCount > 0 && info.existingCompanyFillMode === "office" && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-sm text-center text-primary font-medium">
                המשרד ייצור איתך קשר לסיוע במילוי פרטי {existingCount === 1 ? "החברה הקיימת" : `${existingCount} החברות הקיימות`}
              </div>
            )}
          </div>
        )}

        {/* Upfront names + per-company forms — self fill mode only */}
        {hasExistingPurpose && existingCount > 0 && info.existingCompanyFillMode === "self" && (
          <div className="space-y-2 p-3 border border-border/60 rounded-lg bg-background/50">
            <Label className="font-semibold">שמות החברות הקיימות</Label>
            {(info.existingCompanies || []).map((company: any, idx: number) => (
              <Input
                key={`exname-${idx}`}
                placeholder={`שם חברה קיימת #${idx + 1}`}
                value={company.name || ""}
                onChange={(e) => updateExistingCompany(idx, "name", e.target.value)}
              />
            ))}
          </div>
        )}
        {hasExistingPurpose && existingCount > 0 && info.existingCompanyFillMode === "self" && (info.existingCompanies || []).map((company: any, idx: number) => (
          <div key={`existing-${idx}`} className="space-y-4 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary text-base">
              חברה קיימת #{idx + 1}{company.name ? ` – ${company.name}` : ""}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>שם חברה</Label>
                <Input
                  value={company.name || ""}
                  onChange={(e) => updateExistingCompany(idx, "name", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>ח.פ.</Label>
                <Input
                  value={company.companyNumber || ""}
                  onChange={(e) => updateExistingCompany(idx, "companyNumber", e.target.value)}
                />
              </div>
            </div>

            {/* Tax file question (hidden for war compensation: tax file is required) */}
            {!isWarComp && (
              <div className="space-y-2">
                <Label>האם יש לחברה תיק ברשות המיסים?</Label>
                <YesNoSelect
                  value={company.hasTaxFile}
                  onChange={(v) => updateExistingCompany(idx, "hasTaxFile", v)}
                />
              </div>
            )}

            {!isWarComp && company.hasTaxFile === false && (
              <div className="space-y-4 mr-4">
                {/* Bank account */}
                <div className="space-y-2">
                  <Label>האם יש לחברה חשבון בנק?</Label>
                  <YesNoSelect
                    value={company.hasBankAccount}
                    onChange={(v) => updateExistingCompany(idx, "hasBankAccount", v)}
                  />
                </div>

                {company.hasBankAccount === false && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">
                      לא ניתן לפתוח לחברה תיק ברשויות טרם פתיחת חשבון בנק.
                    </p>
                  </div>
                )}

                {company.hasBankAccount === true && (
                  <div className="space-y-3 p-4 bg-card rounded-xl border border-border">
                    <Label className="text-base font-semibold">פרטי חשבון בנק של החברה *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>בנק</Label><Input value={company.bankDetails?.bank || ""} onChange={(e) => updateExistingCompany(idx, "bankDetails", { ...company.bankDetails, bank: e.target.value })} /></div>
                      <div className="space-y-1"><Label>סניף</Label><Input value={company.bankDetails?.branch || ""} onChange={(e) => updateExistingCompany(idx, "bankDetails", { ...company.bankDetails, branch: e.target.value })} /></div>
                      <div className="space-y-1"><Label>מספר חשבון</Label><Input value={company.bankDetails?.accountNumber || ""} onChange={(e) => updateExistingCompany(idx, "bankDetails", { ...company.bankDetails, accountNumber: e.target.value })} /></div>
                      <div className="space-y-1"><Label>שם בעל החשבון</Label><Input value={company.bankDetails?.accountHolder || ""} onChange={(e) => updateExistingCompany(idx, "bankDetails", { ...company.bankDetails, accountHolder: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {/* Activity start date */}
                <div className="space-y-2">
                  <Label>מתי התחילה הפעילות בחברה?</Label>
                  <Input type="date" value={company.activityStartDate || ""} onChange={(e) => updateExistingCompany(idx, "activityStartDate", e.target.value)} />
                </div>

                {/* Has employees */}
                <div className="space-y-2">
                  <Label>האם החברה מעסיקה עובדים?</Label>
                  <YesNoSelect
                    value={company.hasEmployees}
                    onChange={(v) => updateExistingCompany(idx, "hasEmployees", v)}
                  />
                </div>
              </div>
            )}

            {/* Shareholders - simplified for existing companies: only filler details needed */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">פרטי אחד מבעלי המניות</Label>
              <PillGroup
                value={company.shareholderType || ""}
                onChange={(v) => updateExistingCompany(idx, "shareholderType", v)}
                options={[
                  { value: "alone", label: `${name} ישירות` },
                  { value: "self_via_company", label: `${name} באמצעות חברה` },
                ]}
              />

            </div>

            {company.shareholderType === "self_via_company" && (
              <SelfViaCompanyBlock
                data={company.selfViaCompany || {}}
                onChange={(d) => updateExistingCompany(idx, "selfViaCompany", d)}
                parentCompanyName={company.name || `החברה הקיימת #${idx + 1}`}
                isNewCompany={false}
                fillerName={name}
                gender={gender}
                selfName={name}
                spouseName={spouseDisplayName}
                showSpouseOption={showSpouseOption}
                renderNewCompanyShareholders={renderNewCompanyShareholdersTop}
                knownChains={knownChains}
              />
            )}
          </div>
        ))}

      </div>
    );
  };

  // ─── Gov Portal Identification helpers ───
  const GOV_PORTAL_OPTIONS: { value: GovPortalIdMethod; label: string; icon: string; desc?: string }[] = [
    { value: "password", label: "סיסמא", icon: "🔑" },
    { value: "smartCard", label: "כרטיס חכם", icon: "💳" },
    { value: "biometricId", label: "תעודת זהות ביומטרית", icon: "🪪" },
    { value: "fastLogin", label: "כניסה מהירה (ביומטרי)", icon: "👆", desc: "כניסה ללא סיסמה בעזרת זיהוי ביומטרי מטלפון חכם" },
  ];

  const renderGovPortalSection = (
    methods: GovPortalIdMethod[] | undefined,
    password: string | undefined,
    onMethodsChange: (m: GovPortalIdMethod[]) => void,
    onPasswordChange: (p: string) => void,
  ) => {
    const selected = methods || [];
    const toggle = (m: GovPortalIdMethod) => {
      const next = selected.includes(m) ? selected.filter(x => x !== m) : [...selected, m];
      onMethodsChange(next);
    };
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {GOV_PORTAL_OPTIONS.map(opt => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  checked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(opt.value)} className="mt-0.5" />
                <span className="text-lg leading-tight">{opt.icon}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {opt.desc && <span className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</span>}
                </span>
              </label>
            );
          })}
        </div>
        {selected.includes("password") && (
          <div className="space-y-1">
            <Label>סיסמא לאזור אישי ממשלתי</Label>
            <Input
              type="password"
              value={password || ""}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="הקלד/י סיסמא"
            />
          </div>
        )}
      </div>
    );
  };

  // ─── New Nonprofit ───
  const renderNewNonprofit = (
    info: NonprofitInfo,
    setInfo: (d: Partial<NonprofitInfo>) => void,
    name: string,
  ) => {
    const boardMembers = info.boardMembers || [];

    const updateBoardMember = (idx: number, field: string, value: any) => {
      const updated = [...boardMembers];
      updated[idx] = { ...updated[idx], [field]: value };
      setInfo({ boardMembers: updated });
    };

    const handleBoardCountChange = (count: number) => {
      if (count < 7) count = 7;
      const adjusted: NonprofitBoardMember[] = Array.from({ length: count }, (_, i) =>
        boardMembers[i] || { name: "", idNumber: "", email: "", phone: "", address: "", isAuthorizedSigner: false, isAuditCommittee: false }
      );
      setInfo({ boardMemberCount: count, boardMembers: adjusted });
    };

    const authorizedSignerCount = boardMembers.filter(m => m.isAuthorizedSigner).length;
    const auditCommitteeCount = boardMembers.filter(m => m.isAuditCommittee).length;

    const requestedNamesDisplay = [info.requestedName1, info.requestedName2, info.requestedName3]
      .filter((n) => n && n.trim())
      .join(" / ");

    return (
      <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
        <h3 className="text-xl font-bold text-primary">
          עמותה חדשה{requestedNamesDisplay ? <> – <span className="underline decoration-primary/50">{requestedNamesDisplay}</span></> : <> – <span className="underline decoration-primary/50">{name}</span></>}
        </h3>

        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
          ⚠️ <strong>שים/י לב:</strong> בעמותה, ממלא/ת השאלון לרוב <strong>אינו</strong> חבר ועד (בשונה מחברה).
          יש למלא פרטים מלאים של כל 7 חברי הועד.
        </div>

        {/* 3 requested names */}
        <div className="space-y-3">
          <Label className="font-semibold">3 שמות רצויים לעמותה (לפי סדר עדיפות)</Label>
          {[1, 2, 3].map((n) => (
            <Input
              key={n}
              placeholder={`שם רצוי ${n}`}
              value={(info as any)[`requestedName${n}`] || ""}
              onChange={(e) => setInfo({ [`requestedName${n}`]: e.target.value } as any)}
            />
          ))}
        </div>

        {/* Objectives */}
        <div className="space-y-2">
          <Label>מטרות העמותה *</Label>
          <Textarea
            value={info.objectives || ""}
            onChange={(e) => setInfo({ objectives: e.target.value })}
            placeholder="תאר/י את מטרות העמותה..."
            rows={4}
          />
        </div>

        {/* Board member count */}
        <div className="space-y-2">
          <Label>מספר חברי ועד (מינימום 7)</Label>
          <Input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={info.boardMemberCount || ""}
            onChange={(e) => handleBoardCountChange(parseInt(e.target.value) || 7)}
          />
        </div>

        {/* Board members details */}
        {boardMembers.map((member, idx) => {
          const blockSigner = !!member.isAuditCommittee || (!member.isAuthorizedSigner && authorizedSignerCount >= 2);
          const blockAudit = !!member.isAuthorizedSigner || (!member.isAuditCommittee && auditCommitteeCount >= 2);
          return (
            <div key={idx} className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <h4 className="font-bold text-primary">חבר ועד #{idx + 1}{member.name ? ` – ${member.name}` : ""}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1"><Label>שם מלא *</Label><Input value={member.name || ""} onChange={(e) => updateBoardMember(idx, "name", e.target.value)} /></div>
                <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={member.idNumber || ""} onChange={(e) => updateBoardMember(idx, "idNumber", e.target.value)} /></div>
                <div className="space-y-1"><Label>טלפון *</Label><Input type="tel" value={member.phone || ""} onChange={(e) => updateBoardMember(idx, "phone", e.target.value)} /></div>
                <div className="space-y-1"><Label>מייל *</Label><Input type="email" value={member.email || ""} onChange={(e) => updateBoardMember(idx, "email", e.target.value)} /></div>
                <div className="space-y-1"><Label>כתובת *</Label><Input value={member.address || ""} onChange={(e) => updateBoardMember(idx, "address", e.target.value)} placeholder="רחוב ומספר" /></div>
                <div className="space-y-1"><Label>עיר *</Label><Input value={member.city || ""} onChange={(e) => updateBoardMember(idx, "city", e.target.value)} /></div>
                <div className="space-y-1"><Label>מיקוד (עדיף)</Label><Input value={member.zip || ""} onChange={(e) => updateBoardMember(idx, "zip", e.target.value)} /></div>
              </div>

              {/* Role checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <label
                  htmlFor={`signer_${idx}`}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    member.isAuthorizedSigner
                      ? "border-primary bg-primary/10"
                      : blockSigner
                        ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                        : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    id={`signer_${idx}`}
                    checked={member.isAuthorizedSigner || false}
                    disabled={blockSigner}
                    onCheckedChange={(checked) => updateBoardMember(idx, "isAuthorizedSigner", !!checked)}
                  />
                  <span className="text-sm font-semibold">✍️ מורשה חתימה</span>
                </label>
                <label
                  htmlFor={`audit_${idx}`}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    member.isAuditCommittee
                      ? "border-primary bg-primary/10"
                      : blockAudit
                        ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                        : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    id={`audit_${idx}`}
                    checked={member.isAuditCommittee || false}
                    disabled={blockAudit}
                    onCheckedChange={(checked) => updateBoardMember(idx, "isAuditCommittee", !!checked)}
                  />
                  <span className="text-sm font-semibold">🔍 חבר ועדת ביקורת</span>
                </label>
              </div>
            </div>
          );
        })}

        {/* Validation: signers */}
        {boardMembers.length > 0 && authorizedSignerCount !== 2 && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">יש לסמן 2 מורשי חתימה מבין חברי הועד (סומנו {authorizedSignerCount}).</p>
          </div>
        )}

        {/* Validation: audit committee */}
        {boardMembers.length > 0 && auditCommitteeCount !== 2 && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">יש לסמן 2 חברי ועדת ביקורת מבין חברי הועד (סומנו {auditCommitteeCount}).</p>
          </div>
        )}

        {/* Gov portal identification - select board members (multi) */}
        <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/15">
          <Label className="text-base font-semibold">🔐 הזדהות לאזור אישי ממשלתי (אופציונלי)</Label>
          <p className="text-xs text-muted-foreground">
            נדרש לאחד מחברי הועד (עדיף יותר מאחד). סמנ/י את חברי הועד שניתן להזדהות באמצעותם.
          </p>
          {boardMembers.length === 0 && (
            <p className="text-sm text-muted-foreground">יש למלא תחילה את חברי הועד.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boardMembers.map((m, idx) => {
              const selectedIdxs = info.govPortalBoardMemberIdxs || [];
              const checked = selectedIdxs.includes(idx);
              const disabled = !m.name;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    checked
                      ? "border-primary bg-primary/10"
                      : disabled
                        ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                        : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(c) => {
                      const current = info.govPortalBoardMemberIdxs || [];
                      const updated = c
                        ? [...current, idx]
                        : current.filter((v) => v !== idx);
                      setInfo({ govPortalBoardMemberIdxs: updated });
                    }}
                  />
                  <span className="text-sm font-semibold">{m.name || `חבר ועד ${idx + 1}`}</span>
                </label>
              );
            })}
          </div>
          {(info.govPortalBoardMemberIdxs || []).length > 0 && (
            <div className="space-y-2">
              <Label>אופן הזדהות (לא חובה)</Label>
              {renderGovPortalSection(
                info.govPortalIdMethods,
                info.govPortalPassword,
                (m) => setInfo({ govPortalIdMethods: m }),
                (p) => setInfo({ govPortalPassword: p }),
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Existing Nonprofit ───
  const renderExistingNonprofit = (
    info: NonprofitInfo,
    setInfo: (d: Partial<NonprofitInfo>) => void,
    name: string,
    isWarComp: boolean = false,
  ) => {
    const boardMembers = info.existingBoardMembers || [];

    const updateBoardMember = (idx: number, field: string, value: any) => {
      const updated = [...boardMembers];
      updated[idx] = { ...updated[idx], [field]: value };
      setInfo({ existingBoardMembers: updated });
    };

    const handleCountChange = (count: number) => {
      const adjusted: NonprofitBoardMember[] = Array.from({ length: count }, (_, i) =>
        boardMembers[i] || { name: "", idNumber: "", email: "", phone: "", address: "", isAuthorizedSigner: false }
      );
      setInfo({ existingBoardMemberCount: count, existingBoardMembers: adjusted });
    };

    return (
      <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
        <h3 className="text-xl font-bold text-primary">
          עמותה קיימת – <span className="underline decoration-primary/50">{name}</span>
        </h3>

        {/* Name and number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>שם העמותה *</Label>
            <Input
              value={info.nonprofitName || ""}
              onChange={(e) => setInfo({ nonprofitName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>מספר העמותה *</Label>
            <Input
              value={info.nonprofitNumber || ""}
              onChange={(e) => setInfo({ nonprofitNumber: e.target.value })}
            />
          </div>
        </div>

        {/* Tax file question - drives the entire flow (hidden for war compensation: tax file is required) */}
        {!isWarComp && (
          <div className="space-y-2">
            <Label>האם לעמותה קיים תיק ברשות המיסים?</Label>
            <YesNoSelect
              value={info.hasTaxFile}
              onChange={(v) => setInfo({ hasTaxFile: v })}
            />
          </div>
        )}

        {/* WITH tax file: only need full details of one representative board member */}
        {(isWarComp || info.hasTaxFile === true) && (() => {
          const rep = info.representativeMember || ({} as NonNullable<NonprofitInfo["representativeMember"]>);
          const updateRep = (field: string, value: any) =>
            setInfo({ representativeMember: { ...(rep as any), [field]: value } });
          const additionalIdTypes = rep.additionalIdTypes || [];
          const toggleAdditional = (t: "parentId" | "license" | "passport") => {
            const next = additionalIdTypes.includes(t)
              ? additionalIdTypes.filter((x) => x !== t)
              : [...additionalIdTypes, t];
            updateRep("additionalIdTypes", next);
          };
          return (
            <div className="space-y-4 mr-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
                ✅ מאחר שיש לעמותה תיק ברשות המיסים, מספיק חבר ועד אחד לצורך הפקת ייצוג.
              </div>

              <div className="space-y-3 p-4 border border-border rounded-xl bg-card">
                <h4 className="font-bold text-primary">חבר ועד לצורך הפקת ייצוג{rep.name ? ` – ${rep.name}` : ""}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>שם מלא *</Label><Input value={rep.name || ""} onChange={(e) => updateRep("name", e.target.value)} /></div>
                  <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={rep.idNumber || ""} onChange={(e) => updateRep("idNumber", e.target.value)} /></div>
                  <div className="space-y-1"><Label>טלפון *</Label><Input type="tel" value={rep.phone || ""} onChange={(e) => updateRep("phone", e.target.value)} /></div>
                  <div className="space-y-1"><Label>מייל *</Label><Input type="email" value={rep.email || ""} onChange={(e) => updateRep("email", e.target.value)} /></div>
                  <div className="space-y-1"><Label>כתובת *</Label><Input value={rep.address || ""} onChange={(e) => updateRep("address", e.target.value)} placeholder="רחוב ומספר" /></div>
                  <div className="space-y-1"><Label>עיר *</Label><Input value={rep.city || ""} onChange={(e) => updateRep("city", e.target.value)} /></div>
                  <div className="space-y-1"><Label>מיקוד (עדיף)</Label><Input value={rep.zip || ""} onChange={(e) => updateRep("zip", e.target.value)} /></div>
                </div>

                {/* Additional ID */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <Label className="font-semibold">אמצעי זיהוי נוסף *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: "passport" as const, label: "דרכון" },
                      { value: "license" as const, label: "רישיון נהיגה" },
                      { value: "parentId" as const, label: "מס׳ זהות של הורה" },
                    ].map((opt) => {
                      const checked = additionalIdTypes.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            checked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                          }`}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleAdditional(opt.value)} />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {additionalIdTypes.includes("passport") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1"><Label>מספר דרכון</Label><Input value={rep.additionalPassportNumber || ""} onChange={(e) => updateRep("additionalPassportNumber", e.target.value)} /></div>
                    </div>
                  )}
                  {additionalIdTypes.includes("license") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1"><Label>מספר רישיון נהיגה</Label><Input value={rep.additionalLicenseNumber || ""} onChange={(e) => updateRep("additionalLicenseNumber", e.target.value)} /></div>
                    </div>
                  )}
                  {additionalIdTypes.includes("parentId") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1"><Label>מס׳ זהות של הורה</Label><Input value={rep.additionalIdNumber || ""} onChange={(e) => updateRep("additionalIdNumber", e.target.value)} /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* WITHOUT tax file: need full details of all board members */}
        {!isWarComp && info.hasTaxFile === false && (
          <div className="space-y-4 mr-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
              ℹ️ מאחר שאין תיק ברשות המיסים, נדרשים פרטים מלאים של כל חברי הועד (לפחות אחד נדרש להפקת ייצוג).
            </div>

            <div className="space-y-2">
              <Label>מספר חברי ועד</Label>
              <Input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={info.existingBoardMemberCount || ""}
                onChange={(e) => handleCountChange(parseInt(e.target.value) || 0)}
              />
            </div>

            {boardMembers.map((member, idx) => (
              <div key={idx} className="space-y-3 p-4 border border-border rounded-xl bg-card">
                <h4 className="font-bold text-primary">חבר ועד #{idx + 1}{member.name ? ` – ${member.name}` : ""}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>שם מלא *</Label><Input value={member.name || ""} onChange={(e) => updateBoardMember(idx, "name", e.target.value)} /></div>
                  <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={member.idNumber || ""} onChange={(e) => updateBoardMember(idx, "idNumber", e.target.value)} /></div>
                  <div className="space-y-1"><Label>טלפון *</Label><Input type="tel" value={member.phone || ""} onChange={(e) => updateBoardMember(idx, "phone", e.target.value)} /></div>
                  <div className="space-y-1"><Label>מייל *</Label><Input type="email" value={member.email || ""} onChange={(e) => updateBoardMember(idx, "email", e.target.value)} /></div>
                </div>
              </div>
            ))}

            {boardMembers.length > 0 && (
              <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/15">
                <Label className="text-base font-semibold">חבר הועד שיופיע בייצוג (לפחות אחד) *</Label>
                <Select
                  value={info.representativeBoardMemberIdx !== undefined ? String(info.representativeBoardMemberIdx) : ""}
                  onValueChange={(v) => setInfo({ representativeBoardMemberIdx: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר חבר ועד" />
                  </SelectTrigger>
                  <SelectContent>
                    {boardMembers.map((m, idx) => (
                      <SelectItem key={idx} value={String(idx)} disabled={!m.name}>
                        {m.name || `חבר ועד ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Plans to hire employees */}
            <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/15">
              <Label className="text-base font-semibold">האם מתוכנן העסקת עובדים?</Label>
              <YesNoSelect
                value={info.plansEmployees}
                onChange={(v) => setInfo({ plansEmployees: v })}
              />
            </div>

            {/* Bank account */}
            <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/15">
              <Label className="text-base font-semibold">האם יש לעמותה חשבון בנק?</Label>
              <YesNoSelect
                value={info.hasBankAccount}
                onChange={(v) => setInfo({ hasBankAccount: v })}
              />
            </div>

            {info.hasBankAccount === true && (
              <div className="space-y-3 p-4 bg-card rounded-xl border border-border mr-4">
                <Label className="text-base font-semibold">פרטי חשבון בנק של העמותה *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>בנק</Label><Input value={info.bankDetails?.bank || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, bank: e.target.value } })} /></div>
                  <div className="space-y-1"><Label>סניף</Label><Input value={info.bankDetails?.branch || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, branch: e.target.value } })} /></div>
                  <div className="space-y-1"><Label>מספר חשבון</Label><Input value={info.bankDetails?.accountNumber || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountNumber: e.target.value } })} /></div>
                  <div className="space-y-1"><Label>שם בעל החשבון</Label><Input value={info.bankDetails?.accountHolder || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountHolder: e.target.value } })} /></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const userHasNewNonprofit = userHasNonprofit && serviceType.userPurposeStatus?.nonprofit?.includes("new");
  const userHasExistingNonprofit = userHasNonprofit && (serviceType.userPurposeStatus?.nonprofit?.includes("existing") || userWarEntities.includes("nonprofit"));
  const spouseHasNewNonprofit = spouseHasNonprofit && serviceType.spousePurposeStatus?.nonprofit?.includes("new");
  const spouseHasExistingNonprofit = spouseHasNonprofit && (serviceType.spousePurposeStatus?.nonprofit?.includes("existing") || spouseWarEntities.includes("nonprofit"));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">
        חלק ב׳ –מידע נחוץ כדי להרוויח את השירות שלנו – פרטי העסק
      </h2>

      {/* User sections */}
      {userHasNewBusiness && renderNewBusiness(businessInfo, setBusinessInfo, userName, userLastName, userGender, detailedInfo.idNumber)}
      {userHasExistingBusiness && renderExistingBusiness(businessInfo, setBusinessInfo, userName, userGender, detailedInfo.idNumber, "", userWarEntities.includes("business"))}
      {userHasNewNonprofit && renderNewNonprofit(nonprofitInfo, setNonprofitInfo, userName)}
      {userHasExistingNonprofit && renderExistingNonprofit(nonprofitInfo, setNonprofitInfo, userName, userWarEntities.includes("nonprofit"))}
      {userHasCompany && renderCompany(
        businessInfo,
        setBusinessInfo,
        userName,
        userGender,
        detailedInfo.idNumber,
        personalInfo.phone,
        personalInfo.email,
        spouseName,
        spouseInfo.idNumber,
        spouseInfo.phone,
        spouseInfo.email,
        isMarried,
        "",
        userWarEntities.includes("company")
      )}

      {/* Spouse sections */}
      {isMarried && spouseHasNewBusiness && renderNewBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, "", spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasExistingBusiness && renderExistingBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, spouseInfo.idNumber, "sp_", spouseWarEntities.includes("business"))}
      {isMarried && spouseHasNewNonprofit && renderNewNonprofit(spouseNonprofitInfo, setSpouseNonprofitInfo, spouseName)}
      {isMarried && spouseHasExistingNonprofit && renderExistingNonprofit(spouseNonprofitInfo, setSpouseNonprofitInfo, spouseName, spouseWarEntities.includes("nonprofit"))}
      {isMarried && spouseHasCompany && renderCompany(
        spouseBusinessInfo,
        setSpouseBusinessInfo,
        spouseName,
        spouseGender,
        spouseInfo.idNumber,
        spouseInfo.phone,
        spouseInfo.email,
        userName,
        detailedInfo.idNumber,
        personalInfo.phone,
        personalInfo.email,
        true,
        "sp_",
        spouseWarEntities.includes("company")
      )}

      {/* War compensation - informational only with meeting CTA */}
      {showWarCompensation && (
        <div className="space-y-4 p-5 bg-primary/5 rounded-xl border-2 border-primary/30">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            ⚖️ פיצויי מלחמה – השגה או ערר
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            הטיפול בפיצויי מלחמה (השגה / ערר) מצריך ליווי אישי וקבלת פרטים מורחבים שלא ניתן למלא בשאלון.
            <br />
            לרוב זה מתחיל בשיחה ראשונית אצלנו במשרד, ולאחר מכן נתאם פגישה לקבלת כל הפרטים והמסמכים הנדרשים.
          </p>
          <a
            href="https://chasida.biz/schedule"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-sm"
          >
            📅 לתיאום פגישה
          </a>
        </div>
      )}
    </div>
  );
};
