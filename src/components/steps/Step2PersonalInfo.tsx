import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormNavigation } from "@/components/FormNavigation";
import { Step2BusinessInfo } from "./Step2BusinessInfo";
import { useState, useEffect } from "react";
import { g } from "@/lib/gender-utils";
import { Mail, Phone } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [reminderTime, setReminderTime] = useState("");
  const [emailReminderTime, setEmailReminderTime] = useState("");

  const isMarried = personalInfo.maritalStatus === "married";
  const gender = detailedInfo.gender;
  const hasAnyPurpose =
    serviceType.userPurposes.length > 0 || serviceType.spousePurposes.length > 0;

  // If the only purpose the user has is opening a NEW nonprofit, skip personal ID/marital fields
  const userOnlyNewNonprofit =
    serviceType.userPurposes.length === 1 &&
    serviceType.userPurposes[0] === "nonprofit" &&
    (serviceType.userPurposeStatus?.nonprofit || []).length === 1 &&
    (serviceType.userPurposeStatus?.nonprofit || [])[0] === "new";

  // Gov portal identification is relevant only for company purposes (nonprofit handled per board member)
  const userNeedsGovPortal =
    serviceType.userPurposes.includes("company");
  const spouseNeedsGovPortal =
    serviceType.spousePurposes.includes("company");

  const govPortalOptions: { value: "password" | "smartCard" | "biometricId" | "fastLogin"; label: string; icon: string; desc?: string }[] = [
    { value: "password", label: "סיסמא", icon: "🔑" },
    { value: "smartCard", label: "כרטיס חכם", icon: "💳" },
    { value: "biometricId", label: "תעודת זהות ביומטרית", icon: "🪪" },
    { value: "fastLogin", label: "כניסה מהירה (ביומטרי)", icon: "👆", desc: "כניסה ללא סיסמה בעזרת זיהוי ביומטרי מטלפון חכם" },
  ];

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
    { value: "parentId", label: "מס׳ זהות של הורה" },
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
    setCurrentStep(4);
  };

  const handleSendEmailList = async () => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-document-list",
      { email: personalInfo.email, personalInfo, serviceType },
      { silent: false }
    );
  };

  const handleSendReminder = async () => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-reminder",
      { phone: personalInfo.phone, reminderTime: reminderTime || undefined, personalInfo, serviceType },
      { silent: false }
    );
  };

  const handleSendEmailReminder = async () => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/send-email-reminder",
      { email: personalInfo.email, reminderTime: emailReminderTime || undefined, personalInfo, serviceType },
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
            <Select
              value={detailedInfo.gender}
              onValueChange={(v: any) => setDetailedInfo({ gender: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מגדר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">זכר</SelectItem>
                <SelectItem value="female">נקבה</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex items-start gap-3">
            <Checkbox
              id="availability"
              checked={detailedInfo.availability === "low_email"}
              onCheckedChange={(checked) =>
                setDetailedInfo({ availability: checked ? "low_email" : "" })
              }
            />
            <div>
              <Label htmlFor="availability" className="cursor-pointer">
                הזמינות שלי למייל נמוכה, {g(gender, "מעדיף", "מעדיפה")} לקבל הודעות ממערכת טלפונית במקום במייל
              </Label>
              <p className="text-xs text-muted-foreground mt-1">שים לב! כרגע בפיתוח עדיין לא בשימוש מידי.</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>מצב משפחתי מפורט</Label>
          <Select
            value={detailedInfo.detailedMaritalStatus}
            onValueChange={(v: any) => setDetailedInfo({ detailedMaritalStatus: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר מצב משפחתי" />
            </SelectTrigger>
            <SelectContent>
              {maritalOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional ID - multi-select */}
        <div className="space-y-3">
          <Label>אמצעי זיהוי נוסף *</Label>
          <div className="flex flex-wrap flex-row-reverse gap-3 justify-end">
            {additionalIdOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`addId_${opt.value}`}
                  checked={detailedInfo.additionalIdTypes.includes(opt.value as any)}
                  onCheckedChange={(checked) => {
                    const current = detailedInfo.additionalIdTypes || [];
                    const updated = checked
                      ? [...current, opt.value]
                      : current.filter((v) => v !== opt.value);
                    setDetailedInfo({ additionalIdTypes: updated as any });
                  }}
                />
                <Label htmlFor={`addId_${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </div>

          {detailedInfo.additionalIdTypes.includes("parentId") && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="parentIdNum">מס׳ זהות של הורה</Label>
              <Input
                id="parentIdNum"
                value={detailedInfo.additionalIdNumber}
                onChange={(e) => setDetailedInfo({ additionalIdNumber: e.target.value })}
              />
            </div>
          )}
          {detailedInfo.additionalIdTypes.includes("license") && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="licenseNum">מספר רישיון</Label>
              <Input
                id="licenseNum"
                value={detailedInfo.additionalLicenseNumber}
                onChange={(e) => setDetailedInfo({ additionalLicenseNumber: e.target.value })}
              />
            </div>
          )}
          {detailedInfo.additionalIdTypes.includes("passport") && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="passportNum">מספר דרכון</Label>
              <Input
                id="passportNum"
                value={detailedInfo.additionalPassportNumber}
                onChange={(e) => setDetailedInfo({ additionalPassportNumber: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Gov portal identification — only for company / nonprofit */}
        {userNeedsGovPortal && (
          <div className="space-y-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
            <Label className="text-lg font-bold text-primary block">
              🔐 אופן הזדהות לאזור האישי הממשלתי (אופציונלי)
            </Label>
            <p className="text-sm text-muted-foreground">
              נדרש לטיפול בחברות / עמותות. ניתן לסמן יותר מאפשרות אחת.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {govPortalOptions.map((opt) => {
                const checked = (detailedInfo.govPortalIdMethods || []).includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    htmlFor={`govId_${opt.value}`}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <Checkbox
                      id={`govId_${opt.value}`}
                      checked={checked}
                      onCheckedChange={(c) => {
                        const current = detailedInfo.govPortalIdMethods || [];
                        const updated = c
                          ? [...current, opt.value]
                          : current.filter((v) => v !== opt.value);
                        setDetailedInfo({ govPortalIdMethods: updated as any });
                      }}
                      className="mt-0.5"
                    />
                    <span className="text-xl leading-tight">{opt.icon}</span>
                    <span className="flex flex-col">
                      <span className="text-base font-bold">{opt.label}</span>
                      {opt.desc && <span className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {(detailedInfo.govPortalIdMethods || []).includes("password") && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="govPortalPassword">סיסמא לאזור האישי הממשלתי</Label>
                <Input
                  id="govPortalPassword"
                  type="password"
                  value={detailedInfo.govPortalPassword || ""}
                  onChange={(e) => setDetailedInfo({ govPortalPassword: e.target.value })}
                  placeholder="לא חובה למילוי"
                />
              </div>
            )}
          </div>
        )}
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
              <Label>מגדר</Label>
              <Select
                value={spouseInfo.gender}
                onValueChange={(v: any) => setSpouseInfo({ gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מגדר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">זכר</SelectItem>
                  <SelectItem value="female">נקבה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spouse Additional ID - multi-select */}
          <div className="space-y-3">
            <Label>אמצעי זיהוי נוסף *</Label>
            <div className="flex flex-wrap flex-row-reverse gap-3 justify-end">
              {additionalIdOptions.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`spouseAddId_${opt.value}`}
                    checked={spouseInfo.additionalIdTypes.includes(opt.value as any)}
                    onCheckedChange={(checked) => {
                      const current = spouseInfo.additionalIdTypes || [];
                      const updated = checked
                        ? [...current, opt.value]
                        : current.filter((v) => v !== opt.value);
                      setSpouseInfo({ additionalIdTypes: updated as any });
                    }}
                  />
                  <Label htmlFor={`spouseAddId_${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </div>

            {spouseInfo.additionalIdTypes.includes("parentId") && (
              <div className="space-y-2 mr-6">
                <Label htmlFor="spouseParentIdNum">מס׳ זהות של הורה</Label>
                <Input
                  id="spouseParentIdNum"
                  value={spouseInfo.additionalIdNumber}
                  onChange={(e) => setSpouseInfo({ additionalIdNumber: e.target.value })}
                />
              </div>
            )}
            {spouseInfo.additionalIdTypes.includes("license") && (
              <div className="space-y-2 mr-6">
                <Label htmlFor="spouseLicenseNum">מספר רישיון</Label>
                <Input
                  id="spouseLicenseNum"
                  value={spouseInfo.additionalLicenseNumber}
                  onChange={(e) => setSpouseInfo({ additionalLicenseNumber: e.target.value })}
                />
              </div>
            )}
            {spouseInfo.additionalIdTypes.includes("passport") && (
              <div className="space-y-2 mr-6">
                <Label htmlFor="spousePassportNum">מספר דרכון</Label>
                <Input
                  id="spousePassportNum"
                  value={spouseInfo.additionalPassportNumber}
                  onChange={(e) => setSpouseInfo({ additionalPassportNumber: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="spouseAvailability"
                checked={spouseInfo.availability === "low_email"}
                onCheckedChange={(checked) =>
                  setSpouseInfo({ availability: checked ? "low_email" : "" })
                }
              />
              <div>
                <Label htmlFor="spouseAvailability" className="cursor-pointer">
                  הזמינות שלי למייל נמוכה, {g(spouseInfo.gender, "מעדיף", "מעדיפה")} לקבל הודעות ממערכת טלפונית במקום במייל
                </Label>
                <p className="text-xs text-muted-foreground mt-1">שים לב! כרגע בפיתוח עדיין לא בשימוש מידי.</p>
              </div>
            </div>
          </div>

          {/* Gov portal identification — spouse, only for company / nonprofit */}
          {spouseNeedsGovPortal && (
            <div className="space-y-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
              <Label className="text-lg font-bold text-primary block">
                🔐 אופן הזדהות לאזור האישי הממשלתי – {personalInfo.spouseName || "בן/בת הזוג"} (אופציונלי)
              </Label>
              <p className="text-sm text-muted-foreground">
                נדרש לטיפול בחברות / עמותות. ניתן לסמן יותר מאפשרות אחת.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {govPortalOptions.map((opt) => {
                  const checked = (spouseInfo.govPortalIdMethods || []).includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      htmlFor={`spouseGovId_${opt.value}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <Checkbox
                        id={`spouseGovId_${opt.value}`}
                        checked={checked}
                        onCheckedChange={(c) => {
                          const current = spouseInfo.govPortalIdMethods || [];
                          const updated = c
                            ? [...current, opt.value]
                            : current.filter((v) => v !== opt.value);
                          setSpouseInfo({ govPortalIdMethods: updated as any });
                        }}
                        className="mt-0.5"
                      />
                      <span className="text-xl leading-tight">{opt.icon}</span>
                      <span className="flex flex-col">
                        <span className="text-base font-bold">{opt.label}</span>
                        {opt.desc && <span className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              {(spouseInfo.govPortalIdMethods || []).includes("password") && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="spouseGovPortalPassword">סיסמא לאזור האישי הממשלתי</Label>
                  <Input
                    id="spouseGovPortalPassword"
                    type="password"
                    value={spouseInfo.govPortalPassword || ""}
                    onChange={(e) => setSpouseInfo({ govPortalPassword: e.target.value })}
                    placeholder="לא חובה למילוי"
                  />
                </div>
              )}
            </div>
          )}
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
            📋 כדי להתקדם עליך להכין את עצמך לשלב 4
          </h3>
          <p className="text-muted-foreground text-sm mb-3">
            ניתן להעלות כאן בשאלון טפסים במיידי, או להשאיר כך את השאלון ולהכין את המסמכים הנדרשים.
          </p>
          <p className="text-muted-foreground text-sm mb-5 bg-muted/60 p-3 rounded-lg border border-border/50">
            💡 כדאי לדעת: הנתונים שהזנת עד כה נשמרים במערכת באופן אוטומטי, ויופיעו בכניסתך לשאלון בפעמים הבאות, גם אם לא סיימת למלא את השאלון או להעלות מסמכים.
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 p-3 bg-background/60 rounded-lg border border-border/50">
              <Label className="text-sm text-muted-foreground min-w-[140px]">שלחו לי רשימה למייל</Label>
              <Button variant="outline" size="sm" onClick={handleSendEmailList}>
                <Mail className="ml-2 h-4 w-4" />
                אני רוצה לקבל רשימה למייל
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 bg-background/60 rounded-lg border border-border/50">
              <Label className="text-sm text-muted-foreground min-w-[140px]">תזכורת לטלפון</Label>
              <Button variant="outline" size="sm" onClick={handleSendReminder}>
                <Phone className="ml-2 h-4 w-4" />
                תזכורת לטלפון
              </Button>
              <div className="flex items-center gap-2">
                <Label htmlFor="reminderTime" className="text-xs text-muted-foreground whitespace-nowrap">
                  שעה מועדפת
                </Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-32 h-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 bg-background/60 rounded-lg border border-border/50">
              <Label className="text-sm text-muted-foreground min-w-[140px]">תזכורת במייל</Label>
              <Button variant="outline" size="sm" onClick={handleSendEmailReminder}>
                <Mail className="ml-2 h-4 w-4" />
                תזכורת למייל
              </Button>
              <div className="flex items-center gap-2">
                <Label htmlFor="emailReminderTime" className="text-xs text-muted-foreground whitespace-nowrap">
                  שעה מועדפת
                </Label>
                <Input
                  id="emailReminderTime"
                  type="time"
                  value={emailReminderTime}
                  onChange={(e) => setEmailReminderTime(e.target.value)}
                  className="w-32 h-9"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(2)}
        nextLabel="למעבר להעלאת המסמכים"
        loading={loading}
      />
    </div>
  );
};
