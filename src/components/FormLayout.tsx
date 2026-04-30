import { useState } from "react";
import { useFormContext } from "@/contexts/FormContext";
import { Check, Music, Info, X, Sparkles } from "lucide-react";
import mascot from "@/assets/mascot.png";
import logo from "@/assets/logo.png";
import linkupLogo from "@/assets/linkup-logo.png";

const steps = [
  { number: 1, title: "ככה מתחילים לנגן…" },
  { number: 2, title: "המטרה המשותפת" },
  { number: 3, title: "מידע נחוץ" },
  { number: 4, title: "עדכון מסמכים" },
  { number: 5, title: "סיום" },
];

const ATTENTION_ITEMS = [
  "המידע שתמסרו בשאלון זה מיועד עבור משרדנו כדי שנוכל להיות המייצגים החוקיים שלכם, ותשובותיכם לא מסונכרנות עם שום גורם ממשלתי או גוף נוסף.",
  "מילוי השאלון לא כרוך בתשלום ואינו מחייב אתכם כלל לפתוח תיק או להיות לקוחות של חסידה ייעוץ מס, אלא מיועד רק להפקת מסמכי ייצוג, שבחתימה עליהם תוכלו להצטרף ללקוחותינו.",
  "גם אם עצרתם באמצע מילוי השאלון, מכל סיבה שהיא — המידע נשמר עבורכם במערכת ותוכלו להמשיך להשיב מהמקום בו עצרתם.",
];

interface FormLayoutProps {
  children: React.ReactNode;
}

export const FormLayout = ({ children }: FormLayoutProps) => {
  const { currentStep } = useFormContext();
  const [showAttention, setShowAttention] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-10" dir="rtl">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ─── Sidebar (Desktop) ─── */}
        <aside className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground sticky top-0 h-screen p-8 justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-center mb-10 opacity-90">שאלון קבלת לקוח</h2>

            {/* Progress Steps */}
            <nav className="space-y-3">
              {steps.map((step, index) => {
                const isCompleted = step.number < currentStep;
                const isActive = step.number === currentStep;

                return (
                  <div key={step.number}>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary-foreground/20 shadow-lg"
                          : isCompleted
                          ? "bg-primary-foreground/10"
                          : "opacity-50"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 transition-all ${
                          isCompleted
                            ? "bg-green-400 text-white"
                            : isActive
                            ? "bg-primary-foreground text-primary ring-4 ring-primary-foreground/30"
                            : "bg-primary-foreground/20 text-primary-foreground"
                        }`}
                      >
                        {isCompleted ? <Check className="w-6 h-6" /> : step.number}
                      </div>
                      <span className={`text-base font-medium ${isActive ? "font-bold text-lg" : ""}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex justify-start mr-[1.7rem] my-1">
                        <div
                          className={`w-0.5 h-5 rounded-full transition-all ${
                            isCompleted ? "bg-green-400" : "bg-primary-foreground/20"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

          </div>

        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-h-screen">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-20 bg-primary text-primary-foreground shadow-lg">
            <div className="flex items-center justify-center p-3">
              <h1 className="text-sm font-bold">שאלון קבלת לקוח</h1>
            </div>

            {/* Mobile Progress Bar */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between gap-1">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step.number < currentStep
                            ? "bg-green-400 text-white"
                            : step.number === currentStep
                            ? "bg-primary-foreground text-primary"
                            : "bg-primary-foreground/20 text-primary-foreground/60"
                        }`}
                      >
                        {step.number < currentStep ? <Check className="w-4 h-4" /> : step.number}
                      </div>
                      <span className="text-[10px] mt-1 text-primary-foreground/80 whitespace-nowrap">
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 rounded-full ${
                          step.number < currentStep ? "bg-green-400" : "bg-primary-foreground/20"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Desktop: Form + Left Panel */}
          <div className="hidden lg:flex lg:flex-row min-h-screen">
            {/* Form Content - closer to sidebar */}
            <div className="flex-1 pr-4 pl-0 py-10">
              <div className="max-w-3xl mr-0 ml-auto">
                <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
                  {children}
                </div>
              </div>
            </div>

            {/* Left Panel - Mascot + Contact + Attention (pinned to bottom) */}
            <div className="w-64 xl:w-72 shrink-0 sticky top-0 h-screen flex flex-col justify-end p-6 pb-10 gap-5">
              {/* Attention Button - hidden on step 1 */}
              {currentStep !== 1 && (
                <button
                  onClick={() => setShowAttention(true)}
                  className="group relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary/15 to-secondary/30 hover:from-primary/25 hover:to-secondary/40 text-primary font-bold px-5 py-3.5 rounded-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]"
                >
                  <div className="relative">
                    <Info className="w-5 h-5 animate-bounce" style={{ animationDuration: '2s' }} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
                  </div>
                  <span>לתשומת ליבכם</span>
                  <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              )}

              {/* Mascot */}
              <img
                src={mascot}
                alt="דמותג ליבי חסידה"
                className="h-56 w-auto mx-auto"
              />

              {/* Contact Info */}
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground/80">אנחנו כאן לסיוע במילוי השאלון</p>
                <a href="tel:0533160990" className="block text-base font-bold text-primary hover:underline">טל׳ 0533160990</a>
                <a href="mailto:teder@chasida.biz" className="block text-base font-bold text-primary hover:underline">teder@chasida.biz</a>
              </div>
            </div>
          </div>

          {/* Attention Modal Overlay */}
          {showAttention && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAttention(false)}>
              <div
                className="bg-card rounded-2xl shadow-2xl border border-border p-8 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-300"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">🎵 לתשומת ליבכם</h3>
                  <button
                    onClick={() => setShowAttention(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-5">
                  {ATTENTION_ITEMS.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-base text-foreground/80 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAttention(false)}
                    className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                  >
                    סגירה
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Form Content */}
          <div className="lg:hidden p-4 md:p-8">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
              {children}
            </div>

            {/* Mobile Floating Attention Button */}
            {currentStep !== 1 && (
              <button
                onClick={() => setShowAttention(true)}
                className="fixed bottom-12 left-6 z-30 lg:hidden flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Info className="w-5 h-5 animate-bounce" style={{ animationDuration: '2s' }} />
                <span className="text-sm">לתשומת ליבכם</span>
              </button>
            )}

            {/* Mobile Contact info */}
            <div className="mt-8 mb-6 text-center space-y-2">
              <p className="text-base font-semibold text-foreground/80">אנחנו כאן לסיוע במילוי השאלון</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a href="tel:0533160990" className="text-lg font-bold text-primary hover:underline">טל׳ 0533160990</a>
                <span className="text-muted-foreground">|</span>
                <a href="mailto:teder@chasida.biz" className="text-lg font-bold text-primary hover:underline">teder@chasida.biz</a>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Global Credit Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-t border-border py-2 text-center text-xs text-muted-foreground">
        <a
          href="https://link-up.co.il"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:opacity-80 transition-opacity font-semibold underline"
        >
          LinkUp
        </a>
        <span className="mr-1">פיתוח ואוטומציות</span>
      </footer>
    </div>
  );
};
