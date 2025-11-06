import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step5Business = () => {
  const { businessInfo, setBusinessInfo, serviceType, setCurrentStep, sendToWebhook } =
    useFormContext();
  const [loading, setLoading] = useState(false);

  const isNewBusiness = serviceType.purposes?.includes("new_business");

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-business-info",
      businessInfo
    );
    setLoading(false);
    if (success) {
      const spouseHasBusiness = serviceType.spouseEmploymentStatus === "business_owner";
      if (spouseHasBusiness) {
        setCurrentStep(6);
      } else {
        setCurrentStep(7);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">פרטי העסק</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="businessName">שם העסק</Label>
          <Input
            id="businessName"
            value={businessInfo.businessName || ""}
            onChange={(e) => setBusinessInfo({ businessName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessField">תחום עיסוק</Label>
          <Input
            id="businessField"
            value={businessInfo.businessField || ""}
            onChange={(e) => setBusinessInfo({ businessField: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <RadioGroup
          value={businessInfo.businessType || ""}
          onValueChange={(value: any) => setBusinessInfo({ businessType: value })}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="exempt" id="exempt" />
            <Label htmlFor="exempt">עוסק פטור</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="authorized" id="authorized" />
            <Label htmlFor="authorized">עוסק מורשה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="company" id="company" />
            <Label htmlFor="company">חברה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="association" id="association" />
            <Label htmlFor="association">עמותה</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id="isSmallBusiness"
          checked={businessInfo.isSmallBusiness}
          onCheckedChange={(checked) => setBusinessInfo({ isSmallBusiness: checked as boolean })}
        />
        <Label htmlFor="isSmallBusiness">עוסק זעיר</Label>
      </div>

      <div className="space-y-2">
        <Label>סוג בעלות</Label>
        <RadioGroup
          value={businessInfo.ownershipType || ""}
          onValueChange={(value: any) => setBusinessInfo({ ownershipType: value })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole" id="sole" />
            <Label htmlFor="sole">בעלים יחיד</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id="partnership" />
            <Label htmlFor="partnership">שותפות</Label>
          </div>
        </RadioGroup>
      </div>

      {businessInfo.businessType === "company" && (
        <div className="space-y-2">
          <Label htmlFor="companyRegistrationFile">נסח חברה</Label>
          <Input
            id="companyRegistrationFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setBusinessInfo({ companyRegistrationFile: e.target.files?.[0] || undefined })
            }
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="isHomeOffice"
            checked={businessInfo.isHomeOffice}
            onCheckedChange={(checked) => setBusinessInfo({ isHomeOffice: checked as boolean })}
          />
          <Label htmlFor="isHomeOffice">העסק מתנהל מהבית</Label>
        </div>

        {businessInfo.isHomeOffice === false && (
          <div className="space-y-4 mr-6">
            <Label className="text-lg font-semibold">כתובת העסק</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessStreet">רחוב</Label>
                <Input
                  id="businessStreet"
                  value={businessInfo.businessAddress?.street || ""}
                  onChange={(e) =>
                    setBusinessInfo({
                      businessAddress: {
                        ...businessInfo.businessAddress,
                        street: e.target.value,
                      } as any,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessNumber">מספר</Label>
                <Input
                  id="businessNumber"
                  value={businessInfo.businessAddress?.number || ""}
                  onChange={(e) =>
                    setBusinessInfo({
                      businessAddress: {
                        ...businessInfo.businessAddress,
                        number: e.target.value,
                      } as any,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCity">עיר</Label>
                <Input
                  id="businessCity"
                  value={businessInfo.businessAddress?.city || ""}
                  onChange={(e) =>
                    setBusinessInfo({
                      businessAddress: { ...businessInfo.businessAddress, city: e.target.value } as any,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaseAgreementFile">הסכם שכירות</Label>
              <Input
                id="leaseAgreementFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setBusinessInfo({ leaseAgreementFile: e.target.files?.[0] || undefined })
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>העסק נותן שירות או מוכר מוצרים?</Label>
        <RadioGroup
          value={businessInfo.businessModel || ""}
          onValueChange={(value: any) => setBusinessInfo({ businessModel: value })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="service" id="service" />
            <Label htmlFor="service">שירות</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="products" id="products" />
            <Label htmlFor="products">מוצרים</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id="hasEmployees"
          checked={businessInfo.hasEmployees}
          onCheckedChange={(checked) => setBusinessInfo({ hasEmployees: checked as boolean })}
        />
        <Label htmlFor="hasEmployees">העסק מעסיק עובדים</Label>
      </div>

      <div className="space-y-4">
        <Label>איך מופקים מסמכים בעסק?</Label>
        <RadioGroup
          value={businessInfo.documentSystem || ""}
          onValueChange={(value: any) => setBusinessInfo({ documentSystem: value })}
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="summit" id="summit" />
            <Label htmlFor="summit">סאמיט</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">ידני</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other">תוכנה אחרת</Label>
          </div>
        </RadioGroup>

        {businessInfo.documentSystem === "other" && (
          <div className="space-y-4 mr-6">
            <div className="space-y-2">
              <Label htmlFor="otherSystemName">שם התוכנה</Label>
              <Input
                id="otherSystemName"
                value={businessInfo.otherSystemName || ""}
                onChange={(e) => setBusinessInfo({ otherSystemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherSystemUsername">שם משתמש</Label>
              <Input
                id="otherSystemUsername"
                value={businessInfo.otherSystemUsername || ""}
                onChange={(e) => setBusinessInfo({ otherSystemUsername: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherSystemPassword">סיסמה</Label>
              <Input
                id="otherSystemPassword"
                type="password"
                value={businessInfo.otherSystemPassword || ""}
                onChange={(e) => setBusinessInfo({ otherSystemPassword: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {isNewBusiness && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">פרטים נוספים לעסק חדש</h3>

          <div className="space-y-2">
            <Label htmlFor="startDate">תאריך תחילת פעילות</Label>
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
            <Label htmlFor="planningEmployees">מתכנן/ת להעסיק עובדים</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedRevenue">מחזור צפוי (בשקלים)</Label>
            <Input
              id="expectedRevenue"
              type="number"
              value={businessInfo.expectedRevenue || ""}
              onChange={(e) => setBusinessInfo({ expectedRevenue: e.target.value })}
            />
          </div>
        </div>
      )}

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(4)}
        loading={loading}
      />
    </div>
  );
};
