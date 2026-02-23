import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

const PURPOSES = [
  { id: "business", label: "עבור עסק עצמאי", hasSubStatus: true },
  { id: "company", label: "עבור חברה", hasSubStatus: true },
  { id: "nonprofit", label: "עבור עמותה", hasSubStatus: true },
  { id: "tax_refund", label: "להחזר מס", hasSubStatus: false },
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

  const togglePurpose = (
    id: string,
    purposes: string[],
    purposeStatus: Record<string, ("new" | "existing")[]>,
    setPurposes: (purposes: string[]) => void,
    setStatus: (status: Record<string, ("new" | "existing")[]>) => void
  ) => {
    if (purposes.includes(id)) {
      setPurposes(purposes.filter((p) => p !== id));
      const newStatus = { ...purposeStatus };
      delete newStatus[id];
      setStatus(newStatus);
    } else {
      setPurposes([...purposes, id]);
    }
  };

  const toggleSubStatus = (
    purposeId: string,
    value: "new" | "existing",
    purposeStatus: Record<string, ("new" | "existing")[]>,
    setStatusFn: (status: Record<string, ("new" | "existing")[]>) => void
  ) => {
    const current = purposeStatus[purposeId] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setStatusFn({ ...purposeStatus, [purposeId]: updated });
  };

  const toggleUserPurpose = (id: string) => {
    togglePurpose(
      id,
      serviceType.userPurposes,
      serviceType.userPurposeStatus,
      (p) => setServiceType({ userPurposes: p }),
      (s) => setServiceType({ userPurposeStatus: s })
    );
  };

  const toggleSpousePurpose = (id: string) => {
    togglePurpose(
      id,
      serviceType.spousePurposes,
      serviceType.spousePurposeStatus,
      (p) => setServiceType({ spousePurposes: p }),
      (s) => setServiceType({ spousePurposeStatus: s })
    );
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

  const renderSubStatus = (
    purposeId: string,
    purposeStatus: Record<string, ("new" | "existing")[]>,
    setStatusFn: (status: Record<string, ("new" | "existing")[]>) => void
  ) => {
    const current = purposeStatus[purposeId] || [];
    return (
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={current.includes("new")}
            onCheckedChange={() => toggleSubStatus(purposeId, "new", purposeStatus, setStatusFn)}
            className="h-3.5 w-3.5"
          />
          <span className="text-xs text-muted-foreground">חדש</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={current.includes("existing")}
            onCheckedChange={() => toggleSubStatus(purposeId, "existing", purposeStatus, setStatusFn)}
            className="h-3.5 w-3.5"
          />
          <span className="text-xs text-muted-foreground">קיים</span>
        </label>
      </div>
    );
  };

  const renderSinglePurposeList = () => (
    <div className="space-y-2">
      {PURPOSES.map((purpose) => {
        const isChecked = serviceType.userPurposes.includes(purpose.id);
        return (
          <div
            key={purpose.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              isChecked
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border/50 hover:bg-muted/30"
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleUserPurpose(purpose.id)}
              />
              <span className={`text-sm font-medium ${isChecked ? "text-primary" : ""}`}>
                {purpose.label}
              </span>
            </label>
            {purpose.hasSubStatus && isChecked && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                {renderSubStatus(
                  purpose.id,
                  serviceType.userPurposeStatus,
                  (s) => setServiceType({ userPurposeStatus: s })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTablePurposes = () => (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="text-right py-3 px-4 font-bold text-foreground text-sm">נושא</th>
            <th className="text-center py-3 px-4 font-bold text-primary text-sm">{personalInfo.firstName || "אני"}</th>
            <th className="text-center py-3 px-4 font-bold text-primary text-sm">{personalInfo.spouseName || "בן/בת זוג"}</th>
          </tr>
        </thead>
        <tbody>
          {PURPOSES.map((purpose, index) => {
            const userChecked = serviceType.userPurposes.includes(purpose.id);
            const spouseChecked = serviceType.spousePurposes.includes(purpose.id);
            const isHighlighted = userChecked || spouseChecked;
            return (
              <tr
                key={purpose.id}
                className={`transition-colors ${
                  isHighlighted ? "bg-primary/5" : "hover:bg-muted/20"
                } ${index < PURPOSES.length - 1 ? "border-b border-border/20" : ""}`}
              >
                <td className="py-3 px-4 font-medium text-right">{purpose.label}</td>
                {/* User column */}
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <Checkbox
                      checked={userChecked}
                      onCheckedChange={() => toggleUserPurpose(purpose.id)}
                    />
                    {purpose.hasSubStatus && userChecked && (
                      <div className="animate-in fade-in duration-200">
                        {renderSubStatus(
                          purpose.id,
                          serviceType.userPurposeStatus,
                          (s) => setServiceType({ userPurposeStatus: s })
                        )}
                      </div>
                    )}
                  </div>
                </td>
                {/* Spouse column */}
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <Checkbox
                      checked={spouseChecked}
                      onCheckedChange={() => toggleSpousePurpose(purpose.id)}
                    />
                    {purpose.hasSubStatus && spouseChecked && (
                      <div className="animate-in fade-in duration-200">
                        {renderSubStatus(
                          purpose.id,
                          serviceType.spousePurposeStatus,
                          (s) => setServiceType({ spousePurposeStatus: s })
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

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
        {isMarried ? renderTablePurposes() : renderSinglePurposeList()}
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
