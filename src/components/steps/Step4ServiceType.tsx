import { useFormContext } from "@/contexts/FormContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step4ServiceType = () => {
  const { serviceType, setServiceType, personalInfo, setCurrentStep, sendToWebhook } =
    useFormContext();
  const [loading, setLoading] = useState(false);

  const purposes = [
    { id: "new_business", label: "הקמת עסק חדש" },
    { id: "existing_business", label: "יש לי עסק קיים" },
    { id: "shareholder", label: "אני בעל מניות בחברה" },
    { id: "employee_refund", label: "אני שכיר בלבד עבור החזר מס" },
  ];

  const togglePurpose = (purposeId: string) => {
    const currentPurposes = serviceType.purposes || [];
    const newPurposes = currentPurposes.includes(purposeId)
      ? currentPurposes.filter((p) => p !== purposeId)
      : [...currentPurposes, purposeId];
    setServiceType({ purposes: newPurposes });
  };

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-service-type",
      serviceType
    );
    setLoading(false);
    if (success) {
      // Determine next step based on whether user has business
      const hasBusiness = serviceType.purposes?.some((p) =>
        ["new_business", "existing_business", "shareholder"].includes(p)
      );
      const spouseHasBusiness = serviceType.spouseEmploymentStatus === "business_owner";

      if (hasBusiness) {
        setCurrentStep(5);
      } else if (spouseHasBusiness) {
        setCurrentStep(6);
      } else {
        setCurrentStep(7);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">סוג השירות המבוקש</h2>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">בשביל מה ניגשת לקבל שירות? *</Label>
        <p className="text-sm text-muted-foreground">ניתן לבחור יותר מתשובה אחת</p>

        <div className="space-y-3">
          {purposes.map((purpose) => (
            <div key={purpose.id} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={purpose.id}
                checked={serviceType.purposes?.includes(purpose.id)}
                onCheckedChange={() => togglePurpose(purpose.id)}
              />
              <Label htmlFor={purpose.id} className="cursor-pointer">
                {purpose.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {personalInfo.maritalStatus === "married" && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">מצב תעסוקתי של בן/בת הזוג</h3>

          <RadioGroup
            value={serviceType.spouseEmploymentStatus || ""}
            onValueChange={(value: any) => setServiceType({ spouseEmploymentStatus: value })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="unemployed" id="unemployed" />
              <Label htmlFor="unemployed">לא עובד/ת</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="employee" id="employee" />
              <Label htmlFor="employee">שכיר/ה</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="business_owner" id="business_owner" />
              <Label htmlFor="business_owner">בעל/ת עסק</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="wants_business" id="wants_business" />
              <Label htmlFor="wants_business">מעוניין/ת לפתוח עסק</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="shareholder" id="shareholder_spouse" />
              <Label htmlFor="shareholder_spouse">בעל/ת מניות בחברה</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(3)}
        loading={loading}
        disabled={!serviceType.purposes || serviceType.purposes.length === 0}
      />
    </div>
  );
};
