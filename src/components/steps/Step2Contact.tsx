import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step2Contact = () => {
  const { contactInfo, setContactInfo, personalInfo, setCurrentStep, sendToWebhook } =
    useFormContext();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-contact-info",
      contactInfo
    );
    setLoading(false);
    if (success) {
      setCurrentStep(3);
    }
  };

  return (
    <div className="space-y-6">
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
          <Label htmlFor="email">כתובת מייל *</Label>
          <Input
            id="email"
            type="email"
            value={contactInfo.email}
            onChange={(e) => setContactInfo({ email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex items-start space-x-2 space-x-reverse">
        <Checkbox
          id="preferPhoneOverEmail"
          checked={contactInfo.preferPhoneOverEmail}
          onCheckedChange={(checked) =>
            setContactInfo({ preferPhoneOverEmail: checked as boolean })
          }
        />
        <div className="space-y-1">
          <Label htmlFor="preferPhoneOverEmail" className="cursor-pointer">
            הזמינות שלי למייל נמוכה
          </Label>
          <p className="text-sm text-muted-foreground">
            מעדיף/ה לקבל הודעות ממערכת טלפונית במקום במייל
          </p>
        </div>
      </div>

      {personalInfo.maritalStatus === "married" && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">פרטי התקשרות של בן/בת הזוג</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spousePhone">טלפון נייד</Label>
              <Input
                id="spousePhone"
                type="tel"
                value={contactInfo.spousePhone || ""}
                onChange={(e) => setContactInfo({ spousePhone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spouseEmail">כתובת מייל</Label>
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

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(1)}
        loading={loading}
        disabled={!contactInfo.phone || !contactInfo.email}
      />
    </div>
  );
};
