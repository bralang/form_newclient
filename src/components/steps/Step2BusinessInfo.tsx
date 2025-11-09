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
      "https://n8n.chasida.biz/webhook/client-intake-step2",
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}businessField`}>תחום עיסוק</Label>
          <Input
            id={`${prefix}businessField`}
            value={info.businessField || ""}
            onChange={(e) => setInfo({ businessField: e.target.value })}
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
            <RadioGroupItem value="exempt" id={`${prefix}exempt`} />
            <Label htmlFor={`${prefix}exempt`}>עוסק פטור</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="authorized" id={`${prefix}authorized`} />
            <Label htmlFor={`${prefix}authorized`}>עוסק מורשה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="company" id={`${prefix}company`} />
            <Label htmlFor={`${prefix}company`}>חברה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="association" id={`${prefix}association`} />
            <Label htmlFor={`${prefix}association`}>עמותה</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id={`${prefix}isSmallBusiness`}
          checked={info.isSmallBusiness}
          onCheckedChange={(checked) => setInfo({ isSmallBusiness: checked as boolean })}
        />
        <Label htmlFor={`${prefix}isSmallBusiness`}>עוסק זעיר</Label>
      </div>

      <div className="space-y-2">
        <Label>סוג בעלות</Label>
        <RadioGroup
          value={info.ownershipType || ""}
          onValueChange={(value: any) => setInfo({ ownershipType: value })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole" id={`${prefix}sole`} />
            <Label htmlFor={`${prefix}sole`}>בעלים יחיד</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id={`${prefix}partnership`} />
            <Label htmlFor={`${prefix}partnership`}>שותפות</Label>
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
                <Label htmlFor={`${prefix}businessNumber`}>מספר</Label>
                <Input
                  id={`${prefix}businessNumber`}
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

      <div className="space-y-2">
        <Label>העסק נותן שירות או מוכר מוצרים?</Label>
        <RadioGroup
          value={info.businessModel || ""}
          onValueChange={(value: any) => setInfo({ businessModel: value })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="service" id={`${prefix}service`} />
            <Label htmlFor={`${prefix}service`}>שירות</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="products" id={`${prefix}products`} />
            <Label htmlFor={`${prefix}products`}>מוצרים</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id={`${prefix}hasEmployees`}
          checked={info.hasEmployees}
          onCheckedChange={(checked) => setInfo({ hasEmployees: checked as boolean })}
        />
        <Label htmlFor={`${prefix}hasEmployees`}>העסק מעסיק עובדים</Label>
      </div>

      <div className="space-y-4">
        <Label>איך מופקים מסמכים בעסק?</Label>
        <RadioGroup
          value={info.documentSystem || ""}
          onValueChange={(value: any) => setInfo({ documentSystem: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="summit" id={`${prefix}summit`} />
            <Label htmlFor={`${prefix}summit`}>
              סאמיט - התוכנה המומלצת על ידינו
              {info.documentSystem === "summit" && (
                <span className="block text-sm text-muted-foreground mt-1">
                  אני מעונין להעביר את הפעילות שלי לסאמיט כדי להנות מהתממשקות למערכת הנה"ח שבמשרד
                </span>
              )}
            </Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="manual" id={`${prefix}manual`} />
            <Label htmlFor={`${prefix}manual`}>ידני</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="other" id={`${prefix}other`} />
            <Label htmlFor={`${prefix}other`}>תוכנה אחרת</Label>
          </div>
        </RadioGroup>

        {info.documentSystem === "other" && (
          <div className="space-y-4 mr-6">
            <div className="space-y-2">
              <Label htmlFor={`${prefix}otherSystemName`}>שם התוכנה</Label>
              <Input
                id={`${prefix}otherSystemName`}
                value={info.otherSystemName || ""}
                onChange={(e) => setInfo({ otherSystemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}otherSystemUsername`}>שם משתמש</Label>
              <Input
                id={`${prefix}otherSystemUsername`}
                value={info.otherSystemUsername || ""}
                onChange={(e) => setInfo({ otherSystemUsername: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}otherSystemPassword`}>סיסמה</Label>
              <Input
                id={`${prefix}otherSystemPassword`}
                type="password"
                value={info.otherSystemPassword || ""}
                onChange={(e) => setInfo({ otherSystemPassword: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {isNewBusiness && !prefix && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">פרטים נוספים לעסק חדש</h3>

          <div className="space-y-2">
            <Label htmlFor="startDate">מתי התחילה הפעילות העסקית</Label>
            <Input
              id="startDate"
              type="date"
              value={businessInfo.startDate || ""}
              onChange={(e) => setBusinessInfo({ startDate: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="planningEmployees"
              checked={businessInfo.planningEmployees}
              onCheckedChange={(checked) =>
                setBusinessInfo({ planningEmployees: checked as boolean })
              }
            />
            <Label htmlFor="planningEmployees">האם מתכנן עובדים</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedRevenue">מה המחזור הצפוי בעסק השנה</Label>
            <Input
              id="expectedRevenue"
              type="number"
              value={businessInfo.expectedRevenue || ""}
              onChange={(e) => setBusinessInfo({ expectedRevenue: e.target.value })}
              placeholder="בשקלים"
            />
          </div>
        </div>
      )}
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
