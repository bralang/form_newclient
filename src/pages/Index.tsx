import { FormProvider, useFormContext } from "@/contexts/FormContext";
import { FormLayout } from "@/components/FormLayout";
import { Step0Welcome } from "@/components/steps/Step0Welcome";
import { Step1Purpose } from "@/components/steps/Step1Purpose";
import { Step2PersonalInfo } from "@/components/steps/Step2PersonalInfo";
import { Step3Documents } from "@/components/steps/Step3Documents";
import { Step4Completion } from "@/components/steps/Step4Completion";
import { useSearchParams } from "react-router-dom";

const FormContent = () => {
  const { currentStep, isLoading } = useFormContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-lg font-bold text-primary">טוען שאלון...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step0Welcome />;
      case 2:
        return <Step1Purpose />;
      case 3:
        return <Step2PersonalInfo />;
      case 4:
        return <Step3Documents />;
      case 5:
        return <Step4Completion />;
      default:
        return <Step0Welcome />;
    }
  };

  return <FormLayout>{renderStep()}</FormLayout>;
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const questionnaireId = idParam ? Number(idParam) : null;

  return (
    <FormProvider questionnaireId={questionnaireId}>
      <FormContent />
    </FormProvider>
  );
};

export default Index;
