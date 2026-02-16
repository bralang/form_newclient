import { useFormContext } from "@/contexts/FormContext";
import { Check } from "lucide-react";
import mascot from "@/assets/mascot.jpeg";
import logo from "@/assets/logo.png";

const steps = [
  { number: 1, title: "המטרה המשותפת" },
  { number: 2, title: "מידע נחוץ" },
  { number: 3, title: "עדכון מסמכים" },
  { number: 4, title: "סיום" },
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
        <aside className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground sticky top-0 h-screen p-6 justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-center mb-8 opacity-90">שאלון קבלת לקוח</h2>

            {/* Progress Steps */}
            <nav className="space-y-2">
              {steps.map((step, index) => {
                const isCompleted = step.number < currentStep;
                const isActive = step.number === currentStep;

                return (
                  <div key={step.number}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary-foreground/20 shadow-lg"
                          : isCompleted
                          ? "bg-primary-foreground/10"
                          : "opacity-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                          isCompleted
                            ? "bg-green-400 text-white"
                            : isActive
                            ? "bg-primary-foreground text-primary ring-4 ring-primary-foreground/30"
                            : "bg-primary-foreground/20 text-primary-foreground"
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                      </div>
                      <span className={`text-sm font-medium ${isActive ? "font-bold" : ""}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex justify-start mr-[1.45rem] my-1">
                        <div
                          className={`w-0.5 h-4 rounded-full transition-all ${
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

          {/* Mascot + Contact */}
          <div className="mt-6 text-center">
            <img
              src={mascot}
              alt="דמותג ליבי חסידה"
              className="h-32 w-auto mx-auto rounded-2xl mb-4 shadow-lg"
            />
            <p className="text-sm font-semibold opacity-90 mb-1">אנחנו כאן לסיוע במילוי השאלון</p>
            <p className="text-xs opacity-70">טל׳ 0533160990</p>
            <p className="text-xs opacity-70">l0533160990@gmail.com</p>
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
            <div className="bg-primary/90 px-4 py-2 text-center border-t border-primary-foreground/10">
              <p className="text-xs opacity-80">
                לסיוע: 0533160990 | l0533160990@gmail.com
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 md:p-8 lg:p-10 max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
              {children}
            </div>
            {/* Logo below the form card */}
            <div className="hidden lg:flex justify-center mt-6 mb-4">
              <img src={logo} alt="חסידה - ייעוץ מס אכפתי לעסקים" className="h-20 w-auto opacity-80" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
