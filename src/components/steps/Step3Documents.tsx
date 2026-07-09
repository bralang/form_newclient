import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";
import { Mail, Phone } from "lucide-react";

export const Step3Documents = () => {
  const {
    personalInfo,
    detailedInfo,
    spouseInfo,
    serviceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
    nonprofitInfo,
    setNonprofitInfo,
    spouseNonprofitInfo,
    setSpouseNonprofitInfo,
    documentsInfo,
    setDocumentsInfo,
    setCurrentStep,
    sendToWebhook,
    saveFormData,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"upload" | "email" | "phone">("upload");
  const [emailListMode, setEmailListMode] = useState<"" | "now" | "later">("");
  const [emailReminderDate, setEmailReminderDate] = useState("");
  const [contactPhone, setContactPhone] = useState(personalInfo.phone || "");
  const [contactDay, setContactDay] = useState("");
  const [contactTimeRange, setContactTimeRange] = useState("");

  const handleSendEmailList = async (scheduledDate?: string) => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-document-list",
      { email: personalInfo.email, reminderTime: scheduledDate || undefined, personalInfo, serviceType },
      { silent: false }
    );
  };

  const handleSendPhoneContact = async () => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-reminder",
      { phone: contactPhone, preferredDay: contactDay, preferredTime: contactTimeRange, personalInfo, serviceType },
      { silent: false }
    );
  };

  const isMarried = personalInfo.maritalStatus === "married";
  const userPurposes = serviceType.userPurposes;
  const spousePurposes = serviceType.spousePurposes;

  const userHasNewBusiness = userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("new");
  const spouseHasNewBusiness = spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("new");

  const userHasAuthorized = userHasNewBusiness && businessInfo.businessType === "authorized";
  const spouseHasAuthorized = spouseHasNewBusiness && spouseBusinessInfo.businessType === "authorized";

  const userNeedsLease = userHasNewBusiness && businessInfo.isHomeOffice === false;
  const spouseNeedsLease = spouseHasNewBusiness && spouseBusinessInfo.isHomeOffice === false;

  const userHasCompany = userPurposes.includes("company");
  const spouseHasCompany = spousePurposes.includes("company");

  const hasExistingCompanies = (businessInfo.existingCompanyCount || 0) > 0 || (spouseBusinessInfo.existingCompanyCount || 0) > 0;
  const hasNewCompaniesInRegistrar = businessInfo.newCompanies?.some((c) => c.existsInRegistrar) || spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar);
  const hasNewCompaniesNotInRegistrarButInRegistrar = businessInfo.newCompanies?.some((c) => c.existsInRegistrar === true) || spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar === true);

  const userHasExistingBusiness = userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("existing");
  const spouseHasExistingBusiness = spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("existing");

  const userNewPartnership = userHasNewBusiness && businessInfo.ownershipType === "partnership" && (businessInfo.partners?.length || 0) > 0;
  const userExistingPartnership = userHasExistingBusiness && businessInfo.ownershipType === "partnership" && (businessInfo.existingPartners?.length || 0) > 0;
  const spouseNewPartnership = spouseHasNewBusiness && spouseBusinessInfo.ownershipType === "partnership" && (spouseBusinessInfo.partners?.length || 0) > 0;
  const spouseExistingPartnership = spouseHasExistingBusiness && spouseBusinessInfo.ownershipType === "partnership" && (spouseBusinessInfo.existingPartners?.length || 0) > 0;

  const handleNext = async () => {
    setLoading(true);
    await Promise.all([
      sendToWebhook(
        "https://n8n.chasida.biz/webhook/client-intake-step3",
        { documentsInfo, personalInfo },
        { silent: true }
      ),
      saveFormData(),
    ]);
    setLoading(false);
    setCurrentStep(5);
  };

  const FileUpload = ({ id, label, multiple = false, onChange }: { id: string; label: string; multiple?: boolean; onChange: (files: FileList | null) => void }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">עדכון מסמכים</h2>
        <div className="h-1 w-20 bg-primary rounded-full" />
      </div>

      {/* ─── Document Prep Box ─── */}
      <div className="p-5 bg-primary/5 rounded-xl border border-primary/15 space-y-4">
        <h3 className="font-bold text-lg text-foreground">📋 כיצד תרצו להגיש את המסמכים?</h3>

        {/* 3 mutually-exclusive mode buttons */}
        <div className="flex flex-col gap-2">
          {/* Option 1 — Upload directly (default selected) */}
          <button
            type="button"
            onClick={() => setSubmissionMode("upload")}
            className={`w-full text-right flex items-center gap-3 p-3 rounded-lg border transition-colors ${submissionMode === "upload" ? "border-primary/50 bg-primary/10" : "border-border/50 bg-background/60 hover:bg-muted/40"}`}
          >
            <span className="text-primary shrink-0">📁</span>
            <span className="text-sm font-medium">העלאה ישירה כאן</span>
          </button>

          {/* Option 2 — Email list */}
          <button
            type="button"
            onClick={() => { setSubmissionMode("email"); setEmailListMode("now"); }}
            className={`w-full text-right flex items-center gap-3 p-3 rounded-lg border transition-colors ${submissionMode === "email" ? "border-primary/50 bg-primary/10" : "border-border/50 bg-background/60 hover:bg-muted/40"}`}
          >
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">אני רוצה לקבל רשימת מסמכים למייל</span>
          </button>
          {submissionMode === "email" && (
            <div className="mr-7 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={emailListMode === "now" ? "default" : "outline"}
                  onClick={() => setEmailListMode("now")}
                >כעת</Button>
                <Button
                  size="sm"
                  variant={emailListMode === "later" ? "default" : "outline"}
                  onClick={() => setEmailListMode("later")}
                >במועד אחר</Button>
              </div>
              {emailListMode === "later" && (
                <div className="space-y-1">
                  <Label className="text-xs">בחרו מועד</Label>
                  <Input
                    type="date"
                    value={emailReminderDate}
                    onChange={(e) => setEmailReminderDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              )}
              <Button
                size="sm"
                onClick={() => handleSendEmailList(emailListMode === "later" ? emailReminderDate : undefined)}
                disabled={emailListMode === "later" && !emailReminderDate}
              >
                <Mail className="ml-2 h-4 w-4" />
                שלחו אל {personalInfo.email || "המייל שלי"}
              </Button>
            </div>
          )}

          {/* Option 3 — Phone contact */}
          <button
            type="button"
            onClick={() => setSubmissionMode("phone")}
            className={`w-full text-right flex items-center gap-3 p-3 rounded-lg border transition-colors ${submissionMode === "phone" ? "border-primary/50 bg-primary/10" : "border-border/50 bg-background/60 hover:bg-muted/40"}`}
          >
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">אני רוצה שיצרו איתי קשר טלפוני לסיוע בהעלאת המסמכים</span>
          </button>
          {submissionMode === "phone" && (
            <div className="mr-7 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">מספר טלפון ליצירת קשר</Label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">יום מועדף</Label>
                <div className="flex flex-wrap gap-1.5">
                  {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "גמיש"].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setContactDay(contactDay === day ? "" : day)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${contactDay === day ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">טווח שעות מועדף</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "בוקר", label: "בוקר (10–12)" },
                    { value: "צהריים א", label: "צהריים (12–14)" },
                    { value: "צהריים ב", label: "אחה״צ (14–16)" },
                    { value: "גמיש", label: "גמיש" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setContactTimeRange(contactTimeRange === opt.value ? "" : opt.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${contactTimeRange === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button size="sm" onClick={handleSendPhoneContact} disabled={!contactPhone}>
                <Phone className="ml-2 h-4 w-4" />
                שלח
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Marketing Text */}
      <div className="p-5 bg-gradient-to-r from-primary/5 to-secondary/20 rounded-xl border border-primary/10 space-y-3">
        <h3 className="text-xl font-bold text-foreground">מסכימים להרוויח יותר מהעסק שלכם?</h3>
        <p className="text-muted-foreground">מסמיכים אותנו להיות המייצגים מול הרשויות?</p>
        <p className="text-sm text-muted-foreground">המסמכים שתעלו בשלב זה יתנו לנו את הרשות להוציא טופסי ייצוג לחתימה.</p>
        <p className="text-lg font-bold text-primary">מתקדמים…</p>
      </div>

      {/* Document Uploads — only shown when "upload" mode is selected */}
      {submissionMode === "upload" && <div className="space-y-6">

        {/* User ID Documents */}
        <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
          <h3 className="font-bold text-lg text-foreground">
            מסמכי זיהוי – <span className="text-primary">{personalInfo.firstName || "שלי"}</span>
          </h3>

          <FileUpload
            id="idCardFiles"
            label="צילום ת.ז. + ספח * (ניתן להעלות מספר קבצים)"
            multiple
            onChange={(files) => setDocumentsInfo({ idCardFiles: files ? Array.from(files) : undefined })}
          />

          {detailedInfo.additionalIdTypes?.includes("license") && (
            <FileUpload
              id="licenseFile"
              label="העלאת רישיון נהיגה"
              onChange={(files) => setDocumentsInfo({ licenseFile: files?.[0] })}
            />
          )}
          {detailedInfo.additionalIdTypes?.includes("passport") && (
            <FileUpload
              id="passportFile"
              label="העלאת דרכון"
              onChange={(files) => setDocumentsInfo({ passportFile: files?.[0] })}
            />
          )}
        </div>

        {/* Spouse ID Documents */}
        {isMarried && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg text-foreground">
              מסמכי זיהוי – <span className="text-primary">{personalInfo.spouseName || "בן/בת הזוג"}</span>
            </h3>

            <FileUpload
              id="spouseIdCardFiles"
              label="צילום ת.ז. + ספח * (ניתן להעלות מספר קבצים)"
              multiple
              onChange={(files) => setDocumentsInfo({ spouseIdCardFiles: files ? Array.from(files) : undefined })}
            />

            {spouseInfo.additionalIdTypes?.includes("license") && (
              <FileUpload
                id="spouseLicenseFile"
                label="העלאת רישיון נהיגה"
                onChange={(files) => setDocumentsInfo({ spouseLicenseFile: files?.[0] })}
              />
            )}
            {spouseInfo.additionalIdTypes?.includes("passport") && (
              <FileUpload
                id="spousePassportFile"
                label="העלאת דרכון"
                onChange={(files) => setDocumentsInfo({ spousePassportFile: files?.[0] })}
              />
            )}
          </div>
        )}

        {/* Bank confirmation for authorized */}
        {userHasAuthorized && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">אישור ניהול חשבון – {personalInfo.firstName}</h3>
            <FileUpload
              id="bankConfFile"
              label="אישור ניהול חשבון או צילום שיק"
              onChange={(files) => setDocumentsInfo({ bankConfirmationFile: files?.[0] || undefined })}
            />
          </div>
        )}
        {spouseHasAuthorized && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">אישור ניהול חשבון – {personalInfo.spouseName}</h3>
            <FileUpload
              id="spouseBankConfFile"
              label="אישור ניהול חשבון או צילום שיק"
              onChange={(files) => setDocumentsInfo({ spouseBankConfirmationFile: files?.[0] || undefined })}
            />
          </div>
        )}

        {/* Lease agreement */}
        {userNeedsLease && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">הסכם שכירות לעסק – {personalInfo.firstName}</h3>
            <FileUpload
              id="leaseFile"
              label="העלאת הסכם שכירות"
              onChange={(files) => setDocumentsInfo({ leaseAgreementFile: files?.[0] || undefined })}
            />
          </div>
        )}
        {spouseNeedsLease && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">הסכם שכירות לעסק – {personalInfo.spouseName}</h3>
            <FileUpload
              id="spouseLeaseFile"
              label="העלאת הסכם שכירות"
              onChange={(files) => setDocumentsInfo({ spouseLeaseAgreementFile: files?.[0] || undefined })}
            />
          </div>
        )}

        {/* Partnership agreement uploads */}
        {(userNewPartnership || userExistingPartnership) && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">מומלץ לצרף הסכם שותפות – {personalInfo.firstName}</h3>
            {userNewPartnership && (
              <FileUpload
                id="partnershipAgreementNew"
                label={userExistingPartnership ? "הסכם שותפות – עסק חדש" : "הסכם שותפות"}
                onChange={(files) => setBusinessInfo({ partnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
            {userExistingPartnership && (
              <FileUpload
                id="partnershipAgreementExisting"
                label={userNewPartnership ? "הסכם שותפות – עסק קיים" : "הסכם שותפות"}
                onChange={(files) => setBusinessInfo({ existingPartnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
          </div>
        )}
        {(spouseNewPartnership || spouseExistingPartnership) && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">מומלץ לצרף הסכם שותפות – {personalInfo.spouseName}</h3>
            {spouseNewPartnership && (
              <FileUpload
                id="spousePartnershipAgreementNew"
                label={spouseExistingPartnership ? "הסכם שותפות – עסק חדש" : "הסכם שותפות"}
                onChange={(files) => setSpouseBusinessInfo({ partnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
            {spouseExistingPartnership && (
              <FileUpload
                id="spousePartnershipAgreementExisting"
                label={spouseNewPartnership ? "הסכם שותפות – עסק קיים" : "הסכם שותפות"}
                onChange={(files) => setSpouseBusinessInfo({ existingPartnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
          </div>
        )}


        {/* Company documents */}
        {(["user", "spouse"] as const).map((who) => {
          const bi = who === "user" ? businessInfo : spouseBusinessInfo;
          const setBi = who === "user" ? setBusinessInfo : setSpouseBusinessInfo;
          if (bi.existingCompanyFillMode !== "self") return null;
          const companies = (bi.existingCompanies || []) as any[];
          if (companies.length === 0) return null;
          return companies.map((company: any, idx: number) => (
            <div key={`${who}-exco-${idx}`} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg">
                מסמכי {company.name || `חברה קיימת #${idx + 1}`}
              </h3>
              <FileUpload
                id={`incorp-${who}-${idx}`}
                label="נסח רשם החברות"
                multiple
                onChange={(files) => {
                  const updated = [...companies];
                  updated[idx] = { ...updated[idx], incorporationFiles: files ? Array.from(files) : undefined };
                  setBi({ existingCompanies: updated });
                }}
              />
              {(company.hasBankAccount === true || company.bankDetails?.accountNumber) && (
                <FileUpload
                  id={`bank-${who}-${idx}`}
                  label="אישור ניהול חשבון או צילום שיק"
                  onChange={(files) => {
                    const updated = [...companies];
                    updated[idx] = { ...updated[idx], companyBankConfirmationFile: files?.[0] || undefined };
                    setBi({ existingCompanies: updated });
                  }}
                />
              )}
            </div>
          ));
        })}

        {/* Company shareholders ID uploads (person shareholders + nested personOwners) */}
        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? businessInfo : spouseBusinessInfo;
          const setInfo = who === "user" ? setBusinessInfo : setSpouseBusinessInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("company")) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;

          type Row = { label: string; file?: File; update: (f?: File) => void };
          const rows: Row[] = [];

          const walkPersonOwner = (po: any, path: (po: any) => void, context: string) => {
            if (!po || !po.name) return;
            rows.push({
              label: `צילום ת.ז. + ספח של ${po.name}${context ? ` (${context})` : ""}`,
              file: po.idFile,
              update: (f) => path({ ...po, idFile: f }),
            });
            if (po.additionalIdType) {
              const t = po.additionalIdType === "license" ? "רישיון נהיגה" : po.additionalIdType === "passport" ? "דרכון" : "ת.ז. הורה";
              rows.push({
                label: `צילום ${t} של ${po.name}${context ? ` (${context})` : ""}`,
                file: po.additionalIdFile,
                update: (f) => path({ ...po, additionalIdFile: f }),
              });
            }
          };

          const walkChild = (childCompany: any, setChild: (c: any) => void, context: string) => {
            if (!childCompany) return;
            const ctx = childCompany.companyName || childCompany.requestedName1 || context;
            walkPersonOwner(childCompany.personOwner, (po) => setChild({ ...childCompany, personOwner: po }), ctx);
            if (childCompany.childCompany) {
              walkChild(childCompany.childCompany, (c) => setChild({ ...childCompany, childCompany: c }), ctx);
            }
          };

          const walkShareholder = (companyList: any[], setList: (l: any[]) => void, companyKey: "existingCompanies" | "newCompanies") => {
            companyList?.forEach((company: any, cIdx: number) => {
              const compName = company.name || company.requestedName1 || `חברה #${cIdx + 1}`;
              (company.shareholders || []).forEach((sh: any, sIdx: number) => {
                // Skip self/spouse — their IDs are already collected in the main identity sections
                if (sh.isSelf || sh.isSpouse) return;
                if ((sh.holderType || "person") === "person" && sh.name) {
                  rows.push({
                    label: `צילום ת.ז. + ספח של ${sh.name} (${compName})`,
                    file: sh.idFile,
                    update: (f) => {
                      const updatedList = [...companyList];
                      const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                      updatedShs[sIdx] = { ...updatedShs[sIdx], idFile: f };
                      updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                      setInfo({ [companyKey]: updatedList } as any);
                    },
                  });
                  if (sh.additionalIdType) {
                    const t = sh.additionalIdType === "license" ? "רישיון נהיגה" : sh.additionalIdType === "passport" ? "דרכון" : "ת.ז. הורה";
                    rows.push({
                      label: `צילום ${t} של ${sh.name} (${compName})`,
                      file: sh.additionalIdFile,
                      update: (f) => {
                        const updatedList = [...companyList];
                        const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                        updatedShs[sIdx] = { ...updatedShs[sIdx], additionalIdFile: f };
                        updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                        setInfo({ [companyKey]: updatedList } as any);
                      },
                    });
                  }
                } else if (sh.holderType === "company") {
                  const setPersonOwner = (po: any) => {
                    const updatedList = [...companyList];
                    const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                    updatedShs[sIdx] = { ...updatedShs[sIdx], personOwner: po };
                    updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                    setInfo({ [companyKey]: updatedList } as any);
                  };
                  walkPersonOwner(sh.personOwner, setPersonOwner, sh.companyName || compName);
                  if (sh.childCompany) {
                    const setChildCo = (c: any) => {
                      const updatedList = [...companyList];
                      const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                      updatedShs[sIdx] = { ...updatedShs[sIdx], childCompany: c };
                      updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                      setInfo({ [companyKey]: updatedList } as any);
                    };
                    walkChild(sh.childCompany, setChildCo, sh.companyName || compName);
                  }
                }
              });
            });
          };

          walkShareholder(info.existingCompanies || [], (l) => setInfo({ existingCompanies: l } as any), "existingCompanies");
          walkShareholder(info.newCompanies || [], (l) => setInfo({ newCompanies: l } as any), "newCompanies");

          if (rows.length === 0) return null;

          return (
            <div key={`shareholders-${who}`} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg text-foreground">
                צילומי ת.ז. – בעלי מניות{ownerName ? ` (${ownerName})` : ""}
              </h3>
              {rows.map((row, i) => (
                <FileUpload
                  key={i}
                  id={`shareholder-${who}-${i}`}
                  label={row.label}
                  onChange={(files) => row.update(files?.[0])}
                />
              ))}
            </div>
          );
        })}

        {/* Nonprofit representative additional ID files */}
        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
          const setInfo = who === "user" ? setNonprofitInfo : setSpouseNonprofitInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("nonprofit")) return null;
          const rep = info.representativeMember;
          if (!rep || info.hasTaxFile !== true) return null;
          const types = (rep as any).additionalIdTypes as string[] | undefined;
          if (!types || types.length === 0) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;
          return (
            <div key={`np-rep-${who}`} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg text-foreground">
                אמצעי זיהוי נוספים – {rep.name || "חבר הועד"}{ownerName ? ` (${ownerName})` : ""}
              </h3>
              {types.includes("passport") && (
                <FileUpload
                  id={`${who}-rep-passport`}
                  label="צילום דרכון"
                  onChange={(files) => setInfo({ representativeMember: { ...(rep as any), additionalPassportFile: files?.[0] } })}
                />
              )}
              {types.includes("license") && (
                <FileUpload
                  id={`${who}-rep-license`}
                  label="צילום רישיון נהיגה"
                  onChange={(files) => setInfo({ representativeMember: { ...(rep as any), additionalLicenseFile: files?.[0] } })}
                />
              )}
              {types.includes("parentId") && (
                <FileUpload
                  id={`${who}-rep-parentid`}
                  label="צילום ת.ז. הורה"
                  onChange={(files) => setInfo({ representativeMember: { ...(rep as any), additionalIdFile: files?.[0] } })}
                />
              )}
            </div>
          );
        })}

        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
          const setInfo = who === "user" ? setNonprofitInfo : setSpouseNonprofitInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("nonprofit")) return null;
          const newMembers = info.boardMembers || [];
          const existingMembers = info.existingBoardMembers || [];
          const rep = info.representativeMember;
          const hasRep = !!rep && info.hasTaxFile === true;
          if (newMembers.length === 0 && existingMembers.length === 0 && !hasRep) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;
          return (
            <div key={who} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg">
                צילומי ת.ז. – חברי ועד עמותה{ownerName ? ` (${ownerName})` : ""}
              </h3>
              {newMembers.map((m: any, idx: number) => (
                <FileUpload
                  key={`new-${idx}`}
                  id={`${who}-board-new-${idx}-id`}
                  label={`צילום ת.ז. + ספח של ${m.name || `חבר ועד #${idx + 1}`}`}
                  onChange={(files) => {
                    const updated = [...newMembers];
                    updated[idx] = { ...updated[idx], idFile: files?.[0] };
                    setInfo({ boardMembers: updated });
                  }}
                />
              ))}
              {existingMembers.map((m: any, idx: number) => (
                <FileUpload
                  key={`existing-${idx}`}
                  id={`${who}-board-existing-${idx}-id`}
                  label={`צילום ת.ז. + ספח של ${m.name || `חבר ועד #${idx + 1}`}`}
                  onChange={(files) => {
                    const updated = [...existingMembers];
                    updated[idx] = { ...updated[idx], idFile: files?.[0] };
                    setInfo({ existingBoardMembers: updated });
                  }}
                />
              ))}
              {hasRep && (
                <FileUpload
                  id={`${who}-board-rep-id`}
                  label={`צילום ת.ז. + ספח של ${rep!.name || "חבר הועד שיופיע בייצוג"}`}
                  onChange={(files) => {
                    setInfo({ representativeMember: { ...(rep as any), idFile: files?.[0] } });
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Bank account confirmation for nonprofits without tax file */}
        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
          const setInfo = who === "user" ? setNonprofitInfo : setSpouseNonprofitInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("nonprofit")) return null;
          if (info.hasTaxFile !== false || info.hasBankAccount !== true) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;
          return (
            <div key={`np-bank-${who}`} className="space-y-3 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg">אסמכתא חשבון בנק – עמותה{ownerName ? ` (${ownerName})` : ""}</h3>
              <FileUpload
                id={`${who}-np-bank-file`}
                label="אישור ניהול חשבון או צילום שיק של העמותה"
                onChange={(files) => setInfo({ bankFile: files?.[0] || undefined })}
              />
            </div>
          );
        })}
      </div>}

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(3)}
        loading={loading}
      />
    </div>
  );
};
