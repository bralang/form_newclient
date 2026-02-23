import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step3Documents = () => {
  const {
    personalInfo,
    detailedInfo,
    spouseInfo,
    serviceType,
    businessInfo,
    spouseBusinessInfo,
    documentsInfo,
    setDocumentsInfo,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);

  const isMarried = personalInfo.maritalStatus === "married";
  const userPurposes = serviceType.userPurposes;
  const spousePurposes = serviceType.spousePurposes;

  const userHasNewBusiness = userPurposes.includes("business") && serviceType.userPurposeStatus?.business === "new";
  const spouseHasNewBusiness = spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business === "new";

  const userHasAuthorized = userHasNewBusiness && businessInfo.businessType === "authorized";
  const spouseHasAuthorized = spouseHasNewBusiness && spouseBusinessInfo.businessType === "authorized";

  const userNeedsLease = userHasNewBusiness && businessInfo.isHomeOffice === false;
  const spouseNeedsLease = spouseHasNewBusiness && spouseBusinessInfo.isHomeOffice === false;

  const userHasCompany = userPurposes.includes("company");
  const spouseHasCompany = spousePurposes.includes("company");

  const hasExistingCompanies = (businessInfo.existingCompanyCount || 0) > 0 || (spouseBusinessInfo.existingCompanyCount || 0) > 0;
  const hasNewCompaniesInRegistrar = businessInfo.newCompanies?.some((c) => c.existsInRegistrar) || spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar);
  const hasNewCompaniesNotInRegistrarButInRegistrar = businessInfo.newCompanies?.some((c) => c.existsInRegistrar === true) || spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar === true);

  const handleNext = async () => {
    setLoading(true);
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/client-intake-step3",
      { documentsInfo, personalInfo },
      { silent: true }
    );
    setLoading(false);
    setCurrentStep(4);
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

      {/* Marketing Text */}
      <div className="p-5 bg-gradient-to-r from-primary/5 to-secondary/20 rounded-xl border border-primary/10 space-y-3">
        <h3 className="text-xl font-bold text-foreground">מסכימים להרוויח יותר מהעסק שלכם?</h3>
        <p className="text-muted-foreground">מסמיכים אותנו להיות המייצגים מול הרשויות?</p>
        <p className="text-sm text-muted-foreground">המסמכים שתעלו בשלב זה יתנו לנו את הרשות להוציא טופסי ייצוג לחתימה.</p>
        <p className="text-lg font-bold text-primary">מתקדמים…</p>
      </div>

      {/* Document Uploads */}
      <div className="space-y-6">

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
              label="צילום ת.ז. + ספח (ניתן להעלות מספר קבצים)"
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
              label="העלאת טופס אישור ניהול חשבון"
              onChange={(files) => setDocumentsInfo({ bankConfirmationFile: files?.[0] || undefined })}
            />
          </div>
        )}
        {spouseHasAuthorized && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">אישור ניהול חשבון – {personalInfo.spouseName}</h3>
            <FileUpload
              id="spouseBankConfFile"
              label="העלאת טופס אישור ניהול חשבון"
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

        {/* Company documents */}
        {(userHasCompany || spouseHasCompany) && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">מסמכי חברה</h3>

            {hasExistingCompanies && (
              <FileUpload
                id="incorporationFiles"
                label="תעודת התאגדות ו/או נסח רשם החברות"
                multiple
                onChange={(files) => setDocumentsInfo({ incorporationFiles: files ? Array.from(files) : undefined })}
              />
            )}

            {hasNewCompaniesNotInRegistrarButInRegistrar && (
              <>
                <FileUpload
                  id="registrarFile"
                  label="תעודת התאגדות ו/או נסח רשם החברות (חברה חדשה קיימת ברשם)"
                  onChange={(files) => setDocumentsInfo({ registrarExtractFile: files?.[0] || undefined })}
                />
                <FileUpload
                  id="companyBankFile"
                  label="אישור ניהול חשבון של החברה"
                  onChange={(files) => setDocumentsInfo({ companyBankConfirmationFile: files?.[0] || undefined })}
                />
              </>
            )}
          </div>
        )}
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(2)}
        loading={loading}
      />
    </div>
  );
};
