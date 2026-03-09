import { useFormContext } from "@/contexts/FormContext";
import { Check } from "lucide-react";
import mascot from "@/assets/mascot.jpeg";
import logo from "@/assets/logo.png";

const steps = [
  { number: 1, title: "ככה מתחילים לנגן…" },
  { number: 2, title: "המטרה המשותפת" },
  { number: 3, title: "מידע נחוץ" },
  { number: 4, title: "עדכון מסמכים" },
  { number: 5, title: "סיום" },
];

interface FormLayoutProps {
  children: React.ReactNode;
}

export const FormLayout = ({ children }: FormLayoutProps) => {
  const { currentStep } = useFormContext();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
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

            {/* Contact info after steps */}
            <div className="mt-6 text-center space-y-1">
              <p className="text-sm font-semibold opacity-90">אנחנו כאן לסיוע במילוי השאלון</p>
              <p className="text-base font-bold opacity-95">טל׳ 0533160990</p>
              <p className="text-base font-bold opacity-95">teder@chasida.biz</p>
            </div>
          </div>

          {/* Mascot */}
          <div className="mt-8 text-center">
            <img
              src={mascot}
              alt="דמותג ליבי חסידה"
              className="h-36 w-auto mx-auto rounded-2xl mb-5 shadow-lg"
            />
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-h-screen">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-20 bg-primary text-primary-foreground shadow-lg">
            <div className="flex items-center justify-between p-3">
              <img src={logo} alt="חסידה" className="h-10 w-auto" />
              <h1 className="text-sm font-bold">שאלון קבלת לקוח</h1>
              <img src={mascot} alt="דמותג" className="h-10 w-10 rounded-lg object-cover" />
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

            {/* Mobile contact strip */}
            <div className="bg-primary/90 px-4 py-3 text-center border-t border-primary-foreground/10">
              <p className="text-sm font-medium opacity-90">
                לסיוע: 0533160990 | teder@chasida.biz
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 md:p-8 lg:p-10 max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
              {children}
            </div>

            {/* Contact info at bottom of page */}
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
    </div>
  );
};
