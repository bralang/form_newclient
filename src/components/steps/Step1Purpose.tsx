import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

const PURPOSES = [
  { id: "new_business", label: "עבור עסק חדש" },
  { id: "existing_business", label: "עבור עסק קיים" },
  { id: "nonprofit", label: "ניהול עמותה או פתיחת עמותה חדשה" },
  { id: "company", label: "בעלות מניות בחברה או פתיחת חברה חדשה" },
  { id: "tax_refund", label: "להחזר מס" },
];

export const Step1Purpose = () => {
  const {
    personalInfo,
    setPersonalInfo,
    serviceType,
    setServiceType,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const isMarried = personalInfo.maritalStatus === "married";

  const toggleUserPurpose = (id: string) => {
    const cur = serviceType.userPurposes;
    setServiceType({
      userPurposes: cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id],
    });
  };

  const toggleSpousePurpose = (id: string) => {
    const cur = serviceType.spousePurposes;
    setServiceType({
      spousePurposes: cur.includes(id)
        ? cur.filter((p) => p !== id)
        : [...cur, id],
    });
  };

  const handleNext = async () => {
    setPersonalInfo({ step1CompletedAt: new Date().toISOString() });
    setLoading(true);
    sendToWebhook(
      "https://n8n.chasida.biz/webhook/client-intake-step1",
      { personalInfo, serviceType },
      { silent: true }
    );
    setLoading(false);
    setCurrentStep(2);
  };

  return (
    <div className="space-y-8">
      {/* Marketing text placeholder */}
      <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/30 rounded-lg">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          המטרה המשותפת שלנו
        </h2>
        <p className="text-lg text-muted-foreground">
          מקום לטקסט שיווקי שיבוא בהמשך
        </p>
      </div>

      {/* Basic Info */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">פרטים בסיסיים</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">שם פרטי *</Label>
            <Input
              id="firstName"
              value={personalInfo.firstName}
              onChange={(e) => setPersonalInfo({ firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">שם משפחה *</Label>
            <Input
              id="lastName"
              value={personalInfo.lastName}
              onChange={(e) => setPersonalInfo({ lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">מייל *</Label>
            <Input
              id="email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({ email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון *</Label>
            <Input
              id="phone"
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ phone: e.target.value })}
            />
          </div>
        </div>

        {/* Marital Status */}
        <div className="space-y-2">
          <Label>מצב משפחתי *</Label>
          <RadioGroup
            value={personalInfo.maritalStatus}
            onValueChange={(v: any) => setPersonalInfo({ maritalStatus: v })}
            className="flex flex-row-reverse gap-4 justify-end"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single">יחיד/ה</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="married" id="married" />
              <Label htmlFor="married">בן/בת זוג</Label>
            </div>
          </RadioGroup>
        </div>

        {isMarried && (
          <div className="space-y-2">
            <Label htmlFor="spouseName">שם בן/בת הזוג *</Label>
            <Input
              id="spouseName"
              value={personalInfo.spouseName}
              onChange={(e) => setPersonalInfo({ spouseName: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Purpose Selection */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">למה באתם?</h2>

        {isMarried ? (
          /* Table view for married couple */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-primary/10">
                  <th className="p-3 text-right text-muted-foreground font-medium">
                    מטרה
                  </th>
                  <th className="p-3 text-center font-bold text-primary">
                    {personalInfo.firstName || "אני"}
                  </th>
                  <th className="p-3 text-center font-bold text-primary">
                    {personalInfo.spouseName || "בן/בת זוג"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {PURPOSES.map((purpose, idx) => (
                  <tr
                    key={purpose.id}
                    className={`border-b border-border/50 ${
                      idx % 2 === 0 ? "bg-muted/20" : ""
                    }`}
                  >
                    <td className="p-3 text-sm font-medium">{purpose.label}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={serviceType.userPurposes.includes(purpose.id)}
                          onCheckedChange={() => toggleUserPurpose(purpose.id)}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={serviceType.spousePurposes.includes(
                            purpose.id
                          )}
                          onCheckedChange={() =>
                            toggleSpousePurpose(purpose.id)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Simple checkboxes for single */
          <div className="space-y-3">
            {PURPOSES.map((purpose) => (
              <div
                key={purpose.id}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Checkbox
                  id={purpose.id}
                  checked={serviceType.userPurposes.includes(purpose.id)}
                  onCheckedChange={() => toggleUserPurpose(purpose.id)}
                />
                <Label htmlFor={purpose.id} className="cursor-pointer">
                  {purpose.label}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => {}}
        showPrev={false}
        loading={loading}
      />
    </div>
  );
};
