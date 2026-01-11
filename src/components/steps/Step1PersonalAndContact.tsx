import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Step1PersonalAndContact = () => {
  const {
    personalInfo,
    setPersonalInfo,
    contactInfo,
    setContactInfo,
    identificationInfo,
    setIdentificationInfo,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const additionalIdFieldsRef = useRef<HTMLDivElement | null>(null);
  const spouseAdditionalIdFieldsRef = useRef<HTMLDivElement | null>(null);

  const handleNext = async () => {
    console.log("Step1: Next clicked");
    setLoading(true);

    const payload = {
      ref: personalInfo.ref || "",  // תמיד נשלח, גם אם ריק - כמחרוזת ולא null
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
      },
      contactInfo,
      identificationInfo,
    };

    console.log("Step1 payload to webhook:", JSON.stringify(payload, null, 2));

    // 1) ה-webhook המקורי (כמו שהיה)
    const mainOk = await sendToWebhook("https://n8n.link-up.co.il/webhook/client-intake-step1", payload);

    // 2) ה-webhook הנוסף שביקשת (נשלח דרך הפרוקסי כדי להימנע מבעיות CORS)
    const extraOk = await sendToWebhook("https://n8n.chasida.biz/webhook/client-intake-step1", payload, {
      silent: true,
    });

    setLoading(false);

    if (!extraOk) {
      toast.error("שגיאה בשליחה ל-webhook הנוסף");
    }

    if (mainOk) {
      setCurrentStep(2);
    }
  };

  useEffect(() => {
    if (identificationInfo.additionalIdType) {
      additionalIdFieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [identificationInfo.additionalIdType]);

  useEffect(() => {
    if (identificationInfo.spouseAdditionalIdType) {
      spouseAdditionalIdFieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [identificationInfo.spouseAdditionalIdType]);

  return (
    <div className="space-y-8">
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

        <div className="space-y-2">
          <Label htmlFor="ref">מקור הפניה</Label>
          <Input
            id="ref"
            value={personalInfo.ref || ""}
            onChange={(e) => setPersonalInfo({ ref: e.target.value })}
            placeholder="לדוגמה: גוגל, פייסבוק, חבר..."
          />
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
          <Label className="text-lg font-semibold">כתובת מגורים</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="street">רחוב</Label>
              <Input
                id="street"
                value={contactInfo.address?.street || ""}
                onChange={(e) =>
                  setContactInfo({
                    address: { ...contactInfo.address, street: e.target.value } as any,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">מספר</Label>
              <Input
                id="number"
                value={contactInfo.address?.number || ""}
                onChange={(e) =>
                  setContactInfo({
                    address: { ...contactInfo.address, number: e.target.value } as any,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">עיר</Label>
              <Input
                id="city"
                value={contactInfo.address?.city || ""}
                onChange={(e) =>
                  setContactInfo({
                    address: { ...contactInfo.address, city: e.target.value } as any,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Identification Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">מסמכים וזיהוי</h2>

        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">מסמכי זיהוי עיקריים</h3>

          <div className="space-y-2">
            <Label htmlFor="idCardFile">צילום תעודת זהות + ספח *</Label>
            <Input
              id="idCardFile"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdentificationInfo({ idCardFile: e.target.files?.[0] || undefined })}
            />
          </div>

          <div className="space-y-4">
            <Label>אמצעי זיהוי נוסף</Label>
            <RadioGroup
              value={identificationInfo.additionalIdType ?? ""}
              onValueChange={(value: any) =>
                setIdentificationInfo({ additionalIdType: value === "" ? undefined : value })
              }
              className="space-y-3"
            >
              <div
                className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                onClick={() => setIdentificationInfo({ additionalIdType: "parentId" })}
              >
                <RadioGroupItem value="parentId" id="parentId" />
                <Label htmlFor="parentId" className="cursor-pointer">
                  מספר זהות של אחד ההורים
                </Label>
              </div>
              <div
                className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                onClick={() => setIdentificationInfo({ additionalIdType: "license" })}
              >
                <RadioGroupItem value="license" id="license" />
                <Label htmlFor="license" className="cursor-pointer">
                  רישיון נהיגה
                </Label>
              </div>
              <div
                className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                onClick={() => setIdentificationInfo({ additionalIdType: "passport" })}
              >
                <RadioGroupItem value="passport" id="passport" />
                <Label htmlFor="passport" className="cursor-pointer">
                  דרכון ישראלי
                </Label>
              </div>
            </RadioGroup>

            {identificationInfo.additionalIdType && (
              <div ref={additionalIdFieldsRef} className="space-y-4 mr-6">
                <div className="space-y-2">
                  <Label htmlFor="additionalIdNumber">מספר</Label>
                  <Input
                    id="additionalIdNumber"
                    value={identificationInfo.additionalIdNumber || ""}
                    onChange={(e) => setIdentificationInfo({ additionalIdNumber: e.target.value })}
                  />
                </div>

                {identificationInfo.additionalIdType !== "parentId" && (
                  <div className="space-y-2">
                    <Label htmlFor="additionalIdFile">העלאת קובץ</Label>
                    <Input
                      id="additionalIdFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setIdentificationInfo({ additionalIdFile: e.target.files?.[0] || undefined })}
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
                onChange={(e) => setIdentificationInfo({ spouseIdCardFile: e.target.files?.[0] || undefined })}
              />
            </div>

            <div className="space-y-4">
              <Label>אמצעי זיהוי נוסף</Label>
              <RadioGroup
                value={identificationInfo.spouseAdditionalIdType ?? ""}
                onValueChange={(value: any) =>
                  setIdentificationInfo({ spouseAdditionalIdType: value === "" ? undefined : value })
                }
                className="space-y-3"
              >
                <div
                  className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                  onClick={() => setIdentificationInfo({ spouseAdditionalIdType: "parentId" })}
                >
                  <RadioGroupItem value="parentId" id="spouseParentId" />
                  <Label htmlFor="spouseParentId" className="cursor-pointer">
                    מספר זהות של אחד ההורים
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                  onClick={() => setIdentificationInfo({ spouseAdditionalIdType: "license" })}
                >
                  <RadioGroupItem value="license" id="spouseLicense" />
                  <Label htmlFor="spouseLicense" className="cursor-pointer">
                    רישיון נהיגה
                  </Label>
                </div>
                <div
                  className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                  onClick={() => setIdentificationInfo({ spouseAdditionalIdType: "passport" })}
                >
                  <RadioGroupItem value="passport" id="spousePassport" />
                  <Label htmlFor="spousePassport" className="cursor-pointer">
                    דרכון ישראלי
                  </Label>
                </div>
              </RadioGroup>

              {identificationInfo.spouseAdditionalIdType && (
                <div ref={spouseAdditionalIdFieldsRef} className="space-y-4 mr-6">
                  <div className="space-y-2">
                    <Label htmlFor="spouseAdditionalIdNumber">מספר</Label>
                    <Input
                      id="spouseAdditionalIdNumber"
                      value={identificationInfo.spouseAdditionalIdNumber || ""}
                      onChange={(e) => setIdentificationInfo({ spouseAdditionalIdNumber: e.target.value })}
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
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => {}}
        showPrev={false}
        loading={loading}
        disabled={
          !personalInfo.firstName ||
          !personalInfo.lastName ||
          !personalInfo.gender ||
          !personalInfo.idNumber ||
          !personalInfo.birthDate ||
          !personalInfo.maritalStatus ||
          !contactInfo.phone ||
          !contactInfo.email
        }
      />
    </div>
  );
};
