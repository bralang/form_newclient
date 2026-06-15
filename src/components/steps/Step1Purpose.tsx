import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

const PURPOSES = [
  { id: "business", label: "עסק עצמאי (זעיר / פטור / מורשה)", hasSubStatus: true },
  { id: "company", label: "חברה", hasSubStatus: true },
  { id: "nonprofit", label: "עמותה", hasSubStatus: true },
  { id: "tax_refund", label: "החזר מס", hasSubStatus: false },
  { id: "war_compensation", label: "פיצויי מלחמה - השגה או ערר", hasSubStatus: false },
  { id: "other", label: "אחר", hasSubStatus: false },
];

export const Step1Purpose = () => {
  const {
    personalInfo,
    setPersonalInfo,
    serviceType,
    setServiceType,
    setCurrentStep,
    sendToWebhook,
    saveFormData,
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
    await Promise.all([
      sendToWebhook(
        "https://n8n.chasida.biz/webhook/client-intake-step1",
        { personalInfo, serviceType },
        { silent: true }
      ),
      saveFormData(),
    ]);
    setLoading(false);
    setCurrentStep(3);
  };

  const getStatusHint = (purposeId: string, statuses: ("new" | "existing")[]) => {
    if (purposeId === "company") {
      const parts: string[] = [];
      if (statuses.includes("new")) parts.push("חדש = החברה עדיין לא נרשמה ברשם החברות");
      if (statuses.includes("existing")) parts.push("קיים = החברה נרשמה ברשם החברות");
      return parts.join(" • ");
    }
    if (purposeId === "nonprofit") {
      const parts: string[] = [];
      if (statuses.includes("new")) parts.push("חדש = העמותה עדיין לא הוקמה ברשם העמותות");
      if (statuses.includes("existing")) parts.push("קיים = העמותה הוקמה ברשם העמותות");
      return parts.join(" • ");
    }
    return "";
  };

  const renderSubStatus = (
    purposeId: string,
    purposeStatus: Record<string, ("new" | "existing")[]>,
    setStatusFn: (status: Record<string, ("new" | "existing")[]>) => void
  ) => {
    const current = purposeStatus[purposeId] || [];
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => toggleSubStatus(purposeId, "new", purposeStatus, setStatusFn)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border ${
            current.includes("new")
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          חדש
        </button>
        <button
          type="button"
          onClick={() => toggleSubStatus(purposeId, "existing", purposeStatus, setStatusFn)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border ${
            current.includes("existing")
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          קיים
        </button>
      </div>
    );
  };

  const WAR_ENTITIES: { id: "business" | "company" | "nonprofit"; label: string }[] = [
    { id: "business", label: "עסק" },
    { id: "company", label: "חברה" },
    { id: "nonprofit", label: "עמותה" },
  ];

  const renderWarEntities = (
    entities: ("business" | "company" | "nonprofit")[],
    setEntities: (e: ("business" | "company" | "nonprofit")[]) => void,
    centered = false
  ) => (
    <div className={`flex flex-wrap items-center gap-1.5 ${centered ? "justify-center" : ""}`}>
      {WAR_ENTITIES.map((ent) => {
        const active = entities.includes(ent.id);
        return (
          <button
            key={ent.id}
            type="button"
            onClick={() =>
              setEntities(
                active ? entities.filter((e) => e !== ent.id) : [...entities, ent.id]
              )
            }
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {ent.label}
          </button>
        );
      })}
    </div>
  );

  const renderSinglePurposeList = () => (
    <div className="space-y-2">
      {PURPOSES.map((purpose) => {
        const isChecked = serviceType.userPurposes.includes(purpose.id);
        return (
          <div key={purpose.id}>
            <div
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
                <span className={`text-base font-bold ${isChecked ? "text-primary" : ""}`}>
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
            {purpose.hasSubStatus && isChecked && getStatusHint(purpose.id, serviceType.userPurposeStatus[purpose.id] || []) && (
              <p className="text-xs text-muted-foreground mt-1.5 mr-8 animate-in fade-in duration-200">
                {getStatusHint(purpose.id, serviceType.userPurposeStatus[purpose.id] || [])}
              </p>
            )}
            {purpose.id === "other" && isChecked && (
              <div className="mt-2 mr-8 animate-in fade-in duration-200">
                <Input
                  placeholder="פרט/י בבקשה..."
                  value={personalInfo.otherPurposeDetails}
                  onChange={(e) => setPersonalInfo({ otherPurposeDetails: e.target.value })}
                />
              </div>
            )}
            {purpose.id === "war_compensation" && isChecked && (
              <div className="mt-2 mr-8 space-y-1.5 animate-in fade-in duration-200">
                <p className="text-xs text-muted-foreground">לאיזה תיק רלוונטי? (ניתן לבחור יותר מאחד)</p>
                {renderWarEntities(
                  serviceType.userWarCompensationEntities || [],
                  (e) => setServiceType({ userWarCompensationEntities: e })
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
                <td className="py-3 px-4 font-bold text-base text-right">{purpose.label}</td>
                {/* User column */}
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleUserPurpose(purpose.id)}
                      className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                        userChecked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 hover:border-primary/60"
                      }`}
                    >
                      {userChecked && <span className="text-sm font-bold">✓</span>}
                    </button>
                    {purpose.hasSubStatus && userChecked && (
                      <div className="animate-in fade-in duration-200 flex flex-col items-center gap-1">
                        {renderSubStatus(
                          purpose.id,
                          serviceType.userPurposeStatus,
                          (s) => setServiceType({ userPurposeStatus: s })
                        )}
                        {getStatusHint(purpose.id, serviceType.userPurposeStatus[purpose.id] || []) && (
                          <p className="text-[11px] text-muted-foreground text-center leading-tight max-w-[180px]">
                            {getStatusHint(purpose.id, serviceType.userPurposeStatus[purpose.id] || [])}
                          </p>
                        )}
                      </div>
                    )}
                    {purpose.id === "war_compensation" && userChecked && (
                      <div className="animate-in fade-in duration-200 flex flex-col items-center gap-1">
                        {renderWarEntities(
                          serviceType.userWarCompensationEntities || [],
                          (e) => setServiceType({ userWarCompensationEntities: e }),
                          true
                        )}
                      </div>
                    )}
                  </div>
                </td>
                {/* Spouse column */}
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSpousePurpose(purpose.id)}
                      className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                        spouseChecked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 hover:border-primary/60"
                      }`}
                    >
                      {spouseChecked && <span className="text-sm font-bold">✓</span>}
                    </button>
                    {purpose.hasSubStatus && spouseChecked && (
                      <div className="animate-in fade-in duration-200 flex flex-col items-center gap-1">
                        {renderSubStatus(
                          purpose.id,
                          serviceType.spousePurposeStatus,
                          (s) => setServiceType({ spousePurposeStatus: s })
                        )}
                        {getStatusHint(purpose.id, serviceType.spousePurposeStatus[purpose.id] || []) && (
                          <p className="text-[11px] text-muted-foreground text-center leading-tight max-w-[180px]">
                            {getStatusHint(purpose.id, serviceType.spousePurposeStatus[purpose.id] || [])}
                          </p>
                        )}
                      </div>
                    )}
                    {purpose.id === "war_compensation" && spouseChecked && (
                      <div className="animate-in fade-in duration-200 flex flex-col items-center gap-1">
                        {renderWarEntities(
                          serviceType.spouseWarCompensationEntities || [],
                          (e) => setServiceType({ spouseWarCompensationEntities: e }),
                          true
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
      {/* Other details input below table */}
      {(serviceType.userPurposes.includes("other") || serviceType.spousePurposes.includes("other")) && (
        <div className="p-4 border-t border-border/20 animate-in fade-in duration-200">
          <Label className="mb-2 block">פרטים נוספים עבור "אחר":</Label>
          <Input
            placeholder="פרט/י בבקשה..."
            value={personalInfo.otherPurposeDetails}
            onChange={(e) => setPersonalInfo({ otherPurposeDetails: e.target.value })}
          />
        </div>
      )}
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
              <SelectItem value="married">יש לי בן/בת זוג</SelectItem>
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
        <h3 className="text-xl font-bold text-foreground">בעבור מה אני פונה לקבל שירות?</h3>
        {isMarried ? renderTablePurposes() : renderSinglePurposeList()}
      </div>

      {/* Consent Checkboxes */}
      <div className="space-y-4 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={personalInfo.agreeToMessages}
            onCheckedChange={(checked) => setPersonalInfo({ agreeToMessages: !!checked })}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground">אני מאשר/ת הרשמה לקבלת הודעות</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={personalInfo.agreeToPrivacy}
            onCheckedChange={(checked) => setPersonalInfo({ agreeToPrivacy: !!checked })}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground">אני מאשר/ת את מדיניות הפרטיות של המשרד</span>
        </label>
      </div>

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(1)}
        loading={loading}
      />
    </div>
  );
};
