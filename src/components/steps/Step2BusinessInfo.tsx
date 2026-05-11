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
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="relative w-full min-w-0">
    <Input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*\.?[0-9]*"
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9.]/g, "");
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

  const userHasNewBusiness = serviceType.userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("new");
  const userHasExistingBusiness = serviceType.userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("existing");
  const userHasCompany = serviceType.userPurposes.includes("company");
  const userHasNonprofit = serviceType.userPurposes.includes("nonprofit");

  const spouseHasNewBusiness = serviceType.spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("new");
  const spouseHasExistingBusiness = serviceType.spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("existing");
  const spouseHasCompany = serviceType.spousePurposes.includes("company");
  const spouseHasNonprofit = serviceType.spousePurposes.includes("nonprofit");

  const userHasWarCompensation = serviceType.userPurposes.includes("war_compensation");
  const spouseHasWarCompensation = serviceType.spousePurposes.includes("war_compensation");
  const showWarCompensation = userHasWarCompensation || spouseHasWarCompensation;

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
    prefix = ""
  ) => {
    const partners = info.partners || [];

    const updatePartner = (idx: number, field: string, value: any) => {
      const updated = [...partners];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "isVatRepresentative" && value === true) {
        updated.forEach((p, i) => {
          if (i !== idx) updated[i] = { ...updated[i], isVatRepresentative: false };
        });
      }
      setInfo({ partners: updated });
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
      setInfo({ partners: adjusted });
    };

    return (
      <div className="space-y-5 mr-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}partnerCount`}>מספר שותפים (כולל אותך)</Label>
          <Input
            id={`${prefix}partnerCount`}
            type="number"
            min="2"
            value={partners.length || ""}
            onChange={(e) => handlePartnerCountChange(parseInt(e.target.value) || 0)}
          />
        </div>

        {partners.length > 0 && (
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

        {/* Detailed partner groups */}
        {partners.map((partner: any, idx: number) => {
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
                   <PercentageInput
                     value={partner.percentage || ""}
                     onChange={(value) => updatePartner(idx, "percentage", value)}
                   />
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

        {/* Partnership agreement upload */}
        {partners.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}partnershipAgreement`}>צרף הסכם שותפות</Label>
            <Input
              id={`${prefix}partnershipAgreement`}
              type="file"
              onChange={(e) => setInfo({ partnershipAgreementFile: e.target.files?.[0] })}
            />
          </div>
        )}
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
    prefix = ""
  ) => {
    const shareholders = company.shareholders || [];
    const spouseIsShareholder = !!company.spouseIsShareholder;

    const updateShareholder = (idx: number, field: string, value: any) => {
      const updated = [...shareholders];
      updated[idx] = { ...updated[idx], [field]: value };
      updateCompany("shareholders", updated);
    };

    // Build the list with auto-filled self (#1) and optional spouse (#2)
    const buildShareholders = (totalCount: number, spouseFlag: boolean) => {
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
      updateCompanyMulti({ shareholders: adjusted, shareholderCount: count });
    };

    const toggleSpouseHolder = (checked: boolean) => {
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

    return (
      <div className="space-y-4 mr-4">
        <div className="space-y-2">
          <Label>כמה בעלי מניות יש בחברה? (כולל אותך)</Label>
          <Input
            type="number"
            min="1"
            value={company.shareholderCount || ""}
            onChange={(e) => handleShareholderCountChange(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            בעל מניות #1 הוא ממלא השאלון – הפרטים מולאו אוטומטית.
          </p>
        </div>

        {showSpouseOption && (
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
          const isAuto = sh?.isSelf || sh?.isSpouse;
          const displayName = sh?.isSelf
            ? selfName
            : sh?.isSpouse
            ? spouseDisplayName
            : sh.name || `בעל מניות ${idx + 1}`;
          return (
            <div key={idx} className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <h4 className="font-bold text-primary">
                בעל מניות #{idx + 1} – {displayName}
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
                <div className="space-y-1 max-w-xs">
                  <Label>אחוזי אחזקה *</Label>
                  <PercentageInput
                    value={sh.percentage || ""}
                    onChange={(value) => updateShareholder(idx, "percentage", value)}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>סוג בעל המניות</Label>
                    <Select
                      value={sh.holderType || "person"}
                      onValueChange={(v) => updateShareholder(idx, "holderType", v)}
                    >
                      <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">אדם פרטי</SelectItem>
                        <SelectItem value="company">חברה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(sh.holderType || "person") === "person" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>שם מלא *</Label><Input value={sh.name || ""} onChange={(e) => updateShareholder(idx, "name", e.target.value)} /></div>
                        <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={sh.idNumber || ""} onChange={(e) => updateShareholder(idx, "idNumber", e.target.value)} /></div>
                        <div className="space-y-1"><Label>צילום ת.ז.</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateShareholder(idx, "idFile", e.target.files?.[0])} /></div>
                        <div className="space-y-1">
                          <Label>אחוזי אחזקה *</Label>
                          <PercentageInput
                            value={sh.percentage || ""}
                            onChange={(value) => updateShareholder(idx, "percentage", value)}
                          />
                        </div>
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
                          <>
                            <Input placeholder="מספר אמצעי זיהוי" value={sh.additionalIdNumber || ""} onChange={(e) => updateShareholder(idx, "additionalIdNumber", e.target.value)} />
                            <div className="space-y-1"><Label>צילום אמצעי זיהוי</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateShareholder(idx, "additionalIdFile", e.target.files?.[0])} /></div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>שם החברה המחזיקה *</Label><Input value={sh.companyName || ""} onChange={(e) => updateShareholder(idx, "companyName", e.target.value)} /></div>
                        <div className="space-y-1"><Label>ח.פ. *</Label><Input value={sh.companyNumber || ""} onChange={(e) => updateShareholder(idx, "companyNumber", e.target.value)} /></div>
                        <div className="space-y-1">
                          <Label>אחוזי אחזקה בחברה החדשה *</Label>
                          <PercentageInput
                            value={sh.percentage || ""}
                            onChange={(value) => updateShareholder(idx, "percentage", value)}
                          />
                        </div>
                      </div>

                      {/* Holding chain - company holds company holds company... */}
                      <div className="space-y-2 p-3 bg-card rounded-lg border border-border/50">
                        <Label className="text-sm font-semibold">שרשרת חברות מחזיקות (אם קיימת)</Label>
                        <p className="text-xs text-muted-foreground">
                          אם החברה המחזיקה מוחזקת בעצמה ע"י חברה נוספת – יש להוסיף כל חוליה בשרשרת עד לבעל המניות הסופי (אדם פרטי).
                        </p>
                        {(sh.holdingChain || []).map((link: any, lIdx: number) => {
                          const pct = parseFloat(link.percentage);
                          const linkValid = !isNaN(pct) && pct > 0 && pct <= 100;
                          const heldName = lIdx === 0 ? (sh.companyName || "החברה המחזיקה") : ((sh.holdingChain[lIdx - 1]?.companyName) || "החברה הקודמת");
                          return (
                          <div key={lIdx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end p-2 rounded-md bg-muted/40 border border-border/40">
                            <div className="space-y-1 sm:col-span-2 lg:col-span-3"><Label className="text-xs">בעל מניות בחברת {lIdx === 0 ? (sh.companyName || "המחזיקה") : ((sh.holdingChain[lIdx - 1]?.companyName) || "הקודמת")}</Label><Input placeholder="שם החברה" value={link.companyName || ""} onChange={(e) => {
                              const chain = [...(sh.holdingChain || [])];
                              chain[lIdx] = { ...chain[lIdx], companyName: e.target.value };
                              updateShareholder(idx, "holdingChain", chain);
                            }} /></div>
                            <div className="space-y-1"><Label className="text-xs">ח.פ.</Label><Input value={link.companyNumber || ""} onChange={(e) => {
                              const chain = [...(sh.holdingChain || [])];
                              chain[lIdx] = { ...chain[lIdx], companyNumber: e.target.value };
                              updateShareholder(idx, "holdingChain", chain);
                            }} /></div>
                            <div className="space-y-1 lg:col-span-2"><Label className="text-xs">שיעור אחזקה</Label>
                              <div className="flex gap-1 items-center">
                                <div className="flex-1 min-w-0">
                                  <PercentageInput
                                    value={link.percentage || ""}
                                    onChange={(value) => {
                                      const chain = [...(sh.holdingChain || [])];
                                      chain[lIdx] = { ...chain[lIdx], percentage: value };
                                      updateShareholder(idx, "holdingChain", chain);
                                    }}
                                  />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={() => {
                                  const chain = [...(sh.holdingChain || [])];
                                  chain.splice(lIdx, 1);
                                  updateShareholder(idx, "holdingChain", chain);
                                }}>✕</Button>
                              </div>
                            </div>
                            {link.percentage && !linkValid && (
                              <div className="sm:col-span-2 lg:col-span-6 text-xs text-destructive">שיעור האחזקה חייב להיות בין 0 ל-100</div>
                            )}
                            {link.companyName && (
                              <div className="sm:col-span-2 lg:col-span-6 text-xs text-muted-foreground">
                                {link.companyName} מחזיקה {link.percentage || "—"}% מ{heldName}
                              </div>
                            )}
                          </div>
                          );
                        })}
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          const chain = [...(sh.holdingChain || []), { companyName: "", companyNumber: "", percentage: "" }];
                          updateShareholder(idx, "holdingChain", chain);
                        }}>+ הוסף חברה נוספת בשרשרת</Button>
                      </div>

                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm text-muted-foreground mb-3">יש לציין את בעל המניות הסופי (אדם פרטי) של {((sh.holdingChain || []).length > 0 ? (sh.holdingChain[sh.holdingChain.length - 1]?.companyName || "החברה האחרונה בשרשרת") : (sh.companyName || "החברה המחזיקה"))}, לצורך זיהוי במס הכנסה</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>שם בעל המניות הסופי (אדם פרטי) *</Label><Input value={sh.ultimateOwnerName || ""} onChange={(e) => updateShareholder(idx, "ultimateOwnerName", e.target.value)} /></div>
                          <div className="space-y-1"><Label>שיעור אחזקה</Label>
                            <PercentageInput
                              value={sh.ultimateOwnerPercentage || ""}
                              onChange={(v) => updateShareholder(idx, "ultimateOwnerPercentage", v)}
                            />
                          </div>
                          <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={sh.ultimateOwnerIdNumber || ""} onChange={(e) => updateShareholder(idx, "ultimateOwnerIdNumber", e.target.value)} /></div>
                          <div className="space-y-1"><Label>צילום ת.ז.</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateShareholder(idx, "ultimateOwnerIdFile", e.target.files?.[0])} /></div>
                          <div className="space-y-1"><Label>טלפון</Label><Input type="tel" value={sh.ultimateOwnerPhone || ""} onChange={(e) => updateShareholder(idx, "ultimateOwnerPhone", e.target.value)} /></div>
                          <div className="space-y-1"><Label>מייל</Label><Input type="email" value={sh.ultimateOwnerEmail || ""} onChange={(e) => updateShareholder(idx, "ultimateOwnerEmail", e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* 100% total validation */}
        {shareholders.length > 0 && (() => {
          const total = shareholders.reduce((s: number, sh: any) => s + (parseFloat(sh.percentage) || 0), 0);
          const ok = Math.abs(total - 100) < 0.01;
          return (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
              ok ? "bg-primary/5 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}>
              {!ok && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p className="text-sm font-semibold">
                סה"כ שיעורי האחזקה בחברה: {total}% {ok ? "✓" : "(נדרש להגיע ל-100%)"}
              </p>
            </div>
          );
        })()}
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

      {/* Bank details for authorized - MANDATORY */}
      {info.businessType === "authorized" && (
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

      {/* For partnerships – ask which partner's home */}
      {info.isHomeOffice === true && info.ownershipType === "partnership" && (info.partners || []).length > 0 && (
        <div className="space-y-2 mr-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <Label className="text-base font-bold">מהבית של איזה שותף?</Label>
          <Select
            value={info.homeOfficePartnerIdx !== undefined ? String(info.homeOfficePartnerIdx) : ""}
            onValueChange={(v) => setInfo({ homeOfficePartnerIdx: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר שותף" />
            </SelectTrigger>
            <SelectContent>
              {(info.partners || []).map((partner: any, idx: number) => {
                const displayName = idx === 0 ? name : partner.name || `שותף ${idx + 1}`;
                return (
                  <SelectItem key={idx} value={String(idx)}>{displayName}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

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
    prefix = ""
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

      {info.ownershipType === "partnership" && renderPartnershipSection(info, setInfo, name, idNumber, prefix)}

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
    _gender: "male" | "female" | "",
    selfIdNumber: string,
    selfPhone: string,
    selfEmail: string,
    spouseDisplayName: string,
    spouseIdNumber: string,
    spousePhone: string,
    spouseEmail: string,
    showSpouseOption: boolean,
    prefix = ""
  ) => {
    const hasExistingPurpose = serviceType.userPurposeStatus?.company?.includes("existing") || serviceType.spousePurposeStatus?.company?.includes("existing");
    const hasNewPurpose = serviceType.userPurposeStatus?.company?.includes("new") || serviceType.spousePurposeStatus?.company?.includes("new");

    const existingCount = info.existingCompanyCount || 0;
    const newCount = info.newCompanyCount || 0;

    const updateExistingCompany = (idx: number, field: string, value: any) => {
      const updated = [...(info.existingCompanies || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      setInfo({ existingCompanies: updated });
    };

    return (
      <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
        <h3 className="text-xl font-bold text-primary">
          חברות של <span className="underline decoration-primary/50">{name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasExistingPurpose && (
            <div className="space-y-2">
              <Label htmlFor={`${prefix}existingCount`}>לכמה חברות קיימות מעוניין לקבל שירות?</Label>
              <Input
                id={`${prefix}existingCount`}
                type="number"
                min="0"
                value={existingCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 0;
                  const companies = info.existingCompanies || [];
                  const adjusted = Array.from({ length: count }, (_, i) => companies[i] || { name: "", companyNumber: "" });
                  setInfo({ existingCompanyCount: count, existingCompanies: adjusted });
                }}
              />
            </div>
          )}
          {hasNewPurpose && (
            <div className="space-y-2">
              <Label htmlFor={`${prefix}newCount`}>כמה חברות חדשות רוצה לפתוח?</Label>
              <Input
                id={`${prefix}newCount`}
                type="number"
                min="0"
                value={newCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 0;
                  const companies = info.newCompanies || [];
                  const adjusted = Array.from({ length: count }, (_, i) => companies[i] || {});
                  setInfo({ newCompanyCount: count, newCompanies: adjusted });
                }}
              />
            </div>
          )}
        </div>

        {/* Existing companies */}
        {(info.existingCompanies || []).map((company: any, idx: number) => (
          <div key={`existing-${idx}`} className="space-y-4 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary">חברה קיימת #{idx + 1}</h4>
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

            {/* Tax file question */}
            <div className="space-y-2">
              <Label>האם יש לחברה תיק ברשות המיסים?</Label>
              <YesNoSelect
                value={company.hasTaxFile}
                onChange={(v) => updateExistingCompany(idx, "hasTaxFile", v)}
              />
            </div>

            {company.hasTaxFile === false && (
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
                    <div className="space-y-1">
                      <Label>אישור ניהול חשבון או צילום שיק</Label>
                      <Input type="file" accept="image/*,.pdf" onChange={(e) => updateExistingCompany(idx, "bankConfirmationFile", e.target.files?.[0])} />
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

            {/* Shareholders - always shown for existing companies */}
            <div className="space-y-2">
              <Label>מי בעלי המניות בחברה?</Label>
              <Select
                value={company.shareholderType || ""}
                onValueChange={(v) => updateExistingCompany(idx, "shareholderType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alone">אני לבד</SelectItem>
                  <SelectItem value="other">ביחד עם אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {company.shareholderType === "other" && renderShareholdersSection(
              company,
              (field: string, value: any) => updateExistingCompany(idx, field, value),
              (updates: Record<string, any>) => {
                const updated = [...(info.existingCompanies || [])];
                updated[idx] = { ...updated[idx], ...updates };
                setInfo({ existingCompanies: updated });
              },
              name,
              selfIdNumber,
              selfPhone,
              selfEmail,
              spouseDisplayName,
              spouseIdNumber,
              spousePhone,
              spouseEmail,
              showSpouseOption,
              `${prefix}existing_${idx}_`
            )}
          </div>
        ))}

        {/* New companies */}
        {(info.newCompanies || []).map((company: any, idx: number) => (
          <div key={`new-${idx}`} className="space-y-4 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary">חברה חדשה #{idx + 1}</h4>

            {/* 3 requested names */}
            <div className="space-y-3">
              <Label className="font-semibold">3 שמות רצויים לחברה (לפי סדר עדיפות)</Label>
              {[1, 2, 3].map((n) => (
                <Input
                  key={n}
                  placeholder={`שם רצוי ${n}`}
                  value={company[`requestedName${n}`] || ""}
                  onChange={(e) => {
                    const updated = [...(info.newCompanies || [])];
                    updated[idx] = { ...updated[idx], [`requestedName${n}`]: e.target.value };
                    setInfo({ newCompanies: updated });
                  }}
                />
              ))}
            </div>

            {/* Shareholders */}
            <div className="space-y-2">
              <Label>מי יהיו בעלי המניות בחברה?</Label>
              <Select
                value={company.shareholderType || ""}
                onValueChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], shareholderType: v };
                  setInfo({ newCompanies: updated });
                }}
              >
                <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alone">אני לבד</SelectItem>
                  <SelectItem value="other">ביחד עם אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {company.shareholderType === "other" && renderShareholdersSection(
              company,
              (field: string, value: any) => {
                const updated = [...(info.newCompanies || [])];
                updated[idx] = { ...updated[idx], [field]: value };
                setInfo({ newCompanies: updated });
              },
              (updates: Record<string, any>) => {
                const updated = [...(info.newCompanies || [])];
                updated[idx] = { ...updated[idx], ...updates };
                setInfo({ newCompanies: updated });
              },
              name,
              selfIdNumber,
              selfPhone,
              selfEmail,
              spouseDisplayName,
              spouseIdNumber,
              spousePhone,
              spouseEmail,
              showSpouseOption,
              `${prefix}new_${idx}_`
            )}

            <div className="space-y-2">
              <Label>האם החברה צפויה להעסיק עובדים?</Label>
              <YesNoSelect
                value={company.planningEmployees}
                onChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], planningEmployees: v };
                  setInfo({ newCompanies: updated });
                }}
              />
            </div>
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
            type="number"
            min="7"
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
                <div className="space-y-1"><Label>צילום ת.ז. כולל ספח</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateBoardMember(idx, "idFile", e.target.files?.[0])} /></div>
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

        {/* Tax file question - drives the entire flow */}
        <div className="space-y-2">
          <Label>האם לעמותה קיים תיק ברשות המיסים?</Label>
          <YesNoSelect
            value={info.hasTaxFile}
            onChange={(v) => setInfo({ hasTaxFile: v })}
          />
        </div>

        {/* WITH tax file: only need full details of one representative board member */}
        {info.hasTaxFile === true && (() => {
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
                <h4 className="font-bold text-primary">חבר הועד שיופיע בייצוג{rep.name ? ` – ${rep.name}` : ""}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>שם מלא *</Label><Input value={rep.name || ""} onChange={(e) => updateRep("name", e.target.value)} /></div>
                  <div className="space-y-1"><Label>מס׳ תעודת זהות *</Label><Input value={rep.idNumber || ""} onChange={(e) => updateRep("idNumber", e.target.value)} /></div>
                  <div className="space-y-1"><Label>צילום ת.ז. כולל ספח</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateRep("idFile", e.target.files?.[0])} /></div>
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
                      <div className="space-y-1"><Label>צילום דרכון</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateRep("additionalPassportFile", e.target.files?.[0])} /></div>
                    </div>
                  )}
                  {additionalIdTypes.includes("license") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1"><Label>מספר רישיון נהיגה</Label><Input value={rep.additionalLicenseNumber || ""} onChange={(e) => updateRep("additionalLicenseNumber", e.target.value)} /></div>
                      <div className="space-y-1"><Label>צילום רישיון נהיגה</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateRep("additionalLicenseFile", e.target.files?.[0])} /></div>
                    </div>
                  )}
                  {additionalIdTypes.includes("parentId") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1"><Label>מס׳ זהות של הורה</Label><Input value={rep.additionalIdNumber || ""} onChange={(e) => updateRep("additionalIdNumber", e.target.value)} /></div>
                      <div className="space-y-1"><Label>צילום ת.ז. הורה</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateRep("additionalIdFile", e.target.files?.[0])} /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* WITHOUT tax file: need full details of all board members */}
        {info.hasTaxFile === false && (
          <div className="space-y-4 mr-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
              ℹ️ מאחר שאין תיק ברשות המיסים, נדרשים פרטים מלאים של כל חברי הועד (לפחות אחד נדרש להפקת ייצוג).
            </div>

            <div className="space-y-2">
              <Label>מספר חברי ועד</Label>
              <Input
                type="number"
                min="1"
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
                  <div className="space-y-1"><Label>צילום ת.ז. *</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => updateBoardMember(idx, "idFile", e.target.files?.[0])} /></div>
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
          </div>
        )}
      </div>
    );
  };

  const userHasNewNonprofit = userHasNonprofit && serviceType.userPurposeStatus?.nonprofit?.includes("new");
  const userHasExistingNonprofit = userHasNonprofit && serviceType.userPurposeStatus?.nonprofit?.includes("existing");
  const spouseHasNewNonprofit = spouseHasNonprofit && serviceType.spousePurposeStatus?.nonprofit?.includes("new");
  const spouseHasExistingNonprofit = spouseHasNonprofit && serviceType.spousePurposeStatus?.nonprofit?.includes("existing");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">
        חלק ב׳ –מידע נחוץ כדי להרוויח את השירות שלנו – פרטי העסק
      </h2>

      {/* User sections */}
      {userHasNewBusiness && renderNewBusiness(businessInfo, setBusinessInfo, userName, userLastName, userGender, detailedInfo.idNumber)}
      {userHasExistingBusiness && renderExistingBusiness(businessInfo, setBusinessInfo, userName, userGender, detailedInfo.idNumber)}
      {userHasNewNonprofit && renderNewNonprofit(nonprofitInfo, setNonprofitInfo, userName)}
      {userHasExistingNonprofit && renderExistingNonprofit(nonprofitInfo, setNonprofitInfo, userName)}
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
        isMarried
      )}

      {/* Spouse sections */}
      {isMarried && spouseHasNewBusiness && renderNewBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, "", spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasExistingBusiness && renderExistingBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasNewNonprofit && renderNewNonprofit(spouseNonprofitInfo, setSpouseNonprofitInfo, spouseName)}
      {isMarried && spouseHasExistingNonprofit && renderExistingNonprofit(spouseNonprofitInfo, setSpouseNonprofitInfo, spouseName)}
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
        "sp_"
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
