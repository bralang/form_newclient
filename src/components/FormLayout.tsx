import { useFormContext } from "@/contexts/FormContext";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const steps = [
  { number: 1, title: "פרטים אישיים וזיהוי" },
  { number: 2, title: "פרטי עסק ושירות" },
  { number: 3, title: "מידע פיננסי ומשוב" },
];

interface FormLayoutProps {
  children: React.ReactNode;
}

export const FormLayout = ({ children }: FormLayoutProps) => {
  const { currentStep } = useFormContext();

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">ליבי חסידה</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">שאלון קבלת לקוח</h2>
          <p className="text-muted-foreground">אנא מלא את הפרטים הבאים בקפידה</p>
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
                    {step.number < currentStep ? <Check className="w-5 h-5" /> : step.number}
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
