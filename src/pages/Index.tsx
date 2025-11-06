import { FormProvider, useFormContext } from "@/contexts/FormContext";
import { FormLayout } from "@/components/FormLayout";
import { Step1Personal } from "@/components/steps/Step1Personal";
import { Step2Contact } from "@/components/steps/Step2Contact";
import { Step3Identification } from "@/components/steps/Step3Identification";
import { Step4ServiceType } from "@/components/steps/Step4ServiceType";
import { Step5Business } from "@/components/steps/Step5Business";
import { Step6SpouseBusiness } from "@/components/steps/Step6SpouseBusiness";
import { Step7Financial } from "@/components/steps/Step7Financial";
import { Step8Feedback } from "@/components/steps/Step8Feedback";

const FormContent = () => {
  const { currentStep } = useFormContext();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Personal />;
      case 2:
        return <Step2Contact />;
      case 3:
        return <Step3Identification />;
      case 4:
        return <Step4ServiceType />;
      case 5:
        return <Step5Business />;
      case 6:
        return <Step6SpouseBusiness />;
      case 7:
        return <Step7Financial />;
      case 8:
        return <Step8Feedback />;
      default:
        return <Step1Personal />;
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
