import { useFormContext } from "@/contexts/FormContext";
import { FormNavigation } from "@/components/FormNavigation";
import { Music } from "lucide-react";

const TIMELINE_STEPS = [
  {
    note: "דו",
    title: "מילוי שאלון",
    description: "להקדיש כ-10 דקות למילוי השאלון בריכוז.",
  },
  {
    note: "רה",
    title: "קבלה אוטומטית",
    description:
      "השאלון המלא מגיע אלינו באופן אוטומטי. יתכן ותקבלו תזכורות שונות מהמערכת שלנו. שימו לב לעקוב אחר מיילים מכתובת: teder@chasida.biz",
  },
  {
    note: "מי",
    title: "העלאת מסמכים",
    description:
      "בעקבות מילוי השאלון תקבלו למייל רשימת מסמכים שעליכם להעלות בשאלון או לשלוח לנו למייל.",
  },
  {
    note: "פה",
    title: "טפסים לחתימה",
    description:
      "אנחנו מוציאים לכם טפסים לחתימה דיגיטלית ידידותית, ללא צורך בהדפסה וסריקה. מכתובת: wesign3@comsigntrust.com",
  },
  {
    note: "סול",
    title: "חתימה דיגיטלית",
    description: "אתם חותמים באופן דיגיטלי על טפסי הייצוג.",
  },
  {
    note: "לה",
    title: "הגשה לרשויות",
    description:
      "אנחנו מגישים לרשויות את הטפסים החתומים ומעדכנים אתכם שהמסמכים הוגשו.",
  },
  {
    note: "סי",
    title: "ברוכים הבאים!",
    description:
      "שלום וברכה לעוד לקוח מרוצה של חסידה ייעוץ מס אכפתי לעסקים. ביחד נעלה את הווליום בעסק שלך!",
  },
];

const ATTENTION_ITEMS = [
  "המידע שתמסרו בשאלון זה מיועד עבור משרדנו כדי שנוכל להיות המייצגים החוקיים שלכם, ותשובותיכם לא מסונכרנות עם שום גורם ממשלתי או גוף נוסף.",
  "מילוי השאלון לא כרוך בתשלום ואינו מחייב אתכם כלל לפתוח תיק או להיות לקוחות של חסידה ייעוץ מס, אלא מיועד רק להפקת מסמכי ייצוג, שבחתימה עליהם תוכלו להצטרף ללקוחותינו.",
  "גם אם עצרתם באמצע מילוי השאלון, מכל סיבה שהיא — המידע נשמר עבורכם במערכת ותוכלו להמשיך להשיב מהמקום בו עצרתם.",
];

export const Step0Welcome = () => {
  const { setCurrentStep } = useFormContext();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          ככה מתחילים לנגן…
        </h2>
        <div className="h-1 w-20 bg-primary rounded-full mx-auto" />
      </div>

      {/* Welcome Text */}
      <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
        <p>
          שלום וברוכים הבאים למתעניינים בהצטרפות ל
          <strong>חסידה ייעוץ מס אכפתי לעסקים</strong>.
        </p>
        <p>
          אנחנו בעיצומו של תהליך כתיבת התווים לעסק שלכם: תו &lsquo;מי&rsquo;
          מתוך שלבי קבלת לקוח למשרדנו.
        </p>
        <p>
          השאלון שלפניכם הוא קצר, ממוקד, ומילויו באופן מלא וזריז יאפשר לנו
          להוציא בעבורכם מסמכי ייצוג מהרשויות, על מנת שנוכל לפתוח לכם תיק ו/או
          לבצע העברה למשרדנו.
        </p>

        <div className="p-4 bg-muted/50 rounded-xl border border-border/50 space-y-4">
          <p className="font-semibold text-foreground">לתשומת ליבכם:</p>
          {ATTENTION_ITEMS.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Music className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline - Musical Notes */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-6 text-center">
          אז מה עליכם לעשות?
        </h3>

        <div className="flex flex-col items-start">
          <div className="w-full relative">
            {TIMELINE_STEPS.map((step, index) => (
              <div key={step.note} className="flex items-start gap-4 relative">
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className="absolute right-[1.15rem] top-10 w-0.5 bg-secondary"
                    style={{ height: "calc(100% - 0.5rem)" }}
                  />
                )}
                <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0 z-10 shadow-sm">
                  {step.note}
                </div>
                <div className="pb-6 pt-1 flex-1 min-w-0">
                  <p className="font-bold text-base text-foreground">
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FormNavigation
        onNext={() => setCurrentStep(2)}
        onPrev={() => {}}
        showPrev={false}
        nextLabel="בואו נתחיל!"
      />
    </div>
  );
};
