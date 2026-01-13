import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  
  // קריאת ref מה-URL (לדוגמה: ?ref=עיתון)
  const refFromUrl = useMemo(() => searchParams.get("ref") || "", [searchParams]);

  const handleNext = async () => {
    console.log("Step1: Next clicked");
    setLoading(true);

    const payload = {
      ref: refFromUrl,  // נקרא מה-URL בלבד
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
        ref: refFromUrl,  // גם כאן למקרה ש-n8n מחפש בתוך personalInfo
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

      {/* Identification Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">מסמכים וזיהוי</h2>

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
          !contactInfo.email ||
          !contactInfo.address?.street ||
          !contactInfo.address?.number ||
          !contactInfo.address?.city
        }
      />
    </div>
  );
};
