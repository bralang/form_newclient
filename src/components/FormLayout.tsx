import { useFormContext } from "@/contexts/FormContext";
import { Card } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background py-6 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo, Title, and Mascot */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="חסידה - ייעוץ מס אכפתי לעסקים" className="h-16 md:h-20 w-auto" />
          </div>

          {/* Title */}
          <div className="text-center flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">שאלון קבלת לקוח</h1>
          </div>

          {/* Mascot with contact bubble */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:block bg-secondary/40 rounded-xl p-3 text-xs max-w-[200px]">
              <p className="font-semibold text-foreground mb-1">אנחנו כאן לסיוע במילוי השאלון</p>
              <p className="text-muted-foreground">טל׳ 0533160990</p>
              <p className="text-muted-foreground">l0533160990@gmail.com</p>
            </div>
            <img
              src={mascot}
              alt="דמותג ליבי חסידה"
              className="h-20 md:h-24 w-auto rounded-lg"
            />
          </div>
        </div>

        {/* Mobile contact info */}
        <div className="md:hidden mb-4 bg-secondary/30 rounded-lg p-3 text-center text-xs">
          <p className="font-semibold text-foreground">אנחנו כאן לסיוע במילוי השאלון</p>
          <p className="text-muted-foreground">טל׳ 0533160990 | l0533160990@gmail.com</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto pb-4">
          <div className="flex justify-between min-w-max px-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      step.number < currentStep
                        ? "bg-accent text-accent-foreground"
                        : step.number === currentStep
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center whitespace-nowrap ${
                      step.number === currentStep
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      step.number < currentStep ? "bg-accent" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-6 md:p-8">{children}</Card>
      </div>
    </div>
  );
};
