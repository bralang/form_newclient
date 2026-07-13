import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Step4Completion = () => {
  const {
    personalInfo,
    detailedInfo,
    serviceType,
    businessInfo,
    spouseBusinessInfo,
    feedbackInfo,
    setFeedbackInfo,
    setCurrentStep,
    sendToWebhook,
    saveFormData,
    updateLeadStatus,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const buildGmailData = () => {
    const clientName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();
    const businessTypeLabelMap: Record<string, string> = { exempt: "פטור", authorized: "מורשה" };
    const businessTypeLabel = businessTypeLabelMap[businessInfo.businessType || ""] || businessInfo.businessType || "";

    const lines: string[] = [
      `שם הלקוח: ${clientName || "-"}`,
      `טלפון: ${personalInfo.phone || "-"}`,
      `מייל: ${personalInfo.email || "-"}`,
      `מטרות: ${serviceType.userPurposes.join(", ") || "-"}`,
      `שם העסק: ${businessInfo.businessName || "-"}`,
      `סוג העסק: ${businessTypeLabel || "-"}`,
    ];

    return {
      ref: personalInfo.ref || null,
      client_name: clientName || null,
      phone: personalInfo.phone || null,
      email: personalInfo.email || null,
      business_count: serviceType.userPurposes.length,
      business_name: businessInfo.businessName || null,
      business_type: businessTypeLabel || null,
      business_type_label: businessTypeLabel || null,
      formatted_text: lines.join("\n"),
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    const [finalSuccess] = await Promise.all([
      sendToWebhook(
        "https://n8n.chasida.biz/webhook/client-intake-final",
        { feedbackInfo, personalInfo, serviceType },
        { silent: true }
      ),
      saveFormData("הוגש"),
      updateLeadStatus("הושלם מילוי שאלון"),
    ]);
    const gmailData = buildGmailData();

    try {
      const { data, error } = await supabase.functions.invoke("send-gmail-proxy", { body: gmailData });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(`n8n error (status ${data?.upstream_status ?? "?"}): ${data?.upstream_body ?? ""}`);
      if (!finalSuccess) {
        toast.warning("המייל נשלח, אבל שליחת טופס הסיום נכשלה");
      } else {
        toast.success("המייל נשלח בהצלחה");
      }
      setSubmitted(true);
      sessionStorage.clear();
    } catch (e: any) {
      console.error("sendGmail error:", e);
      toast.error("שגיאה בשליחת המייל: " + (e.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground">תודה שמילאת את השאלון.</h2>

        <div className="max-w-2xl mx-auto text-right space-y-4 p-6 bg-muted/50 rounded-xl">
          <p className="text-xl font-bold text-primary">אנחנו בדרך לרווח שלכם.</p>
          <p className="text-muted-foreground leading-relaxed">
            בעז"ה נכין לכם את מסמכי הייצוג לחתימה בהתאם לנתונים שמילאתם. בימים הקרובים יישלח אליכם לינק מתוכנת WESIGN לחתימה על ייצוג וכן טופס הסכם שכר טירחה על מנת להתחיל לקבל שירות מחסידה ייעוץ מס אכפתי לעסקים.
          </p>
          <p className="text-muted-foreground">שימו לב למייל שמגיע אליכם מכתובת:</p>
          <p className="font-bold text-primary text-lg">wesign3@comsigntrust.com</p>
          <p className="text-sm text-muted-foreground">
            יתכן שהמייל יגיע לקידומי מכירות ואולי אפילו לספאם
          </p>

          <div className="pt-4 border-t border-border">
            <p className="font-bold text-foreground mb-2">לבירורים ניתן לפנות אלינו:</p>
            <p className="text-muted-foreground">טלפון: 0533160990</p>
            <p className="text-muted-foreground">מייל: l0533160990@gmail.com</p>
          </div>
        </div>

         <Button onClick={() => { setSubmitted(false); setCurrentStep(1); }} variant="outline">
          מלא שאלון חדש
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">סיום</h2>
        <div className="h-1 w-20 bg-primary rounded-full" />
      </div>

      {/* Meeting scheduling */}
      <div className="space-y-5 pt-6 border-t border-border">
        <h3 className="text-xl font-bold text-foreground">
          אם עדיין לא דיברתם איתנו ניתן לתאם כאן מועד לשיחת היכרות
        </h3>

        <div className="space-y-2">
          <Label htmlFor="meetingDate">בחירת מועד מועדף</Label>
          <Input
            id="meetingDate"
            type="date"
            value={feedbackInfo.preferredMeetingDate}
            onChange={(e) => setFeedbackInfo({ preferredMeetingDate: e.target.value })}
          />
        </div>

        <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground space-y-1">
          <p>ניתן לתאם מועד בטלפון: <span className="font-bold text-foreground">0533160990</span></p>
          <p>או לשלוח מייל בקשה לתיאום מועד: <span className="font-bold text-foreground">l0533160990@gmail.com</span></p>
        </div>
      </div>

      {/* Final question */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="text-xl font-bold text-foreground">
          לסיום – יש משהו שהייתם רוצים לשאול לפני שנתחיל?
        </h3>
        <Textarea
          placeholder="כתבו כאן את השאלות שלכם..."
          value={feedbackInfo.finalQuestion}
          onChange={(e) => setFeedbackInfo({ finalQuestion: e.target.value })}
          rows={4}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={() => setCurrentStep(4)} disabled={loading}>
          חזור
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="text-lg px-8"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          🎵 אקורד התחלה – שלח שאלון
        </Button>
      </div>
    </div>
  );
};
