import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step3Identification = () => {
  const { identificationInfo, setIdentificationInfo, personalInfo, setCurrentStep, sendToWebhook } =
    useFormContext();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-identification",
      identificationInfo
    );
    setLoading(false);
    if (success) {
      setCurrentStep(4);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">מסמכים וזיהוי</h2>

      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-lg">מסמכי זיהוי עיקריים</h3>

        <div className="space-y-2">
          <Label htmlFor="idCardFile">צילום תעודת זהות + ספח *</Label>
          <Input
            id="idCardFile"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) =>
              setIdentificationInfo({ idCardFile: e.target.files?.[0] || undefined })
            }
          />
        </div>

        <div className="space-y-4">
          <Label>אמצעי זיהוי נוסף</Label>
          <RadioGroup
            value={identificationInfo.additionalIdType || ""}
            onValueChange={(value: any) => setIdentificationInfo({ additionalIdType: value })}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="parentId" id="parentId" />
              <Label htmlFor="parentId">מספר זהות של אחד ההורים</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="license" id="license" />
              <Label htmlFor="license">רישיון נהיגה</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="passport" id="passport" />
              <Label htmlFor="passport">דרכון ישראלי</Label>
            </div>
          </RadioGroup>

          {identificationInfo.additionalIdType && (
            <div className="space-y-4 mr-6">
              <div className="space-y-2">
                <Label htmlFor="additionalIdNumber">מספר</Label>
                <Input
                  id="additionalIdNumber"
                  value={identificationInfo.additionalIdNumber || ""}
                  onChange={(e) =>
                    setIdentificationInfo({ additionalIdNumber: e.target.value })
                  }
                />
              </div>

              {identificationInfo.additionalIdType !== "parentId" && (
                <div className="space-y-2">
                  <Label htmlFor="additionalIdFile">העלאת קובץ</Label>
                  <Input
                    id="additionalIdFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setIdentificationInfo({ additionalIdFile: e.target.files?.[0] || undefined })
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {personalInfo.maritalStatus === "married" && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">מסמכי זיהוי של בן/בת הזוג</h3>

          <div className="space-y-2">
            <Label htmlFor="spouseIdCardFile">צילום תעודת זהות + ספח</Label>
            <Input
              id="spouseIdCardFile"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setIdentificationInfo({ spouseIdCardFile: e.target.files?.[0] || undefined })
              }
            />
          </div>

          <div className="space-y-4">
            <Label>אמצעי זיהוי נוסף</Label>
            <RadioGroup
              value={identificationInfo.spouseAdditionalIdType || ""}
              onValueChange={(value: any) =>
                setIdentificationInfo({ spouseAdditionalIdType: value })
              }
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="parentId" id="spouseParentId" />
                <Label htmlFor="spouseParentId">מספר זהות של אחד ההורים</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="license" id="spouseLicense" />
                <Label htmlFor="spouseLicense">רישיון נהיגה</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="passport" id="spousePassport" />
                <Label htmlFor="spousePassport">דרכון ישראלי</Label>
              </div>
            </RadioGroup>

            {identificationInfo.spouseAdditionalIdType && (
              <div className="space-y-4 mr-6">
                <div className="space-y-2">
                  <Label htmlFor="spouseAdditionalIdNumber">מספר</Label>
                  <Input
                    id="spouseAdditionalIdNumber"
                    value={identificationInfo.spouseAdditionalIdNumber || ""}
                    onChange={(e) =>
                      setIdentificationInfo({ spouseAdditionalIdNumber: e.target.value })
                    }
                  />
                </div>

                {identificationInfo.spouseAdditionalIdType !== "parentId" && (
                  <div className="space-y-2">
                    <Label htmlFor="spouseAdditionalIdFile">העלאת קובץ</Label>
                    <Input
                      id="spouseAdditionalIdFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setIdentificationInfo({
                          spouseAdditionalIdFile: e.target.files?.[0] || undefined,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(2)}
        loading={loading}
      />
    </div>
  );
};
