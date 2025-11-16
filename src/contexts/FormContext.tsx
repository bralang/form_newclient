import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "";
  idNumber: string;
  birthDate: string;
  maritalStatus: "single" | "married" | "";
  hasChildren: boolean;
  numberOfChildren?: number;
  spouseName?: string;
  spouseIdNumber?: string;
  spouseBirthDate?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  preferPhoneOverEmail: boolean;
  spousePhone?: string;
  spouseEmail?: string;
  homePhone?: string;
  address?: {
    street: string;
    number: string;
    city: string;
  };
}

export interface IdentificationInfo {
  idCardFile?: File;
  additionalIdType?: "parentId" | "license" | "passport" | "";
  additionalIdNumber?: string;
  additionalIdFile?: File;
  spouseIdCardFile?: File;
  spouseAdditionalIdType?: "parentId" | "license" | "passport" | "";
  spouseAdditionalIdNumber?: string;
  spouseAdditionalIdFile?: File;
}

export interface ServiceType {
  purposes: string[];
  spouseEmploymentStatus?: "unemployed" | "employee" | "business_owner" | "wants_business" | "shareholder" | "";
}

export interface BusinessInfo {
  businessName?: string;
  businessField?: string;
  businessType?: "sole_proprietorship" | "partnership" | "company" | "";
  startDate?: string;
  businessAddress?: {
    street: string;
    number: string;
    city: string;
  };
  isHomeOffice?: boolean;
  isSmallBusiness?: boolean;
  ownershipType?: "sole" | "partnership" | "";
  businessOffering?: "products" | "services" | "both" | "";
  hasEmployees?: boolean;
  companyRegistrationFile?: File;
  leaseAgreementFile?: File;
  documentMethod?: "summit" | "manual" | "software" | "";
  otherSoftwareName?: string;
  softwareUsername?: string;
  softwarePassword?: string;
  planningEmployees?: boolean;
  expectedRevenue?: string;
  chosenBusinessName?: string;
}

export interface FinancialInfo {
  hasWealthDeclaration: boolean;
  wealthDeclarationFile?: File;
  bankDetails?: {
    bank: string;
    branch: string;
    accountNumber: string;
    accountHolder: string;
  };
  bankConfirmationFile?: File;
}

export interface FeedbackInfo {
  agreeToNotifications: boolean;
  feedback?: string;
}

interface FormContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  personalInfo: PersonalInfo;
  setPersonalInfo: (data: Partial<PersonalInfo>) => void;
  contactInfo: ContactInfo;
  setContactInfo: (data: Partial<ContactInfo>) => void;
  identificationInfo: IdentificationInfo;
  setIdentificationInfo: (data: Partial<IdentificationInfo>) => void;
  serviceType: ServiceType;
  setServiceType: (data: Partial<ServiceType>) => void;
  businessInfo: BusinessInfo;
  setBusinessInfo: (data: Partial<BusinessInfo>) => void;
  spouseBusinessInfo: BusinessInfo;
  setSpouseBusinessInfo: (data: Partial<BusinessInfo>) => void;
  financialInfo: FinancialInfo;
  setFinancialInfo: (data: Partial<FinancialInfo>) => void;
  feedbackInfo: FeedbackInfo;
  setFeedbackInfo: (data: Partial<FeedbackInfo>) => void;
  sendToWebhook: (url: string, data: any) => Promise<boolean>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within FormProvider");
  }
  return context;
};

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [personalInfo, setPersonalInfoState] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    gender: "",
    idNumber: "",
    birthDate: "",
    maritalStatus: "",
    hasChildren: false,
  });
  const [contactInfo, setContactInfoState] = useState<ContactInfo>({
    phone: "",
    email: "",
    preferPhoneOverEmail: false,
  });
  const [identificationInfo, setIdentificationInfoState] = useState<IdentificationInfo>({});
  const [serviceType, setServiceTypeState] = useState<ServiceType>({
    purposes: [],
  });
  const [businessInfo, setBusinessInfoState] = useState<BusinessInfo>({});
  const [spouseBusinessInfo, setSpouseBusinessInfoState] = useState<BusinessInfo>({});
  const [financialInfo, setFinancialInfoState] = useState<FinancialInfo>({
    hasWealthDeclaration: false,
  });
  const [feedbackInfo, setFeedbackInfoState] = useState<FeedbackInfo>({
    agreeToNotifications: false,
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem("formStep");
    const savedPersonalInfo = sessionStorage.getItem("personalInfo");
    const savedContactInfo = sessionStorage.getItem("contactInfo");
    const savedIdentificationInfo = sessionStorage.getItem("identificationInfo");
    const savedServiceType = sessionStorage.getItem("serviceType");
    const savedBusinessInfo = sessionStorage.getItem("businessInfo");
    const savedSpouseBusinessInfo = sessionStorage.getItem("spouseBusinessInfo");
    const savedFinancialInfo = sessionStorage.getItem("financialInfo");
    const savedFeedbackInfo = sessionStorage.getItem("feedbackInfo");

    if (savedStep) setCurrentStep(parseInt(savedStep));
    if (savedPersonalInfo) setPersonalInfoState(JSON.parse(savedPersonalInfo));
    if (savedContactInfo) setContactInfoState(JSON.parse(savedContactInfo));
    if (savedIdentificationInfo) setIdentificationInfoState(JSON.parse(savedIdentificationInfo));
    if (savedServiceType) setServiceTypeState(JSON.parse(savedServiceType));
    if (savedBusinessInfo) setBusinessInfoState(JSON.parse(savedBusinessInfo));
    if (savedSpouseBusinessInfo) setSpouseBusinessInfoState(JSON.parse(savedSpouseBusinessInfo));
    if (savedFinancialInfo) setFinancialInfoState(JSON.parse(savedFinancialInfo));
    if (savedFeedbackInfo) setFeedbackInfoState(JSON.parse(savedFeedbackInfo));
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem("formStep", currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    sessionStorage.setItem("personalInfo", JSON.stringify(personalInfo));
  }, [personalInfo]);

  useEffect(() => {
    sessionStorage.setItem("contactInfo", JSON.stringify(contactInfo));
  }, [contactInfo]);

  useEffect(() => {
    sessionStorage.setItem("identificationInfo", JSON.stringify(identificationInfo));
  }, [identificationInfo]);

  useEffect(() => {
    sessionStorage.setItem("serviceType", JSON.stringify(serviceType));
  }, [serviceType]);

  useEffect(() => {
    sessionStorage.setItem("businessInfo", JSON.stringify(businessInfo));
  }, [businessInfo]);

  useEffect(() => {
    sessionStorage.setItem("spouseBusinessInfo", JSON.stringify(spouseBusinessInfo));
  }, [spouseBusinessInfo]);

  useEffect(() => {
    sessionStorage.setItem("financialInfo", JSON.stringify(financialInfo));
  }, [financialInfo]);

  useEffect(() => {
    sessionStorage.setItem("feedbackInfo", JSON.stringify(feedbackInfo));
  }, [feedbackInfo]);

  const setPersonalInfo = (data: Partial<PersonalInfo>) => {
    setPersonalInfoState((prev) => ({ ...prev, ...data }));
  };

  const setContactInfo = (data: Partial<ContactInfo>) => {
    setContactInfoState((prev) => ({ ...prev, ...data }));
  };

  const setIdentificationInfo = (data: Partial<IdentificationInfo>) => {
    setIdentificationInfoState((prev) => ({ ...prev, ...data }));
  };

  const setServiceType = (data: Partial<ServiceType>) => {
    setServiceTypeState((prev) => ({ ...prev, ...data }));
  };

  const setBusinessInfo = (data: Partial<BusinessInfo>) => {
    setBusinessInfoState((prev) => ({ ...prev, ...data }));
  };

  const setSpouseBusinessInfo = (data: Partial<BusinessInfo>) => {
    setSpouseBusinessInfoState((prev) => ({ ...prev, ...data }));
  };

  const setFinancialInfo = (data: Partial<FinancialInfo>) => {
    setFinancialInfoState((prev) => ({ ...prev, ...data }));
  };

  const setFeedbackInfo = (data: Partial<FeedbackInfo>) => {
    setFeedbackInfoState((prev) => ({ ...prev, ...data }));
  };

  const sendToWebhook = async (url: string, data: any): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status === 200) {
        toast.success("הנתונים נשלחו בהצלחה");
        return true;
      } else {
        toast.error("שגיאה בשליחת הנתונים");
        return false;
      }
    } catch (error) {
      console.error("Webhook error:", error);
      toast.error("שגיאה בחיבור לשרת");
      return false;
    }
  };

  return (
    <FormContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        personalInfo,
        setPersonalInfo,
        contactInfo,
        setContactInfo,
        identificationInfo,
        setIdentificationInfo,
        serviceType,
        setServiceType,
        businessInfo,
        setBusinessInfo,
        spouseBusinessInfo,
        setSpouseBusinessInfo,
        financialInfo,
        setFinancialInfo,
        feedbackInfo,
        setFeedbackInfo,
        sendToWebhook,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
