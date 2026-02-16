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

  // Determine what documents are needed
  const userHasAuthorized =
    userPurposes.includes("new_business") &&
    businessInfo.businessType === "authorized";
  const spouseHasAuthorized =
    spousePurposes.includes("new_business") &&
    spouseBusinessInfo.businessType === "authorized";

  const userNeedsLease =
    userPurposes.includes("new_business") && businessInfo.isHomeOffice === false;
  const spouseNeedsLease =
    spousePurposes.includes("new_business") &&
    spouseBusinessInfo.isHomeOffice === false;

  const userHasCompany = userPurposes.includes("company");
  const spouseHasCompany = spousePurposes.includes("company");

  // Check if any existing companies (purpose 4)
  const hasExistingCompanies =
    (businessInfo.existingCompanyCount || 0) > 0 ||
    (spouseBusinessInfo.existingCompanyCount || 0) > 0;
  const hasNewCompaniesInRegistrar =
    businessInfo.newCompanies?.some((c) => c.existsInRegistrar) ||
    spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar);

  const handleNext = async () => {
    setLoading(true);
    sendToWebhook(
      "https://n8n.chasida.biz/webhook/client-intake-step3",
      { documentsInfo, personalInfo },
      { silent: true }
    );
    setLoading(false);
    setCurrentStep(4);
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-bold text-foreground">עדכון מסמכים נגיש</h2>
      </div>

      {/* Marketing Text */}
      <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/30 rounded-lg space-y-4">
        <h3 className="text-xl font-bold text-foreground">
          מסכימים להרוויח יותר מהעסק שלכם?
        </h3>
        <p className="text-muted-foreground">
          מסמיכים אותנו להיות המייצגים מול הרשויות?
        </p>
        <p className="text-sm text-muted-foreground">
          המסמכים שתעלו בשלב זה יתנו לנו את הרשות להוציא טופסי ייצוג לחתימה.
        </p>
        <p className="text-lg font-semibold text-primary">מתקדמים…</p>
      </div>

      {/* Document Uploads */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          העלאת מסמכים נחוצים
        </h2>

        {/* User ID */}
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">
            מסמכי זיהוי - {personalInfo.firstName || "שלי"}
          </h3>

          <div className="space-y-2">
            <Label htmlFor="idCardFiles">
              צילום ת.ז. + ספח * (ניתן להעלות מספר קבצים)
            </Label>
            <Input
              id="idCardFiles"
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) =>
                setDocumentsInfo({
                  idCardFiles: e.target.files
                    ? Array.from(e.target.files)
                    : undefined,
                })
              }
            />
          </div>

          {/* Additional ID files based on step 2 selection */}
          {(detailedInfo.additionalIdType === "license" ||
            detailedInfo.additionalIdType === "passport") && (
            <div className="space-y-2">
              <Label htmlFor="addIdFile">
                {detailedInfo.additionalIdType === "license"
                  ? "העלאת רישיון נהיגה"
                  : "העלאת דרכון"}
              </Label>
              <Input
                id="addIdFile"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setDocumentsInfo({
                    licenseFile:
                      detailedInfo.additionalIdType === "license"
                        ? e.target.files?.[0]
                        : undefined,
                    passportFile:
                      detailedInfo.additionalIdType === "passport"
                        ? e.target.files?.[0]
                        : undefined,
                  })
                }
              />
            </div>
          )}
        </div>

        {/* Spouse ID */}
        {isMarried && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">
              מסמכי זיהוי - {personalInfo.spouseName || "בן/בת הזוג"}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="spouseIdCardFiles">
                צילום ת.ז. + ספח (ניתן להעלות מספר קבצים)
              </Label>
              <Input
                id="spouseIdCardFiles"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) =>
                  setDocumentsInfo({
                    spouseIdCardFiles: e.target.files
                      ? Array.from(e.target.files)
                      : undefined,
                  })
                }
              />
            </div>

            {(spouseInfo.additionalIdType === "license" ||
              spouseInfo.additionalIdType === "passport") && (
              <div className="space-y-2">
                <Label htmlFor="spouseAddIdFile">
                  {spouseInfo.additionalIdType === "license"
                    ? "העלאת רישיון נהיגה"
                    : "העלאת דרכון"}
                </Label>
                <Input
                  id="spouseAddIdFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setDocumentsInfo({
                      spouseLicenseFile:
                        spouseInfo.additionalIdType === "license"
                          ? e.target.files?.[0]
                          : undefined,
                      spousePassportFile:
                        spouseInfo.additionalIdType === "passport"
                          ? e.target.files?.[0]
                          : undefined,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Bank confirmation for authorized business */}
        {userHasAuthorized && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">
              אישור ניהול חשבון - {personalInfo.firstName}
            </h3>
            <Label htmlFor="bankConfFile">
              אישור ניהול חשבון בנק / צילום שיק
            </Label>
            <Input
              id="bankConfFile"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setDocumentsInfo({
                  bankConfirmationFile: e.target.files?.[0] || undefined,
                })
              }
            />
          </div>
        )}

        {spouseHasAuthorized && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">
              אישור ניהול חשבון - {personalInfo.spouseName}
            </h3>
            <Label htmlFor="spouseBankConfFile">
              אישור ניהול חשבון בנק / צילום שיק
            </Label>
            <Input
              id="spouseBankConfFile"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setDocumentsInfo({
                  spouseBankConfirmationFile: e.target.files?.[0] || undefined,
                })
              }
            />
          </div>
        )}

        {/* Lease agreement if not home office */}
        {userNeedsLease && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">
              הסכם שכירות לעסק - {personalInfo.firstName}
            </h3>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) =>
                setDocumentsInfo({
                  leaseAgreementFile: e.target.files?.[0] || undefined,
                })
              }
            />
          </div>
        )}

        {spouseNeedsLease && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">
              הסכם שכירות לעסק - {personalInfo.spouseName}
            </h3>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) =>
                setDocumentsInfo({
                  spouseLeaseAgreementFile: e.target.files?.[0] || undefined,
                })
              }
            />
          </div>
        )}

        {/* Company documents */}
        {(userHasCompany || spouseHasCompany) && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">מסמכי חברה</h3>

            {hasExistingCompanies && (
              <div className="space-y-2">
                <Label htmlFor="incorporationFiles">
                  תעודת התאגדות ו/או נסח רשם החברות
                </Label>
                <Input
                  id="incorporationFiles"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  multiple
                  onChange={(e) =>
                    setDocumentsInfo({
                      incorporationFiles: e.target.files
                        ? Array.from(e.target.files)
                        : undefined,
                    })
                  }
                />
              </div>
            )}

            {hasNewCompaniesInRegistrar && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registrarFile">
                    תעודת התאגדות ו/או נסח רשם החברות (חברה חדשה קיימת ברשם)
                  </Label>
                  <Input
                    id="registrarFile"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) =>
                      setDocumentsInfo({
                        registrarExtractFile: e.target.files?.[0] || undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyBankFile">
                    אישור ניהול חשבון של החברה
                  </Label>
                  <Input
                    id="companyBankFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setDocumentsInfo({
                        companyBankConfirmationFile:
                          e.target.files?.[0] || undefined,
                      })
                    }
                  />
                </div>
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
