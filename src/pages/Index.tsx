import { FormProvider, useFormContext } from "@/contexts/FormContext";
import { FormLayout } from "@/components/FormLayout";
import { Step0Welcome } from "@/components/steps/Step0Welcome";
import { Step1Purpose } from "@/components/steps/Step1Purpose";
import { Step2PersonalInfo } from "@/components/steps/Step2PersonalInfo";
import { Step3Documents } from "@/components/steps/Step3Documents";
import { Step4Completion } from "@/components/steps/Step4Completion";

const FormContent = () => {
  const { currentStep } = useFormContext();

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
  return (
    <FormProvider>
      <FormContent />
    </FormProvider>
  );
};

export default Index;
