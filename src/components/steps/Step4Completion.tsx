import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Step4Completion = () => {
  const {
    personalInfo,
    contactInfo,
    serviceType,
    businessInfo,
    spouseBusinessInfo,
    financialInfo,
    setFinancialInfo,
    feedbackInfo,
    setFeedbackInfo,
    setCurrentStep,
    sendToWebhook,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const buildGmailData = () => {
    const hasMainBusiness = serviceType.purposes?.some((p) =>
      ["new_business", "existing_business", "shareholder"].includes(p)
    );
    const spouseHasBusiness = serviceType.spouseEmploymentStatus === "business_owner";

    const businessCount = (hasMainBusiness ? 1 : 0) + (spouseHasBusiness ? 1 : 0);

    const businessTypeLabelMap: Record<string, string> = {
      exempt: "פטור",
      authorized: "מורשה",
      licensed: "מורשה",
      company: "חברה",
      nonprofit: "עמותה",
    };

    const clientName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();

    const main = hasMainBusiness ? businessInfo : null;
    const spouse = spouseHasBusiness ? spouseBusinessInfo : null;

    const normalizeBusiness = (info: any) => {
      const typeValue = (info?.businessType as string) || "";
      const typeLabel = businessTypeLabelMap[typeValue] || typeValue || "";
      return {
        name: (info?.businessName as string) || "",
        typeValue,
        typeLabel,
      };
    };

    const mainN = normalizeBusiness(main);
    const spouseN = normalizeBusiness(spouse);

    const hasMainDetails = Boolean(mainN.name || mainN.typeValue);
    const hasSpouseDetails = Boolean(spouseN.name || spouseN.typeValue);

    const primary = hasMainDetails ? mainN : hasSpouseDetails ? spouseN : null;

    const lines: string[] = [
      `שם הלקוח: ${clientName || "-"}`,
      `טלפון: ${contactInfo.phone || "-"}`,
      `מייל: ${contactInfo.email || "-"}`,
      `מספר עסקים: ${businessCount}`,
      `שם העסק: ${primary?.name || "-"}`,
      `סוג העסק: ${primary?.typeLabel || "-"}`,
    ];

    if (businessCount === 2) {
      const secondary = hasMainDetails ? spouseN : mainN;
      if (secondary?.name || secondary?.typeLabel) {
        lines.push(`שם העסק 2: ${secondary.name || "-"}`);
        lines.push(`סוג העסק 2: ${secondary.typeLabel || "-"}`);
      }
    }

    return {
      ref: personalInfo.ref || null,
      client_name: clientName || null,
      phone: contactInfo.phone || null,
      email: contactInfo.email || null,
      business_count: businessCount,
      business_name: primary?.name || null,
      business_type: primary?.typeLabel || null,
      business_type_label: primary?.typeLabel || null,
      formatted_text: lines.join("\n"),
    };
  };

  const handleSubmit = async () => {
    console.log("Step4: Submit clicked");
    setLoading(true);

    const finalSuccess = await sendToWebhook(
      "https://n8n.link-up.co.il/webhook/client-intake-final",
      { financialInfo, feedbackInfo }
    );

    console.log("Step4: final webhook success?", finalSuccess);

    const gmailData = buildGmailData();

    try {
      const { data, error } = await supabase.functions.invoke("send-gmail-proxy", {
        body: gmailData,
      });

      if (error) throw new Error(error.message);
      if (!data?.ok) {
        throw new Error(
          `n8n error (status ${data?.upstream_status ?? "?"}): ${data?.upstream_body ?? ""}`
        );
      }

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
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-bold text-foreground">סיום שהוא פתיח להתחלה...</h2>
      </div>

      {/* Open Question Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">שאלות נוספות</h2>
        
        <div className="space-y-2">
          <Label htmlFor="openQuestion">אם יש לכם מה לשאול אותנו - זה המקום</Label>
          <Textarea
            id="openQuestion"
            placeholder="כתבו כאן את השאלות שלכם..."
            value={feedbackInfo.openQuestion || ""}
            onChange={(e) => setFeedbackInfo({ openQuestion: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      {/* Marketing Text */}
      <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/30 rounded-lg space-y-4">
        <h3 className="text-xl font-bold text-foreground">ברוכים הבאים למשפחה!</h3>
        <p className="text-muted-foreground">
          אנחנו שמחים שבחרתם להצטרף אלינו. הצוות שלנו כאן בשבילכם בכל שלב בדרך להצלחה העסקית שלכם.
        </p>
        <p className="text-sm text-muted-foreground">
          נציג מהצוות שלנו יצור איתכם קשר בהקדם כדי להמשיך את התהליך.
        </p>
        <p className="text-sm text-primary font-medium mt-2">
          🤝 אנחנו כאן לסיוע גם כשגוגלים
        </p>
      </div>

      {/* Meeting Scheduling */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">קביעת מועד לשיחת היכרות</h2>
        
        <div className="space-y-4">
          <Label>האם כבר קבעתם שיחת היכרות?</Label>
          <RadioGroup
            value={feedbackInfo.hasScheduledMeeting ? "yes" : "no"}
            onValueChange={(value) => setFeedbackInfo({ hasScheduledMeeting: value === "yes" })}
            className="flex flex-row-reverse gap-4 justify-end"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="yes" id="meetingYes" />
              <Label htmlFor="meetingYes">כן</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="no" id="meetingNo" />
              <Label htmlFor="meetingNo">לא</Label>
            </div>
          </RadioGroup>

          {!feedbackInfo.hasScheduledMeeting && (
            <div className="space-y-2 mr-6">
              <Label htmlFor="preferredMeetingDate">מועד מועדף לשיחה</Label>
              <Input
                id="preferredMeetingDate"
                type="date"
                value={feedbackInfo.preferredMeetingDate || ""}
                onChange={(e) => setFeedbackInfo({ preferredMeetingDate: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Personal Question */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">שאלה אישית</h2>
        <div className="space-y-2">
          <Label htmlFor="personalQuestion">האם יש משהו נוסף שהייתם רוצים שנדע?</Label>
          <Textarea
            id="personalQuestion"
            placeholder="שתפו אותנו..."
            value={feedbackInfo.personalQuestion || ""}
            onChange={(e) => setFeedbackInfo({ personalQuestion: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Financial Info Section */}
      <div className="space-y-6 pt-6 border-t border-border">
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
      </div>

      {/* Initial Instructions */}
      <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-lg text-foreground mb-2">📋 הנחיות ראשונות - התחנה הבאה</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>נציג מהצוות שלנו יצור איתכם קשר תוך 24-48 שעות</li>
          <li>הכינו את כל המסמכים שהועלו לשאלון לצפייה</li>
          <li>אם יש שאלות נוספות - אנחנו זמינים בטלפון ובמייל</li>
        </ul>
      </div>

      {/* Feedback Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">סיום השאלון</h2>

        <div className="space-y-4">
          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="agreeToNotifications"
              checked={Boolean(feedbackInfo.agreeToNotifications)}
              onCheckedChange={(checked) =>
                setFeedbackInfo({ agreeToNotifications: checked === true })
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
          <Label htmlFor="feedback">נשמח לקבל משוב על מילוי השאלון</Label>
          <Textarea
            id="feedback"
            placeholder="האם היה ברור ונח או שנשארו לך שאלות"
            value={feedbackInfo.feedback || ""}
            onChange={(e) => setFeedbackInfo({ feedback: e.target.value })}
            rows={5}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={loading}>
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
