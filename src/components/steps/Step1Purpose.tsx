import { useFormContext } from "@/contexts/FormContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step1Purpose = () => {
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
    console.log("Step1Purpose: Next clicked");
    setLoading(true);
    // Send to webhook silently - don't block progression if it fails
    sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-step1-purpose",
      { serviceType, businessInfo, spouseBusinessInfo },
      { silent: true }
    );
    setLoading(false);
    setCurrentStep(2);
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
          <Label htmlFor={`${prefix}businessField`}>תחום עיסוק</Label>
          <Input
            id={`${prefix}businessField`}
            value={info.businessField || ""}
            onChange={(e) => setInfo({ businessField: e.target.value })}
          />
        </div>
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

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <RadioGroup
          value={info.businessType || ""}
          onValueChange={(value: any) => setInfo({ businessType: value })}
          className="flex flex-wrap flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="exempt" id={`${prefix}exempt`} />
            <Label htmlFor={`${prefix}exempt`}>פטור</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="authorized" id={`${prefix}authorized`} />
            <Label htmlFor={`${prefix}authorized`}>מורשה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="company" id={`${prefix}company`} />
            <Label htmlFor={`${prefix}company`}>חברה</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="nonprofit" id={`${prefix}nonprofit`} />
            <Label htmlFor={`${prefix}nonprofit`}>עמותה</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>האם זה עסק זעיר?</Label>
        <RadioGroup
          value={info.isSmallBusiness === true ? "micro" : info.isSmallBusiness === false ? "regular" : ""}
          onValueChange={(value: any) => setInfo({ isSmallBusiness: value === "micro" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="micro" id={`${prefix}microYes`} />
            <Label htmlFor={`${prefix}microYes`}>כן - עסק זעיר</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="regular" id={`${prefix}microNo`} />
            <Label htmlFor={`${prefix}microNo`}>לא - עסק רגיל</Label>
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
            checked={Boolean(info.isHomeOffice)}
            onCheckedChange={(checked) => setInfo({ isHomeOffice: checked === true })}
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

      <div className="space-y-2">
        <Label>האם זה עסק קטן?</Label>
        <RadioGroup
          value={info.isSmallBusiness ? "yes" : info.isSmallBusiness === false ? "no" : ""}
          onValueChange={(value: any) => setInfo({ isSmallBusiness: value === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id={`${prefix}smallBusinessYes`} />
            <Label htmlFor={`${prefix}smallBusinessYes`}>כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id={`${prefix}smallBusinessNo`} />
            <Label htmlFor={`${prefix}smallBusinessNo`}>לא</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>סוג הבעלות</Label>
        <RadioGroup
          value={info.ownershipType || ""}
          onValueChange={(value: any) => setInfo({ ownershipType: value })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole" id={`${prefix}sole`} />
            <Label htmlFor={`${prefix}sole`}>יחיד</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id={`${prefix}ownershipPartnership`} />
            <Label htmlFor={`${prefix}ownershipPartnership`}>שותפות</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>מה העסק מציע?</Label>
        <RadioGroup
          value={info.businessOffering || ""}
          onValueChange={(value: any) => setInfo({ businessOffering: value })}
          className="flex flex-wrap flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="products" id={`${prefix}products`} />
            <Label htmlFor={`${prefix}products`}>מוצרים</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="services" id={`${prefix}services`} />
            <Label htmlFor={`${prefix}services`}>שירותים</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="both" id={`${prefix}both`} />
            <Label htmlFor={`${prefix}both`}>שניהם</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id={`${prefix}hasEmployees`}
          checked={Boolean(info.hasEmployees)}
          onCheckedChange={(checked) => setInfo({ hasEmployees: checked === true })}
        />
        <Label htmlFor={`${prefix}hasEmployees`}>האם יש עובדים</Label>
      </div>

      <div className="space-y-2">
        <Label>שיטת תיעוד</Label>
        <RadioGroup
          value={info.documentMethod || ""}
          onValueChange={(value: any) => setInfo({ documentMethod: value })}
          className="flex flex-wrap flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="summit" id={`${prefix}summit`} />
            <Label htmlFor={`${prefix}summit`}>סאמיט</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="manual" id={`${prefix}manual`} />
            <Label htmlFor={`${prefix}manual`}>ידני</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="software" id={`${prefix}software`} />
            <Label htmlFor={`${prefix}software`}>תוכנה אחרת</Label>
          </div>
        </RadioGroup>
      </div>

      {info.documentMethod === "software" && (
        <div className="space-y-4 mr-6">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}otherSoftwareName`}>שם התוכנה</Label>
            <Input
              id={`${prefix}otherSoftwareName`}
              value={info.otherSoftwareName || ""}
              onChange={(e) => setInfo({ otherSoftwareName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefix}softwareUsername`}>שם משתמש</Label>
            <Input
              id={`${prefix}softwareUsername`}
              value={info.softwareUsername || ""}
              onChange={(e) => setInfo({ softwareUsername: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefix}softwarePassword`}>סיסמה</Label>
            <Input
              id={`${prefix}softwarePassword`}
              type="password"
              value={info.softwarePassword || ""}
              onChange={(e) => setInfo({ softwarePassword: e.target.value })}
            />
          </div>
        </div>
      )}

      {isNewBusiness && (
        <>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={`${prefix}planningEmployees`}
              checked={Boolean(info.planningEmployees)}
              onCheckedChange={(checked) => setInfo({ planningEmployees: checked === true })}
            />
            <Label htmlFor={`${prefix}planningEmployees`}>מתכנן להעסיק עובדים</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefix}expectedRevenue`}>הכנסה צפויה (בשנה הראשונה)</Label>
            <Input
              id={`${prefix}expectedRevenue`}
              value={info.expectedRevenue || ""}
              onChange={(e) => setInfo({ expectedRevenue: e.target.value })}
              placeholder="לדוגמה: 100,000 ₪"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefix}chosenBusinessName`}>שם העסק שבחרת</Label>
            <Input
              id={`${prefix}chosenBusinessName`}
              value={info.chosenBusinessName || ""}
              onChange={(e) => setInfo({ chosenBusinessName: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Marketing Text */}
      <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/30 rounded-lg">
        <h2 className="text-2xl font-bold text-foreground mb-4">המטרה המשותפת שלנו</h2>
        <p className="text-lg text-muted-foreground mb-2">
          אנחנו כאן כדי לעזור לך להצליח בעסק שלך.
        </p>
        <p className="text-muted-foreground">
          יחד נבנה את הבסיס החזק ביותר לעתיד הפיננסי שלך.
        </p>
        <p className="text-sm text-primary font-medium mt-4">
          🤝 אנחנו כאן לסיוע גם כשגוגלים
        </p>
      </div>

      {/* Purpose Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">לשם מה הגעתם?</h2>

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
        onPrev={() => {}}
        showPrev={false}
        loading={loading}
        disabled={!serviceType.purposes || serviceType.purposes.length === 0}
      />
    </div>
  );
};
