import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step6SpouseBusiness = () => {
  const { spouseBusinessInfo, setSpouseBusinessInfo, setCurrentStep, sendToWebhook } =
    useFormContext();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-spouse-business",
      spouseBusinessInfo
    );
    setLoading(false);
    if (success) {
      setCurrentStep(7);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">פרטי עסק בן/בת הזוג</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="spouseBusinessName">שם העסק</Label>
          <Input
            id="spouseBusinessName"
            value={spouseBusinessInfo.businessName || ""}
            onChange={(e) => setSpouseBusinessInfo({ businessName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spouseBusinessField">תחום עיסוק</Label>
          <Input
            id="spouseBusinessField"
            value={spouseBusinessInfo.businessField || ""}
            onChange={(e) => setSpouseBusinessInfo({ businessField: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <RadioGroup
          value={spouseBusinessInfo.businessType || ""}
          onValueChange={(value: any) => setSpouseBusinessInfo({ businessType: value })}
          className="flex flex-wrap flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="exempt" id="spouse_exempt" />
            <Label htmlFor="spouse_exempt">עוסק פטור</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="authorized" id="spouse_authorized" />
            <Label htmlFor="spouse_authorized">עוסק מורשה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="company" id="spouse_company" />
            <Label htmlFor="spouse_company">חברה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="association" id="spouse_association" />
            <Label htmlFor="spouse_association">עמותה</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id="spouseIsSmallBusiness"
          checked={spouseBusinessInfo.isSmallBusiness}
          onCheckedChange={(checked) =>
            setSpouseBusinessInfo({ isSmallBusiness: checked as boolean })
          }
        />
        <Label htmlFor="spouseIsSmallBusiness">עוסק זעיר</Label>
      </div>

      <div className="space-y-2">
        <Label>סוג בעלות</Label>
        <RadioGroup
          value={spouseBusinessInfo.ownershipType || ""}
          onValueChange={(value: any) => setSpouseBusinessInfo({ ownershipType: value })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole" id="spouse_sole" />
            <Label htmlFor="spouse_sole">בעלים יחיד</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id="spouse_partnership" />
            <Label htmlFor="spouse_partnership">שותפות</Label>
          </div>
        </RadioGroup>
      </div>

      {spouseBusinessInfo.businessType === "company" && (
        <div className="space-y-2">
          <Label htmlFor="spouseCompanyRegistrationFile">נסח חברה</Label>
          <Input
            id="spouseCompanyRegistrationFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setSpouseBusinessInfo({ companyRegistrationFile: e.target.files?.[0] || undefined })
            }
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="spouseIsHomeOffice"
            checked={spouseBusinessInfo.isHomeOffice}
            onCheckedChange={(checked) =>
              setSpouseBusinessInfo({ isHomeOffice: checked as boolean })
            }
          />
          <Label htmlFor="spouseIsHomeOffice">העסק מתנהל מהבית</Label>
        </div>

        {spouseBusinessInfo.isHomeOffice === false && (
          <div className="space-y-4 mr-6">
            <Label className="text-lg font-semibold">כתובת העסק</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spouseBusinessStreet">רחוב</Label>
                <Input
                  id="spouseBusinessStreet"
                  value={spouseBusinessInfo.businessAddress?.street || ""}
                  onChange={(e) =>
                    setSpouseBusinessInfo({
                      businessAddress: {
                        ...spouseBusinessInfo.businessAddress,
                        street: e.target.value,
                      } as any,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouseBusinessNumber">מספר</Label>
                <Input
                  id="spouseBusinessNumber"
                  value={spouseBusinessInfo.businessAddress?.number || ""}
                  onChange={(e) =>
                    setSpouseBusinessInfo({
                      businessAddress: {
                        ...spouseBusinessInfo.businessAddress,
                        number: e.target.value,
                      } as any,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouseBusinessCity">עיר</Label>
                <Input
                  id="spouseBusinessCity"
                  value={spouseBusinessInfo.businessAddress?.city || ""}
                  onChange={(e) =>
                    setSpouseBusinessInfo({
                      businessAddress: {
                        ...spouseBusinessInfo.businessAddress,
                        city: e.target.value,
                      } as any,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spouseLeaseAgreementFile">הסכם שכירות</Label>
              <Input
                id="spouseLeaseAgreementFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setSpouseBusinessInfo({ leaseAgreementFile: e.target.files?.[0] || undefined })
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>העסק נותן שירות או מוכר מוצרים?</Label>
        <RadioGroup
          value={spouseBusinessInfo.businessModel || ""}
          onValueChange={(value: any) => setSpouseBusinessInfo({ businessModel: value })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="service" id="spouse_service" />
            <Label htmlFor="spouse_service">שירות</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="products" id="spouse_products" />
            <Label htmlFor="spouse_products">מוצרים</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id="spouseHasEmployees"
          checked={spouseBusinessInfo.hasEmployees}
          onCheckedChange={(checked) => setSpouseBusinessInfo({ hasEmployees: checked as boolean })}
        />
        <Label htmlFor="spouseHasEmployees">העסק מעסיק עובדים</Label>
      </div>

      <div className="space-y-4">
        <Label>איך מופקים מסמכים בעסק?</Label>
        <RadioGroup
          value={spouseBusinessInfo.documentSystem || ""}
          onValueChange={(value: any) => setSpouseBusinessInfo({ documentSystem: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="summit" id="spouse_summit" />
            <Label htmlFor="spouse_summit">סאמיט</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="manual" id="spouse_manual" />
            <Label htmlFor="spouse_manual">ידני</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="other" id="spouse_other" />
            <Label htmlFor="spouse_other">תוכנה אחרת</Label>
          </div>
        </RadioGroup>

        {spouseBusinessInfo.documentSystem === "other" && (
          <div className="space-y-4 mr-6">
            <div className="space-y-2">
              <Label htmlFor="spouseOtherSystemName">שם התוכנה</Label>
              <Input
                id="spouseOtherSystemName"
                value={spouseBusinessInfo.otherSystemName || ""}
                onChange={(e) => setSpouseBusinessInfo({ otherSystemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouseOtherSystemUsername">שם משתמש</Label>
              <Input
                id="spouseOtherSystemUsername"
                value={spouseBusinessInfo.otherSystemUsername || ""}
                onChange={(e) => setSpouseBusinessInfo({ otherSystemUsername: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouseOtherSystemPassword">סיסמה</Label>
              <Input
                id="spouseOtherSystemPassword"
                type="password"
                value={spouseBusinessInfo.otherSystemPassword || ""}
                onChange={(e) => setSpouseBusinessInfo({ otherSystemPassword: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <FormNavigation onNext={handleNext} onPrev={() => setCurrentStep(5)} loading={loading} />
    </div>
  );
};
