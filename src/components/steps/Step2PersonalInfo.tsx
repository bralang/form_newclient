import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { FormNavigation } from "@/components/FormNavigation";
import { Step2BusinessInfo } from "./Step2BusinessInfo";
import { useState, useEffect } from "react";
import { g } from "@/lib/gender-utils";
import { Mail, Phone } from "lucide-react";

export const Step2PersonalInfo = () => {
  const {
    personalInfo,
    detailedInfo,
    setDetailedInfo,
    spouseInfo,
    setSpouseInfo,
    serviceType,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [reminderDate, setReminderDate] = useState("");

  const isMarried = personalInfo.maritalStatus === "married";
  const gender = detailedInfo.gender;
  const hasAnyPurpose =
    serviceType.userPurposes.length > 0 || serviceType.spousePurposes.length > 0;

  // Auto-set spouse gender to opposite
  useEffect(() => {
    if (detailedInfo.gender && !spouseInfo.gender) {
      setSpouseInfo({
        gender: detailedInfo.gender === "male" ? "female" : "male",
      });
    }
  }, [detailedInfo.gender]);

  const maritalOptions = isMarried
    ? [
        { value: "single", label: "רווק/ה" },
        { value: "divorced", label: g(gender, "גרוש", "גרושה") },
        { value: "widowed", label: g(gender, "אלמן", "אלמנה") },
        { value: "separated", label: g(gender, "פרוד", "פרודה") },
        { value: "married", label: g(gender, "נשוי", "נשואה") },
      ]
    : [
        { value: "single", label: "רווק/ה" },
        { value: "divorced", label: g(gender, "גרוש", "גרושה") },
        { value: "widowed", label: g(gender, "אלמן", "אלמנה") },
        { value: "separated", label: g(gender, "פרוד", "פרודה") },
      ];

  const additionalIdOptions = [
    { value: "parentId", label: "ת.ז. הורים" },
    { value: "license", label: "רישיון נהיגה" },
    { value: "passport", label: "דרכון" },
  ];

  const handleNext = async () => {
    setLoading(true);
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/client-intake-step2",
      { personalInfo, detailedInfo, spouseInfo, serviceType },
      { silent: true }
    );
    setLoading(false);
    setCurrentStep(3);
  };

  const handleSendEmailList = async () => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-document-list",
      { email: personalInfo.email, personalInfo, serviceType },
      { silent: false }
    );
  };

  const handleSendReminder = async () => {
    if (!reminderDate) return;
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-reminder",
      { phone: personalInfo.phone, reminderDate, personalInfo, serviceType },
      { silent: false }
    );
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1">
          מידע נחוץ כדי להרוויח את השירות שלנו
        </h2>
        <p className="text-muted-foreground">פרטים שלכם</p>
        <div className="h-1 w-20 bg-primary rounded-full mt-2" />
      </div>

      {/* ─── User Personal Details ─── */}
      <div className="space-y-5">
        <h3 className="text-xl font-bold text-foreground">
          פרטים אישיים – <span className="text-primary">{personalInfo.firstName || "שלי"}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="idNumber">ת.ז. *</Label>
            <Input
              id="idNumber"
              value={detailedInfo.idNumber}
              onChange={(e) => setDetailedInfo({ idNumber: e.target.value })}
              maxLength={9}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homePhone">טלפון בבית</Label>
            <Input
              id="homePhone"
              type="tel"
              value={detailedInfo.homePhone}
              onChange={(e) => setDetailedInfo({ homePhone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>מגדר *</Label>
            <RadioGroup
              value={detailedInfo.gender}
              onValueChange={(v: any) => setDetailedInfo({ gender: v })}
              className="flex flex-row-reverse gap-4 justify-end"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="male" id="genderMale" />
                <Label htmlFor="genderMale">זכר</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="female" id="genderFemale" />
                <Label htmlFor="genderFemale">נקבה</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">תאריך לידה *</Label>
            <Input
              id="birthDate"
              type="date"
              value={detailedInfo.birthDate}
              onChange={(e) => setDetailedInfo({ birthDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">הזמינות שלי</Label>
          <Input
            id="availability"
            value={detailedInfo.availability}
            onChange={(e) => setDetailedInfo({ availability: e.target.value })}
            placeholder="לדוגמה: ימים א-ה 9:00-17:00"
          />
        </div>

        <div className="space-y-2">
          <Label>מצב משפחתי מפורט</Label>
          <RadioGroup
            value={detailedInfo.detailedMaritalStatus}
            onValueChange={(v: any) => setDetailedInfo({ detailedMaritalStatus: v })}
            className="flex flex-wrap flex-row-reverse gap-3 justify-end"
          >
            {maritalOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value={opt.value} id={`marital_${opt.value}`} />
                <Label htmlFor={`marital_${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Additional ID */}
        <div className="space-y-3">
          <Label>אמצעי זיהוי נוסף</Label>
          <RadioGroup
            value={detailedInfo.additionalIdType}
            onValueChange={(v: any) => setDetailedInfo({ additionalIdType: v })}
            className="flex flex-wrap flex-row-reverse gap-3 justify-end"
          >
            {additionalIdOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value={opt.value} id={`addId_${opt.value}`} />
                <Label htmlFor={`addId_${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {detailedInfo.additionalIdType === "parentId" && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="parentIdNum">מספר ת.ז. של ההורה</Label>
              <Input
                id="parentIdNum"
                value={detailedInfo.additionalIdNumber}
                onChange={(e) => setDetailedInfo({ additionalIdNumber: e.target.value })}
              />
            </div>
          )}
          {(detailedInfo.additionalIdType === "license" || detailedInfo.additionalIdType === "passport") && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="addIdNum">
                {detailedInfo.additionalIdType === "license" ? "מספר רישיון" : "מספר דרכון"}
              </Label>
              <Input
                id="addIdNum"
                value={detailedInfo.additionalIdNumber}
                onChange={(e) => setDetailedInfo({ additionalIdNumber: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">העלאת הטפסים תתבצע בשלב 3</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Spouse Personal Details ─── */}
      {isMarried && (
        <div className="space-y-5 pt-6 border-t border-border">
          <h3 className="text-xl font-bold text-foreground">
            פרטים אישיים – <span className="text-primary">{personalInfo.spouseName || "בן/בת הזוג"}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="spouseId">ת.ז. *</Label>
              <Input
                id="spouseId"
                value={spouseInfo.idNumber}
                onChange={(e) => setSpouseInfo({ idNumber: e.target.value })}
                maxLength={9}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouseEmail">מייל</Label>
              <Input
                id="spouseEmail"
                type="email"
                value={spouseInfo.email}
                onChange={(e) => setSpouseInfo({ email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="spousePhone">טלפון</Label>
              <Input
                id="spousePhone"
                type="tel"
                value={spouseInfo.phone}
                onChange={(e) => setSpouseInfo({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>
                מגדר <span className="text-xs text-muted-foreground">(אוטומטי – ניתן לשנות)</span>
              </Label>
              <RadioGroup
                value={spouseInfo.gender}
                onValueChange={(v: any) => setSpouseInfo({ gender: v })}
                className="flex flex-row-reverse gap-4 justify-end"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="male" id="spouseGenderMale" />
                  <Label htmlFor="spouseGenderMale">זכר</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="female" id="spouseGenderFemale" />
                  <Label htmlFor="spouseGenderFemale">נקבה</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Spouse Additional ID */}
          <div className="space-y-3">
            <Label>אמצעי זיהוי נוסף</Label>
            <RadioGroup
              value={spouseInfo.additionalIdType}
              onValueChange={(v: any) => setSpouseInfo({ additionalIdType: v })}
              className="flex flex-wrap flex-row-reverse gap-3 justify-end"
            >
              {additionalIdOptions.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value={opt.value} id={`spouseAddId_${opt.value}`} />
                  <Label htmlFor={`spouseAddId_${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>

            {spouseInfo.additionalIdType === "parentId" && (
              <div className="space-y-2 mr-6">
                <Label htmlFor="spouseParentIdNum">מספר ת.ז. של ההורה</Label>
                <Input
                  id="spouseParentIdNum"
                  value={spouseInfo.additionalIdNumber}
                  onChange={(e) => setSpouseInfo({ additionalIdNumber: e.target.value })}
                />
              </div>
            )}
            {(spouseInfo.additionalIdType === "license" || spouseInfo.additionalIdType === "passport") && (
              <div className="space-y-2 mr-6">
                <Label htmlFor="spouseAddIdNum">
                  {spouseInfo.additionalIdType === "license" ? "מספר רישיון" : "מספר דרכון"}
                </Label>
                <Input
                  id="spouseAddIdNum"
                  value={spouseInfo.additionalIdNumber}
                  onChange={(e) => setSpouseInfo({ additionalIdNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">העלאת הטפסים תתבצע בשלב 3</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="spouseAvailability">הזמינות שלי</Label>
            <Input
              id="spouseAvailability"
              value={spouseInfo.availability}
              onChange={(e) => setSpouseInfo({ availability: e.target.value })}
              placeholder="לדוגמה: ימים א-ה 9:00-17:00"
            />
          </div>
        </div>
      )}

      {/* ─── Business Details Section ─── */}
      {hasAnyPurpose && (
        <div className="pt-8">
          <div className="h-1 bg-gradient-to-l from-primary/40 to-secondary/60 rounded-full mb-8" />
          <Step2BusinessInfo />
        </div>
      )}

      {/* ─── Ending Text for Step 2 ─── */}
      <div className="space-y-5 pt-6 border-t border-border">
        <div className="p-5 bg-primary/5 rounded-xl border border-primary/15">
          <h3 className="font-bold text-lg text-foreground mb-3">
            📋 כדי להתקדם עליך להכין את עצמך לשלב 3
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            ניתן להעלות כאן בשאלון טפסים במיידי, או להשאיר כך את השאלון ולהכין את המסמכים הנדרשים.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={handleSendEmailList}>
              <Mail className="ml-2 h-4 w-4" />
              אני רוצה לקבל רשימה למייל
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSendReminder}>
                <Phone className="ml-2 h-4 w-4" />
                תזכורת לטלפון
              </Button>
              <Input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-40 h-9"
              />
            </div>
          </div>
        </div>
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(1)}
        nextLabel="למעבר להעלאת המסמכים"
        loading={loading}
      />
    </div>
  );
};
