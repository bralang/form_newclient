import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useEffect, useRef, useState } from "react";

export const Step3Documents = () => {
  const {
    personalInfo,
    identificationInfo,
    setIdentificationInfo,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const additionalIdFieldsRef = useRef<HTMLDivElement | null>(null);
  const spouseAdditionalIdFieldsRef = useRef<HTMLDivElement | null>(null);

  const handleNext = async () => {
    console.log("Step3Documents: Next clicked");
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-step3-documents",
      { identificationInfo }
    );
    setLoading(false);
    if (success) {
      setCurrentStep(4);
    }
  };

  useEffect(() => {
    if (identificationInfo.additionalIdTypes?.length) {
      additionalIdFieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [identificationInfo.additionalIdTypes]);

  useEffect(() => {
    if (identificationInfo.spouseAdditionalIdTypes?.length) {
      spouseAdditionalIdFieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [identificationInfo.spouseAdditionalIdTypes]);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-bold text-foreground">עדכון מסמכים נגיש</h2>
      </div>

      {/* Marketing Text Before Documents */}
      <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/30 rounded-lg space-y-4">
        <h3 className="text-xl font-bold text-foreground">מסכימים להרוויח יותר מהעסק שלכם?</h3>
        <p className="text-muted-foreground">
          מסמיכים אותנו להיות המייצגים מול הרשויות?
        </p>
        <p className="text-sm text-muted-foreground">
          המסמכים שתעלו בשלב זה יתנו לנו את הרשות להוציא טופסי ייצוג לחתימה.
        </p>
        <p className="text-lg font-semibold text-primary">מתקדמים...</p>
      </div>

      {/* Document Upload Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">העלאת מסמכים נחוצים</h2>

        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">מסמכי זיהוי עיקריים</h3>

          <div className="space-y-2">
            <Label htmlFor="idCardFiles">צילום תעודת זהות + ספח * (ניתן להעלות מספר קבצים)</Label>
            <Input
              id="idCardFiles"
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => setIdentificationInfo({ idCardFiles: e.target.files ? Array.from(e.target.files) : undefined })}
            />
          </div>

          <div className="space-y-4">
            <Label>אמצעי זיהוי נוסף (ניתן לבחור יותר מאחד)</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="parentId"
                  checked={identificationInfo.additionalIdTypes?.includes("parentId") || false}
                  onCheckedChange={(checked) => {
                    const current = identificationInfo.additionalIdTypes || [];
                    if (checked) {
                      setIdentificationInfo({ additionalIdTypes: [...current, "parentId"] });
                    } else {
                      setIdentificationInfo({ additionalIdTypes: current.filter(t => t !== "parentId") });
                    }
                  }}
                />
                <Label htmlFor="parentId" className="cursor-pointer">
                  מספר זהות של אחד ההורים
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="license"
                  checked={identificationInfo.additionalIdTypes?.includes("license") || false}
                  onCheckedChange={(checked) => {
                    const current = identificationInfo.additionalIdTypes || [];
                    if (checked) {
                      setIdentificationInfo({ additionalIdTypes: [...current, "license"] });
                    } else {
                      setIdentificationInfo({ additionalIdTypes: current.filter(t => t !== "license") });
                    }
                  }}
                />
                <Label htmlFor="license" className="cursor-pointer">
                  רישיון נהיגה
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="passport"
                  checked={identificationInfo.additionalIdTypes?.includes("passport") || false}
                  onCheckedChange={(checked) => {
                    const current = identificationInfo.additionalIdTypes || [];
                    if (checked) {
                      setIdentificationInfo({ additionalIdTypes: [...current, "passport"] });
                    } else {
                      setIdentificationInfo({ additionalIdTypes: current.filter(t => t !== "passport") });
                    }
                  }}
                />
                <Label htmlFor="passport" className="cursor-pointer">
                  דרכון ישראלי
                </Label>
              </div>
            </div>

            {identificationInfo.additionalIdTypes?.includes("parentId") && (
              <div ref={additionalIdFieldsRef} className="space-y-4 mr-6 p-3 border-r-2 border-primary/30">
                <h4 className="font-medium">פרטי זהות הורה</h4>
                <div className="space-y-2">
                  <Label htmlFor="additionalIdNumber">מספר זהות של ההורה</Label>
                  <Input
                    id="additionalIdNumber"
                    value={identificationInfo.additionalIdNumber || ""}
                    onChange={(e) => setIdentificationInfo({ additionalIdNumber: e.target.value })}
                  />
                </div>
              </div>
            )}

            {identificationInfo.additionalIdTypes?.includes("license") && (
              <div className="space-y-4 mr-6 p-3 border-r-2 border-primary/30">
                <h4 className="font-medium">פרטי רישיון נהיגה</h4>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">מספר רישיון</Label>
                  <Input
                    id="licenseNumber"
                    value={identificationInfo.licenseNumber || ""}
                    onChange={(e) => setIdentificationInfo({ licenseNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseFile">העלאת קובץ רישיון</Label>
                  <Input
                    id="licenseFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setIdentificationInfo({ licenseFile: e.target.files?.[0] || undefined })}
                  />
                </div>
              </div>
            )}

            {identificationInfo.additionalIdTypes?.includes("passport") && (
              <div className="space-y-4 mr-6 p-3 border-r-2 border-primary/30">
                <h4 className="font-medium">פרטי דרכון</h4>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">מספר דרכון</Label>
                  <Input
                    id="passportNumber"
                    value={identificationInfo.passportNumber || ""}
                    onChange={(e) => setIdentificationInfo({ passportNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportFile">העלאת קובץ דרכון</Label>
                  <Input
                    id="passportFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setIdentificationInfo({ passportFile: e.target.files?.[0] || undefined })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {personalInfo.maritalStatus === "married" && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">מסמכי זיהוי של בן/בת הזוג</h3>

            <div className="space-y-2">
              <Label htmlFor="spouseIdCardFiles">צילום תעודת זהות + ספח (ניתן להעלות מספר קבצים)</Label>
              <Input
                id="spouseIdCardFiles"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => setIdentificationInfo({ spouseIdCardFiles: e.target.files ? Array.from(e.target.files) : undefined })}
              />
            </div>

            <div className="space-y-4">
              <Label>אמצעי זיהוי נוסף (ניתן לבחור יותר מאחד)</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="spouseParentId"
                    checked={identificationInfo.spouseAdditionalIdTypes?.includes("parentId") || false}
                    onCheckedChange={(checked) => {
                      const current = identificationInfo.spouseAdditionalIdTypes || [];
                      if (checked) {
                        setIdentificationInfo({ spouseAdditionalIdTypes: [...current, "parentId"] });
                      } else {
                        setIdentificationInfo({ spouseAdditionalIdTypes: current.filter(t => t !== "parentId") });
                      }
                    }}
                  />
                  <Label htmlFor="spouseParentId" className="cursor-pointer">מספר זהות של אחד ההורים</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="spouseLicense"
                    checked={identificationInfo.spouseAdditionalIdTypes?.includes("license") || false}
                    onCheckedChange={(checked) => {
                      const current = identificationInfo.spouseAdditionalIdTypes || [];
                      if (checked) {
                        setIdentificationInfo({ spouseAdditionalIdTypes: [...current, "license"] });
                      } else {
                        setIdentificationInfo({ spouseAdditionalIdTypes: current.filter(t => t !== "license") });
                      }
                    }}
                  />
                  <Label htmlFor="spouseLicense" className="cursor-pointer">רישיון נהיגה</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="spousePassport"
                    checked={identificationInfo.spouseAdditionalIdTypes?.includes("passport") || false}
                    onCheckedChange={(checked) => {
                      const current = identificationInfo.spouseAdditionalIdTypes || [];
                      if (checked) {
                        setIdentificationInfo({ spouseAdditionalIdTypes: [...current, "passport"] });
                      } else {
                        setIdentificationInfo({ spouseAdditionalIdTypes: current.filter(t => t !== "passport") });
                      }
                    }}
                  />
                  <Label htmlFor="spousePassport" className="cursor-pointer">דרכון ישראלי</Label>
                </div>
              </div>

              {identificationInfo.spouseAdditionalIdTypes?.includes("parentId") && (
                <div ref={spouseAdditionalIdFieldsRef} className="space-y-4 mr-6 p-3 border-r-2 border-primary/30">
                  <h4 className="font-medium">פרטי זהות הורה</h4>
                  <div className="space-y-2">
                    <Label htmlFor="spouseAdditionalIdNumber">מספר זהות של ההורה</Label>
                    <Input
                      id="spouseAdditionalIdNumber"
                      value={identificationInfo.spouseAdditionalIdNumber || ""}
                      onChange={(e) => setIdentificationInfo({ spouseAdditionalIdNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {identificationInfo.spouseAdditionalIdTypes?.includes("license") && (
                <div className="space-y-4 mr-6 p-3 border-r-2 border-primary/30">
                  <h4 className="font-medium">פרטי רישיון נהיגה</h4>
                  <div className="space-y-2">
                    <Label htmlFor="spouseLicenseNumber">מספר רישיון</Label>
                    <Input
                      id="spouseLicenseNumber"
                      value={identificationInfo.spouseLicenseNumber || ""}
                      onChange={(e) => setIdentificationInfo({ spouseLicenseNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spouseLicenseFile">העלאת קובץ רישיון</Label>
                    <Input
                      id="spouseLicenseFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setIdentificationInfo({ spouseLicenseFile: e.target.files?.[0] || undefined })}
                    />
                  </div>
                </div>
              )}

              {identificationInfo.spouseAdditionalIdTypes?.includes("passport") && (
                <div className="space-y-4 mr-6 p-3 border-r-2 border-primary/30">
                  <h4 className="font-medium">פרטי דרכון</h4>
                  <div className="space-y-2">
                    <Label htmlFor="spousePassportNumber">מספר דרכון</Label>
                    <Input
                      id="spousePassportNumber"
                      value={identificationInfo.spousePassportNumber || ""}
                      onChange={(e) => setIdentificationInfo({ spousePassportNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spousePassportFile">העלאת קובץ דרכון</Label>
                    <Input
                      id="spousePassportFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setIdentificationInfo({ spousePassportFile: e.target.files?.[0] || undefined })}
                    />
                  </div>
                </div>
              )}
            </div>
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
