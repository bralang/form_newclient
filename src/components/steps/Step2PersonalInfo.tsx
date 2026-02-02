import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export const Step2PersonalInfo = () => {
  const {
    personalInfo,
    setPersonalInfo,
    contactInfo,
    setContactInfo,
    serviceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  // קריאת ref מה-URL (לדוגמה: ?ref=עיתון)
  const refFromUrl = useMemo(() => searchParams.get("ref") || "", [searchParams]);

  const hasBusiness = serviceType.purposes?.some((p) =>
    ["new_business", "existing_business", "shareholder"].includes(p)
  );
  const spouseHasBusiness = serviceType.spouseEmploymentStatus === "business_owner";

  const handleNext = async () => {
    console.log("Step2PersonalInfo: Next clicked");
    setLoading(true);

    const payload = {
      ref: refFromUrl,
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        gender: personalInfo.gender,
        idNumber: personalInfo.idNumber,
        birthDate: personalInfo.birthDate,
        maritalStatus: personalInfo.maritalStatus,
        hasChildren: personalInfo.hasChildren,
        numberOfChildren: personalInfo.numberOfChildren ?? null,
        spouseName: personalInfo.spouseName ?? null,
        spouseIdNumber: personalInfo.spouseIdNumber ?? null,
        spouseBirthDate: personalInfo.spouseBirthDate ?? null,
        ref: refFromUrl,
      },
      contactInfo,
      businessBankInfo: {
        hasSeparateBankAccount: businessInfo.hasSeparateBankAccount,
        bankDetails: businessInfo.businessBankDetails,
      },
      spouseBusinessBankInfo: {
        hasSeparateBankAccount: spouseBusinessInfo.hasSeparateBankAccount,
        bankDetails: spouseBusinessInfo.businessBankDetails,
      },
    };

    console.log("Step2PersonalInfo payload to webhook:", JSON.stringify(payload, null, 2));

    const mainOk = await sendToWebhook("https://n8n.link-up.co.il/webhook/client-intake-step2-personal", payload);

    const extraOk = await sendToWebhook("https://n8n.chasida.biz/webhook/client-intake-step2-personal", payload, {
      silent: true,
    });

    setLoading(false);

    if (!extraOk) {
      toast.error("שגיאה בשליחה ל-webhook הנוסף");
    }

    if (mainOk) {
      setCurrentStep(3);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-bold text-foreground">מידע נחוץ כדי להרוויח את השירות שלנו</h2>
        <p className="text-sm text-muted-foreground mt-2">אנא מלא את כל הפרטים בקפידה</p>
      </div>

      {/* Personal Info Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">פרטים אישיים</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">שם פרטי *</Label>
            <Input
              id="firstName"
              value={personalInfo.firstName}
              onChange={(e) => setPersonalInfo({ firstName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">שם משפחה *</Label>
            <Input
              id="lastName"
              value={personalInfo.lastName}
              onChange={(e) => setPersonalInfo({ lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>מגדר *</Label>
          <RadioGroup
            value={personalInfo.gender}
            onValueChange={(value: "male" | "female") => setPersonalInfo({ gender: value })}
            className="flex flex-row-reverse gap-4 justify-end"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male">זכר</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female">נקבה</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="idNumber">מספר זהות *</Label>
            <Input
              id="idNumber"
              value={personalInfo.idNumber}
              onChange={(e) => setPersonalInfo({ idNumber: e.target.value })}
              maxLength={9}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">תאריך לידה *</Label>
            <Input
              id="birthDate"
              type="date"
              value={personalInfo.birthDate}
              onChange={(e) => setPersonalInfo({ birthDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>מצב אישי *</Label>
          <RadioGroup
            value={personalInfo.maritalStatus}
            onValueChange={(value: "single" | "married") => setPersonalInfo({ maritalStatus: value })}
            className="flex flex-row-reverse gap-4 justify-end"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single">יחיד</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="married" id="married" />
              <Label htmlFor="married">בן זוג</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="hasChildren"
              checked={personalInfo.hasChildren}
              onCheckedChange={(checked) => setPersonalInfo({ hasChildren: checked === true })}
            />
            <Label htmlFor="hasChildren">יש לי ילדים</Label>
          </div>

          {personalInfo.hasChildren && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="numberOfChildren">מספר ילדים</Label>
              <Input
                id="numberOfChildren"
                type="number"
                min="0"
                value={personalInfo.numberOfChildren || ""}
                onChange={(e) => setPersonalInfo({ numberOfChildren: parseInt(e.target.value) || undefined })}
              />
            </div>
          )}
        </div>

        {personalInfo.maritalStatus === "married" && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">פרטי בן/בת הזוג</h3>

            <div className="space-y-2">
              <Label htmlFor="spouseName">שם בן/בת הזוג</Label>
              <Input
                id="spouseName"
                value={personalInfo.spouseName || ""}
                onChange={(e) => setPersonalInfo({ spouseName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spouseIdNumber">מספר זהות</Label>
                <Input
                  id="spouseIdNumber"
                  value={personalInfo.spouseIdNumber || ""}
                  onChange={(e) => setPersonalInfo({ spouseIdNumber: e.target.value })}
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouseBirthDate">תאריך לידה</Label>
                <Input
                  id="spouseBirthDate"
                  type="date"
                  value={personalInfo.spouseBirthDate || ""}
                  onChange={(e) => setPersonalInfo({ spouseBirthDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Info Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">פרטי התקשרות</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון נייד *</Label>
            <Input
              id="phone"
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo({ phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">דואר אלקטרוני *</Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email}
              onChange={(e) => setContactInfo({ email: e.target.value })}
              required
            />
          </div>
        </div>


        <div className="flex items-center space-x-2 space-x-reverse">
          <Checkbox
            id="preferPhoneOverEmail"
            checked={contactInfo.preferPhoneOverEmail}
            onCheckedChange={(checked) => setContactInfo({ preferPhoneOverEmail: checked === true })}
          />
          <Label htmlFor="preferPhoneOverEmail">הזמינות שלי למייל נמוכה, מעדיף לקבל הודעות טלפוניות במקום במייל</Label>
        </div>

        {personalInfo.maritalStatus === "married" && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">פרטי התקשרות של בן/בת הזוג</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spousePhone">טלפון</Label>
                <Input
                  id="spousePhone"
                  type="tel"
                  value={contactInfo.spousePhone || ""}
                  onChange={(e) => setContactInfo({ spousePhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouseEmail">דואר אלקטרוני</Label>
                <Input
                  id="spouseEmail"
                  type="email"
                  value={contactInfo.spouseEmail || ""}
                  onChange={(e) => setContactInfo({ spouseEmail: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="homePhone">טלפון בבית</Label>
          <Input
            id="homePhone"
            type="tel"
            value={contactInfo.homePhone || ""}
            onChange={(e) => setContactInfo({ homePhone: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-semibold">כתובת מגורים *</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="street">רחוב *</Label>
              <Input
                id="street"
                value={contactInfo.address?.street || ""}
                onChange={(e) =>
                  setContactInfo({
                    address: { ...contactInfo.address, street: e.target.value } as any,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">מספר *</Label>
              <Input
                id="number"
                value={contactInfo.address?.number || ""}
                onChange={(e) =>
                  setContactInfo({
                    address: { ...contactInfo.address, number: e.target.value } as any,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">עיר *</Label>
              <Input
                id="city"
                value={contactInfo.address?.city || ""}
                onChange={(e) =>
                  setContactInfo({
                    address: { ...contactInfo.address, city: e.target.value } as any,
                  })
                }
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Bank Account Section - for main user */}
      {hasBusiness && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground">חשבון בנק לעסק</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="hasSeparateBankAccount"
                checked={Boolean(businessInfo.hasSeparateBankAccount)}
                onCheckedChange={(checked) => setBusinessInfo({ hasSeparateBankAccount: checked === true })}
              />
              <Label htmlFor="hasSeparateBankAccount">האם יש חשבון בנק נפרד לעסק?</Label>
            </div>

            {businessInfo.hasSeparateBankAccount && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-lg">פרטי חשבון בנק העסק</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessBank">בנק</Label>
                    <Input
                      id="businessBank"
                      value={businessInfo.businessBankDetails?.bank || ""}
                      onChange={(e) =>
                        setBusinessInfo({
                          businessBankDetails: { ...businessInfo.businessBankDetails, bank: e.target.value } as any,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessBranch">סניף</Label>
                    <Input
                      id="businessBranch"
                      value={businessInfo.businessBankDetails?.branch || ""}
                      onChange={(e) =>
                        setBusinessInfo({
                          businessBankDetails: { ...businessInfo.businessBankDetails, branch: e.target.value } as any,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAccountNumber">מספר חשבון</Label>
                    <Input
                      id="businessAccountNumber"
                      value={businessInfo.businessBankDetails?.accountNumber || ""}
                      onChange={(e) =>
                        setBusinessInfo({
                          businessBankDetails: {
                            ...businessInfo.businessBankDetails,
                            accountNumber: e.target.value,
                          } as any,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAccountHolder">שם בעל החשבון</Label>
                    <Input
                      id="businessAccountHolder"
                      value={businessInfo.businessBankDetails?.accountHolder || ""}
                      onChange={(e) =>
                        setBusinessInfo({
                          businessBankDetails: {
                            ...businessInfo.businessBankDetails,
                            accountHolder: e.target.value,
                          } as any,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessBankConfirmationFile">אישור ניהול חשבון / צילום שיק</Label>
                  <Input
                    id="businessBankConfirmationFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setBusinessInfo({ businessBankConfirmationFile: e.target.files?.[0] || undefined })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Bank Account Section - for spouse */}
      {spouseHasBusiness && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground">חשבון בנק לעסק של בן/בת הזוג</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="spouseHasSeparateBankAccount"
                checked={Boolean(spouseBusinessInfo.hasSeparateBankAccount)}
                onCheckedChange={(checked) => setSpouseBusinessInfo({ hasSeparateBankAccount: checked === true })}
              />
              <Label htmlFor="spouseHasSeparateBankAccount">האם יש חשבון בנק נפרד לעסק?</Label>
            </div>

            {spouseBusinessInfo.hasSeparateBankAccount && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-lg">פרטי חשבון בנק העסק של בן/בת הזוג</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spouseBusinessBank">בנק</Label>
                    <Input
                      id="spouseBusinessBank"
                      value={spouseBusinessInfo.businessBankDetails?.bank || ""}
                      onChange={(e) =>
                        setSpouseBusinessInfo({
                          businessBankDetails: { ...spouseBusinessInfo.businessBankDetails, bank: e.target.value } as any,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouseBusinessBranch">סניף</Label>
                    <Input
                      id="spouseBusinessBranch"
                      value={spouseBusinessInfo.businessBankDetails?.branch || ""}
                      onChange={(e) =>
                        setSpouseBusinessInfo({
                          businessBankDetails: { ...spouseBusinessInfo.businessBankDetails, branch: e.target.value } as any,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouseBusinessAccountNumber">מספר חשבון</Label>
                    <Input
                      id="spouseBusinessAccountNumber"
                      value={spouseBusinessInfo.businessBankDetails?.accountNumber || ""}
                      onChange={(e) =>
                        setSpouseBusinessInfo({
                          businessBankDetails: {
                            ...spouseBusinessInfo.businessBankDetails,
                            accountNumber: e.target.value,
                          } as any,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spouseBusinessAccountHolder">שם בעל החשבון</Label>
                    <Input
                      id="spouseBusinessAccountHolder"
                      value={spouseBusinessInfo.businessBankDetails?.accountHolder || ""}
                      onChange={(e) =>
                        setSpouseBusinessInfo({
                          businessBankDetails: {
                            ...spouseBusinessInfo.businessBankDetails,
                            accountHolder: e.target.value,
                          } as any,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spouseBusinessBankConfirmationFile">אישור ניהול חשבון / צילום שיק</Label>
                  <Input
                    id="spouseBusinessBankConfirmationFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setSpouseBusinessInfo({ businessBankConfirmationFile: e.target.files?.[0] || undefined })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preparation Note */}
      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-lg text-foreground mb-2">📋 הכנה לשלב הבא</h3>
        <p className="text-muted-foreground mb-2">
          כדי להתקדם עליך להכין את עצמך לשלב 3 - יש להכין מספר מסמכים בסיסיים אותם יש להעלות לשאלון.
        </p>
        <p className="text-sm text-muted-foreground">
          תוכל לקבל רשימה למייל לפי התשובות שענית איזה מסמכים אתה צריך, וגם תזכורת לטלפון / סיוע מהמזכירה.
        </p>
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(1)}
        loading={loading}
        disabled={
          !personalInfo.firstName ||
          !personalInfo.lastName ||
          !personalInfo.gender ||
          !personalInfo.idNumber ||
          !personalInfo.birthDate ||
          !personalInfo.maritalStatus ||
          !contactInfo.phone ||
          !contactInfo.email ||
          !contactInfo.address?.street ||
          !contactInfo.address?.number ||
          !contactInfo.address?.city
        }
      />
    </div>
  );
};
