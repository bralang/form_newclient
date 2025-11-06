import { FormProvider, useFormContext } from "@/contexts/FormContext";
import { FormLayout } from "@/components/FormLayout";
import { Step1PersonalAndContact } from "@/components/steps/Step1PersonalAndContact";
import { Step2BusinessInfo } from "@/components/steps/Step2BusinessInfo";
import { Step3FinancialAndFeedback } from "@/components/steps/Step3FinancialAndFeedback";

const FormContent = () => {
  const { currentStep } = useFormContext();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PersonalAndContact />;
      case 2:
        return <Step2BusinessInfo />;
      case 3:
        return <Step3FinancialAndFeedback />;
      default:
        return <Step1PersonalAndContact />;
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
