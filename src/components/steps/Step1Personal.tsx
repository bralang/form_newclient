import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step1Personal = () => {
  const { personalInfo, setPersonalInfo, setCurrentStep, sendToWebhook } = useFormContext();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-personal-info",
      personalInfo
    );
    setLoading(false);
    if (success) {
      setCurrentStep(2);
    }
  };

  return (
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
          className="flex gap-4"
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
          onValueChange={(value: "single" | "married") =>
            setPersonalInfo({ maritalStatus: value })
          }
          className="flex gap-4"
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
            onCheckedChange={(checked) =>
              setPersonalInfo({ hasChildren: checked as boolean })
            }
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
              onChange={(e) =>
                setPersonalInfo({ numberOfChildren: parseInt(e.target.value) || undefined })
              }
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
          !personalInfo.maritalStatus
        }
      />
    </div>
  );
};
