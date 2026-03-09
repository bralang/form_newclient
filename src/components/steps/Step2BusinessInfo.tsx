import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { g } from "@/lib/gender-utils";
import { AlertTriangle } from "lucide-react";

export const Step2BusinessInfo = () => {
  const {
    serviceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
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
      const adjusted = Array.from({ length: count }, (_, i) =>
        partners[i] || { name: "", idNumber: "", percentage: "", phone: "", email: "", address: "", isVatRepresentative: false }
      );
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
          <div className="space-y-3">
            <Label className="text-base font-semibold">שמות השותפים – סמן נציג מול מע״מ</Label>
            {partners.map((partner: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <Checkbox
                  id={`${prefix}vatRep_${idx}`}
                  checked={partner.isVatRepresentative || false}
                  onCheckedChange={(checked) => updatePartner(idx, "isVatRepresentative", !!checked)}
                />
                <Input
                  placeholder={`שם שותף ${idx + 1}`}
                  value={partner.name || ""}
                  onChange={(e) => updatePartner(idx, "name", e.target.value)}
                  className="flex-1"
                />
                {partner.isVatRepresentative && (
                  <span className="text-xs text-primary font-medium whitespace-nowrap">נציג מע״מ</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Detailed partner groups */}
        {partners.map((partner: any, idx: number) => (
          partner.name && (
            <div key={`details-${idx}`} className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <h4 className="font-bold text-primary">
                פרטי שותף – {partner.name}
                {partner.isVatRepresentative && <span className="text-xs mr-2 text-primary/70">(נציג מע״מ)</span>}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>מס׳ תעודת זהות</Label>
                  <Input value={partner.idNumber || ""} onChange={(e) => updatePartner(idx, "idNumber", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>אחוז בשותפות</Label>
                  <Input value={partner.percentage || ""} onChange={(e) => updatePartner(idx, "percentage", e.target.value)} placeholder="לדוגמה: 50%" />
                </div>
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
              </div>

              {/* Additional ID for VAT representative */}
              {partner.isVatRepresentative && (
                <div className="space-y-3 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <Label className="font-semibold">אמצעי זיהוי נוסף (נציג מע״מ) *</Label>
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
          )
        ))}

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
    prefix = ""
  ) => {
    const shareholders = company.shareholders || [];

    const updateShareholder = (idx: number, field: string, value: any) => {
      const updated = [...shareholders];
      updated[idx] = { ...updated[idx], [field]: value };
      updateCompany("shareholders", updated);
    };

    const handleShareholderCountChange = (count: number) => {
      const adjusted = Array.from({ length: count }, (_, i) =>
        shareholders[i] || { name: "", idNumber: "", phone: "", email: "", percentage: "", additionalIdType: "", additionalIdNumber: "" }
      );
      updateCompany("shareholders", adjusted);
      updateCompany("shareholderCount", count);
    };

    return (
      <div className="space-y-4 mr-4">
        <div className="space-y-2">
          <Label>כמה בעלי מניות יש בחברה?</Label>
          <Input
            type="number"
            min="2"
            value={company.shareholderCount || ""}
            onChange={(e) => handleShareholderCountChange(parseInt(e.target.value) || 0)}
          />
        </div>

        {shareholders.map((sh: any, idx: number) => (
          <div key={idx} className="space-y-3 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary">בעל מניות #{idx + 1}{sh.name ? ` – ${sh.name}` : ""}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>שם מלא *</Label>
                <Input value={sh.name || ""} onChange={(e) => updateShareholder(idx, "name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>מס׳ תעודת זהות *</Label>
                <Input value={sh.idNumber || ""} onChange={(e) => updateShareholder(idx, "idNumber", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>צילום ת.ז.</Label>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => updateShareholder(idx, "idFile", e.target.files?.[0])} />
              </div>
              <div className="space-y-1">
                <Label>אחוזי אחזקה *</Label>
                <Input value={sh.percentage || ""} onChange={(e) => updateShareholder(idx, "percentage", e.target.value)} placeholder="לדוגמה: 50%" />
              </div>
              <div className="space-y-1">
                <Label>טלפון</Label>
                <Input type="tel" value={sh.phone || ""} onChange={(e) => updateShareholder(idx, "phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>מייל</Label>
                <Input type="email" value={sh.email || ""} onChange={(e) => updateShareholder(idx, "email", e.target.value)} />
              </div>
            </div>

            {/* Additional ID */}
            <div className="space-y-2">
              <Label>אמצעי זיהוי נוסף {idx === 0 ? "*" : "(מומלץ)"}</Label>
              <Select
                value={sh.additionalIdType || ""}
                onValueChange={(v) => updateShareholder(idx, "additionalIdType", v)}
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
              {sh.additionalIdType && (
                <>
                  <Input
                    placeholder="מספר אמצעי זיהוי"
                    value={sh.additionalIdNumber || ""}
                    onChange={(e) => updateShareholder(idx, "additionalIdNumber", e.target.value)}
                  />
                  <div className="space-y-1">
                    <Label>צילום אמצעי זיהוי</Label>
                    <Input type="file" accept="image/*,.pdf" onChange={(e) => updateShareholder(idx, "additionalIdFile", e.target.files?.[0])} />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
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

      {info.ownershipType === "partnership" && renderPartnershipSection(info, setInfo, prefix)}

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
    prefix = ""
  ) => (
    <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
      <h3 className="text-xl font-bold text-primary">
        העסק הקיים של <span className="underline decoration-primary/50">{name}</span>
      </h3>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}exBusinessNumber`}>מספר העוסק</Label>
        <Input
          id={`${prefix}exBusinessNumber`}
          value={info.businessNumber || ""}
          onChange={(e) => setInfo({ businessNumber: e.target.value })}
        />
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

      {info.ownershipType === "partnership" && renderPartnershipSection(info, setInfo, prefix)}

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
              `${prefix}existing_${idx}_`
            )}
          </div>
        ))}

        {/* New companies */}
        {(info.newCompanies || []).map((company: any, idx: number) => (
          <div key={`new-${idx}`} className="space-y-4 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary">חברה חדשה #{idx + 1}</h4>

            <div className="space-y-2">
              <Label>האם החברה קיימת ברשם החברות?</Label>
              <YesNoSelect
                value={company.existsInRegistrar}
                onChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], existsInRegistrar: v };
                  setInfo({ newCompanies: updated });
                }}
              />
            </div>

            {company.existsInRegistrar === false && (
              <div className="space-y-3">
                <Label className="font-semibold">3 שמות מבוקשים</Label>
                {[1, 2, 3].map((n) => (
                  <Input
                    key={n}
                    placeholder={`שם מבוקש ${n}`}
                    value={company[`requestedName${n}`] || ""}
                    onChange={(e) => {
                      const updated = [...(info.newCompanies || [])];
                      updated[idx] = { ...updated[idx], [`requestedName${n}`]: e.target.value };
                      setInfo({ newCompanies: updated });
                    }}
                  />
                ))}
              </div>
            )}

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
              (field: string, value: any) => {
                const updated = [...(info.newCompanies || [])];
                updated[idx] = { ...updated[idx], [field]: value };
                setInfo({ newCompanies: updated });
              },
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

  // ─── Nonprofit ───
  const renderNonprofitMessage = (name: string) => (
    <div className="p-5 bg-primary/5 rounded-xl border border-primary/15">
      <h3 className="text-xl font-bold text-primary mb-2">עמותה – {name}</h3>
      <p className="text-muted-foreground">ניצור איתך קשר למטרת קידום העסק</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">
        חלק ב׳ –מידע נחוץ כדי להרוויח את השירות שלנו – פרטי העסק
      </h2>

      {/* User sections */}
      {userHasNewBusiness && renderNewBusiness(businessInfo, setBusinessInfo, userName, userLastName, userGender, detailedInfo.idNumber)}
      {userHasExistingBusiness && renderExistingBusiness(businessInfo, setBusinessInfo, userName, userGender, detailedInfo.idNumber)}
      {userHasNonprofit && renderNonprofitMessage(userName)}
      {userHasCompany && renderCompany(businessInfo, setBusinessInfo, userName, userGender)}

      {/* Spouse sections */}
      {isMarried && spouseHasNewBusiness && renderNewBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, "", spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasExistingBusiness && renderExistingBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasNonprofit && renderNonprofitMessage(spouseName)}
      {isMarried && spouseHasCompany && renderCompany(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, "sp_")}
    </div>
  );
};
