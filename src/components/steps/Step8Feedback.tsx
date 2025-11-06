import { useFormContext } from "@/contexts/FormContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export const Step8Feedback = () => {
  const { feedbackInfo, setFeedbackInfo, setCurrentStep, sendToWebhook } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-feedback",
      feedbackInfo
    );
    setLoading(false);
    if (success) {
      setSubmitted(true);
      // Clear sessionStorage after successful submission
      sessionStorage.clear();
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-20 h-20 text-accent" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">תודה רבה!</h2>
        <p className="text-lg text-muted-foreground mb-8">
          השאלון הושלם בהצלחה. נציג יצור איתך קשר בקרוב.
        </p>
        <Button
          onClick={() => {
            setSubmitted(false);
            setCurrentStep(1);
          }}
        >
          מלא שאלון חדש
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">סיום השאלון</h2>

      <div className="space-y-4">
        <div className="flex items-start space-x-2 space-x-reverse">
          <Checkbox
            id="agreeToNotifications"
            checked={feedbackInfo.agreeToNotifications}
            onCheckedChange={(checked) =>
              setFeedbackInfo({ agreeToNotifications: checked as boolean })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="agreeToNotifications" className="cursor-pointer">
              אני מאשר/ת הרשמה לקבלת הודעות *
            </Label>
            <p className="text-sm text-muted-foreground">
              קבלת עדכונים והודעות רלוונטיות בנוגע לשירות
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">משוב על מילוי השאלון (אופציונלי)</Label>
        <Textarea
          id="feedback"
          placeholder="האם השאלון היה ברור ונוח? האם נשארו שאלות?"
          value={feedbackInfo.feedback || ""}
          onChange={(e) => setFeedbackInfo({ feedback: e.target.value })}
          rows={5}
        />
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={() => setCurrentStep(7)} disabled={loading}>
          חזור
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!feedbackInfo.agreeToNotifications || loading}
          size="lg"
          className="bg-accent hover:bg-accent/90"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          שלח שאלון
        </Button>
      </div>
    </div>
  );
};
