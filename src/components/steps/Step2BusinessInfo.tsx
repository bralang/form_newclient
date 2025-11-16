import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step2BusinessInfo = () => {
  const {
    serviceType,
    setServiceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
    personalInfo,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
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

  const hasBusiness = serviceType.purposes?.some((p) =>
    ["new_business", "existing_business", "shareholder"].includes(p)
  );
  const isNewBusiness = serviceType.purposes?.includes("new_business");
  const spouseHasBusiness = serviceType.spouseEmploymentStatus === "business_owner";

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-step2",
      { serviceType, businessInfo, spouseBusinessInfo }
    );
    setLoading(false);
    if (success) {
      setCurrentStep(3);
    }
  };

  const renderBusinessFields = (info: any, setInfo: any, prefix: string = "") => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}businessName`}>שם העסק</Label>
          <Input
            id={`${prefix}businessName`}
            value={info.businessName || ""}
            onChange={(e) => setInfo({ businessName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}businessNumber`}>מספר עוסק או ח.פ.</Label>
          <Input
            id={`${prefix}businessNumber`}
            value={info.businessNumber || ""}
            onChange={(e) => setInfo({ businessNumber: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}industryType`}>תחום עיסוק</Label>
          <Input
            id={`${prefix}industryType`}
            value={info.industryType || ""}
            onChange={(e) => setInfo({ industryType: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}startDate`}>תאריך פתיחת העסק</Label>
          <Input
            id={`${prefix}startDate`}
            type="date"
            value={info.startDate || ""}
            onChange={(e) => setInfo({ startDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <RadioGroup
          value={info.businessType || ""}
          onValueChange={(value: any) => setInfo({ businessType: value })}
          className="flex flex-wrap flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole_proprietorship" id={`${prefix}sole_proprietorship`} />
            <Label htmlFor={`${prefix}sole_proprietorship`}>עוסק מורשה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id={`${prefix}partnership`} />
            <Label htmlFor={`${prefix}partnership`}>שותפות</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="company" id={`${prefix}company`} />
            <Label htmlFor={`${prefix}company`}>חברה</Label>
          </div>
        </RadioGroup>
      </div>

      {info.businessType === "company" && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}companyRegistrationFile`}>נסח חברה</Label>
          <Input
            id={`${prefix}companyRegistrationFile`}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setInfo({ companyRegistrationFile: e.target.files?.[0] || undefined })
            }
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id={`${prefix}isHomeOffice`}
            checked={info.isHomeOffice}
            onCheckedChange={(checked) => setInfo({ isHomeOffice: checked as boolean })}
          />
          <Label htmlFor={`${prefix}isHomeOffice`}>העסק מתנהל מהבית</Label>
        </div>

        {info.isHomeOffice === false && (
          <div className="space-y-4 mr-6">
            <Label className="text-lg font-semibold">כתובת העסק</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${prefix}businessStreet`}>רחוב</Label>
                <Input
                  id={`${prefix}businessStreet`}
                  value={info.businessAddress?.street || ""}
                  onChange={(e) =>
                    setInfo({
                      businessAddress: { ...info.businessAddress, street: e.target.value } as any,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}businessHouseNumber`}>מספר בית</Label>
                <Input
                  id={`${prefix}businessHouseNumber`}
                  value={info.businessAddress?.number || ""}
                  onChange={(e) =>
                    setInfo({
                      businessAddress: { ...info.businessAddress, number: e.target.value } as any,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}businessCity`}>עיר</Label>
                <Input
                  id={`${prefix}businessCity`}
                  value={info.businessAddress?.city || ""}
                  onChange={(e) =>
                    setInfo({
                      businessAddress: { ...info.businessAddress, city: e.target.value } as any,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${prefix}leaseAgreementFile`}>הסכם שכירות</Label>
              <Input
                id={`${prefix}leaseAgreementFile`}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setInfo({ leaseAgreementFile: e.target.files?.[0] || undefined })
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id={`${prefix}hasInventory`}
            checked={info.hasInventory}
            onCheckedChange={(checked) => setInfo({ hasInventory: checked as boolean })}
          />
          <Label htmlFor={`${prefix}hasInventory`}>האם יש מלאי</Label>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id={`${prefix}hasEmployees`}
            checked={info.hasEmployees}
            onCheckedChange={(checked) => setInfo({ hasEmployees: checked as boolean })}
          />
          <Label htmlFor={`${prefix}hasEmployees`}>האם יש עובדים</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>תדירות דיווח מע״מ</Label>
        <RadioGroup
          value={info.reportingFrequency || ""}
          onValueChange={(value: any) => setInfo({ reportingFrequency: value })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="monthly" id={`${prefix}monthly`} />
            <Label htmlFor={`${prefix}monthly`}>חודשי</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="bimonthly" id={`${prefix}bimonthly`} />
            <Label htmlFor={`${prefix}bimonthly`}>דו-חודשי</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>סטטוס העסק</Label>
        <RadioGroup
          value={info.status || "active"}
          onValueChange={(value: any) => setInfo({ status: value })}
          className="flex flex-wrap flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="active" id={`${prefix}active`} />
            <Label htmlFor={`${prefix}active`}>פעיל</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="inactive" id={`${prefix}inactive`} />
            <Label htmlFor={`${prefix}inactive`}>לא פעיל</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="closed" id={`${prefix}closed`} />
            <Label htmlFor={`${prefix}closed`}>סגור</Label>
          </div>
        </RadioGroup>
      </div>

      {info.status === "closed" && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}endDate`}>תאריך סגירת העסק</Label>
          <Input
            id={`${prefix}endDate`}
            type="date"
            value={info.endDate || ""}
            onChange={(e) => setInfo({ endDate: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${prefix}notes`}>הערות כלליות</Label>
        <Input
          id={`${prefix}notes`}
          value={info.notes || ""}
          onChange={(e) => setInfo({ notes: e.target.value })}
          placeholder="הערות נוספות על העסק"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Service Type Section */}
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
            <h3 className="font-semibold text-lg">מצב התעסוקתי של בן זוגך</h3>

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
      </div>

      {/* User's Business Section */}
      {hasBusiness && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground">פרטי העסק שלך</h2>
          {renderBusinessFields(businessInfo, setBusinessInfo)}
        </div>
      )}

      {/* Spouse's Business Section */}
      {spouseHasBusiness && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground">פרטי העסק של בן/בת הזוג</h2>
          {renderBusinessFields(spouseBusinessInfo, setSpouseBusinessInfo, "spouse_")}
        </div>
      )}

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(1)}
        loading={loading}
        disabled={!serviceType.purposes || serviceType.purposes.length === 0}
      />
    </div>
  );
};
