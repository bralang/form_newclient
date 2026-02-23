import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    purposeStatus: Record<string, "new" | "existing">,
    setPurposes: (purposes: string[]) => void,
    setStatus: (status: Record<string, "new" | "existing">) => void
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

  const renderPurposeList = (
    purposes: string[],
    purposeStatus: Record<string, "new" | "existing">,
    toggleFn: (id: string) => void,
    setStatusFn: (status: Record<string, "new" | "existing">) => void
  ) => (
    <div className="space-y-2">
      {PURPOSES.map((purpose) => (
        <div key={purpose.id}>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
            <Checkbox
              id={purpose.id}
              checked={purposes.includes(purpose.id)}
              onCheckedChange={() => toggleFn(purpose.id)}
            />
            <span className="text-sm font-medium">{purpose.label}</span>
          </label>

          {/* Sub-status: new / existing */}
          {purpose.hasSubStatus && purposes.includes(purpose.id) && (
            <div className="mr-10 mt-2 mb-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <RadioGroup
                value={purposeStatus[purpose.id] || ""}
                onValueChange={(v: "new" | "existing") =>
                  setStatusFn({ ...purposeStatus, [purpose.id]: v })
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="new" id={`${purpose.id}-new`} />
                  <Label htmlFor={`${purpose.id}-new`} className="cursor-pointer text-sm">חדש</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="existing" id={`${purpose.id}-existing`} />
                  <Label htmlFor={`${purpose.id}-existing`} className="cursor-pointer text-sm">קיים</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      ))}
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

        {isMarried ? (
          <div className="space-y-6">
            {/* User purposes */}
            <div className="space-y-3">
              <h4 className="font-bold text-primary">
                {personalInfo.firstName || "אני"}
              </h4>
              {renderPurposeList(
                serviceType.userPurposes,
                serviceType.userPurposeStatus,
                toggleUserPurpose,
                (s) => setServiceType({ userPurposeStatus: s })
              )}
            </div>

            {/* Spouse purposes */}
            <div className="space-y-3">
              <h4 className="font-bold text-primary">
                {personalInfo.spouseName || "בן/בת זוג"}
              </h4>
              {renderPurposeList(
                serviceType.spousePurposes,
                serviceType.spousePurposeStatus,
                toggleSpousePurpose,
                (s) => setServiceType({ spousePurposeStatus: s })
              )}
            </div>
          </div>
        ) : (
          renderPurposeList(
            serviceType.userPurposes,
            serviceType.userPurposeStatus,
            toggleUserPurpose,
            (s) => setServiceType({ userPurposeStatus: s })
          )
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
