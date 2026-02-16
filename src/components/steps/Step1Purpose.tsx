import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

const PURPOSES = [
  { id: "new_business", label: "עבור עסק חדש" },
  { id: "existing_business", label: "עבור עסק קיים" },
  { id: "nonprofit", label: "אני מנהל עמותה או רוצה לפתוח עמותה חדשה" },
  { id: "company", label: "אני בעל מניות בחברה או רוצה לפתוח חברה" },
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
      spousePurposes: cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id],
    });
  };

  const handleNext = async () => {
    setPersonalInfo({ step1CompletedAt: new Date().toISOString() });
    setLoading(true);
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/client-intake-step1",
      { personalInfo, serviceType },
      { silent: true }
    );
    setLoading(false);
    setCurrentStep(2);
  };

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          המטרה המשותפת שלנו
        </h2>
        <div className="h-1 w-20 bg-primary rounded-full" />
      </div>

      {/* Marketing text placeholder */}
      <div className="p-5 bg-gradient-to-r from-primary/5 to-secondary/20 rounded-xl border border-primary/10">
        <p className="text-muted-foreground text-center">
          מקום לטקסט שיווקי שיבוא בהמשך
        </p>
      </div>

      {/* Basic Info */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <Select
            value={personalInfo.maritalStatus}
            onValueChange={(v: any) => setPersonalInfo({ maritalStatus: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר מצב משפחתי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">יחיד/ה</SelectItem>
              <SelectItem value="married">בן/בת זוג</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isMarried && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
      <div className="space-y-5">
        <h3 className="text-xl font-bold text-foreground">למה באת?</h3>

        {isMarried ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="p-3 text-right text-muted-foreground font-medium text-sm">
                    מטרה
                  </th>
                  <th className="p-3 text-center font-bold text-primary text-sm">
                    {personalInfo.firstName || "אני"}
                  </th>
                  <th className="p-3 text-center font-bold text-primary text-sm">
                    {personalInfo.spouseName || "בן/בת זוג"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {PURPOSES.map((purpose, idx) => (
                  <tr
                    key={purpose.id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                      idx % 2 === 0 ? "bg-muted/10" : ""
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
                          checked={serviceType.spousePurposes.includes(purpose.id)}
                          onCheckedChange={() => toggleSpousePurpose(purpose.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            {PURPOSES.map((purpose) => (
              <label
                key={purpose.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={purpose.id}
                  checked={serviceType.userPurposes.includes(purpose.id)}
                  onCheckedChange={() => toggleUserPurpose(purpose.id)}
                />
                <span className="text-sm font-medium">{purpose.label}</span>
              </label>
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
