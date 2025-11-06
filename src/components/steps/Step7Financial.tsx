import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormNavigation } from "@/components/FormNavigation";
import { useState } from "react";

export const Step7Financial = () => {
  const { financialInfo, setFinancialInfo, setCurrentStep, sendToWebhook } = useFormContext();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-financial-info",
      financialInfo
    );
    setLoading(false);
    if (success) {
      setCurrentStep(8);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">מידע פיננסי</h2>

      <div className="space-y-4">
        <Label>האם הוגשה הצהרת הון?</Label>
        <RadioGroup
          value={financialInfo.hasWealthDeclaration ? "yes" : "no"}
          onValueChange={(value) => setFinancialInfo({ hasWealthDeclaration: value === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id="wealthYes" />
            <Label htmlFor="wealthYes">כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id="wealthNo" />
            <Label htmlFor="wealthNo">לא</Label>
          </div>
        </RadioGroup>

        {financialInfo.hasWealthDeclaration && (
          <div className="space-y-2 mr-6">
            <Label htmlFor="wealthDeclarationFile">העלאת הצהרת הון</Label>
            <Input
              id="wealthDeclarationFile"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                setFinancialInfo({ wealthDeclarationFile: e.target.files?.[0] || undefined })
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-lg">פרטי חשבון בנק</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank">בנק</Label>
            <Input
              id="bank"
              value={financialInfo.bankDetails?.bank || ""}
              onChange={(e) =>
                setFinancialInfo({
                  bankDetails: { ...financialInfo.bankDetails, bank: e.target.value } as any,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">סניף</Label>
            <Input
              id="branch"
              value={financialInfo.bankDetails?.branch || ""}
              onChange={(e) =>
                setFinancialInfo({
                  bankDetails: { ...financialInfo.bankDetails, branch: e.target.value } as any,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">מספר חשבון</Label>
            <Input
              id="accountNumber"
              value={financialInfo.bankDetails?.accountNumber || ""}
              onChange={(e) =>
                setFinancialInfo({
                  bankDetails: {
                    ...financialInfo.bankDetails,
                    accountNumber: e.target.value,
                  } as any,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolder">שם בעל החשבון</Label>
            <Input
              id="accountHolder"
              value={financialInfo.bankDetails?.accountHolder || ""}
              onChange={(e) =>
                setFinancialInfo({
                  bankDetails: {
                    ...financialInfo.bankDetails,
                    accountHolder: e.target.value,
                  } as any,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankConfirmationFile">צ'ק / אישור ניהול חשבון</Label>
          <Input
            id="bankConfirmationFile"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) =>
              setFinancialInfo({ bankConfirmationFile: e.target.files?.[0] || undefined })
            }
          />
        </div>
      </div>

      <FormNavigation onNext={handleNext} onPrev={() => setCurrentStep(6)} loading={loading} />
    </div>
  );
};
