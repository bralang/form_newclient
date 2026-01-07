import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [businessInfo, setBusinessInfoState] = useState<BusinessInfo>({
    isHomeOffice: false,
    hasEmployees: false,
    planningEmployees: false,
  });
  const [spouseBusinessInfo, setSpouseBusinessInfoState] = useState<BusinessInfo>({
    isHomeOffice: false,
    hasEmployees: false,
    planningEmployees: false,
  });
  const [financialInfo, setFinancialInfoState] = useState<FinancialInfo>({
    hasWealthDeclaration: false,
  });
  const [feedbackInfo, setFeedbackInfoState] = useState<FeedbackInfo>({
    agreeToNotifications: false,
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    const safeParse = <T,>(raw: string | null): T | null => {
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    };

    const asBool = (v: unknown) => v === true || v === "true";

    try {
      const savedStep = sessionStorage.getItem("formStep");

      const savedPersonalInfo = safeParse<PersonalInfo>(sessionStorage.getItem("personalInfo"));
      const savedContactInfo = safeParse<ContactInfo>(sessionStorage.getItem("contactInfo"));
      const savedIdentificationInfo = safeParse<IdentificationInfo>(
        sessionStorage.getItem("identificationInfo")
      );
      const savedServiceType = safeParse<ServiceType>(sessionStorage.getItem("serviceType"));
      const savedBusinessInfo = safeParse<BusinessInfo>(sessionStorage.getItem("businessInfo"));
      const savedSpouseBusinessInfo = safeParse<BusinessInfo>(sessionStorage.getItem("spouseBusinessInfo"));
      const savedFinancialInfo = safeParse<FinancialInfo>(sessionStorage.getItem("financialInfo"));
      const savedFeedbackInfo = safeParse<FeedbackInfo>(sessionStorage.getItem("feedbackInfo"));

      if (savedStep) {
        const step = Number(savedStep);
        setCurrentStep(Number.isFinite(step) && step >= 1 && step <= 3 ? step : 1);
      }

      if (savedPersonalInfo) {
        setPersonalInfoState((prev) => ({
          ...prev,
          ...savedPersonalInfo,
          gender:
            savedPersonalInfo.gender === "male" || savedPersonalInfo.gender === "female"
              ? savedPersonalInfo.gender
              : "",
          maritalStatus:
            savedPersonalInfo.maritalStatus === "single" || savedPersonalInfo.maritalStatus === "married"
              ? savedPersonalInfo.maritalStatus
              : "",
          hasChildren: asBool((savedPersonalInfo as any).hasChildren),
        }));
      }

      if (savedContactInfo) {
        setContactInfoState((prev) => ({
          ...prev,
          ...savedContactInfo,
          preferPhoneOverEmail: asBool((savedContactInfo as any).preferPhoneOverEmail),
        }));
      }

      if (savedIdentificationInfo) setIdentificationInfoState(savedIdentificationInfo);

      if (savedServiceType) {
        setServiceTypeState({
          ...savedServiceType,
          purposes: Array.isArray(savedServiceType.purposes) ? savedServiceType.purposes : [],
        });
      }

      if (savedBusinessInfo) {
        setBusinessInfoState((prev) => ({
          ...prev,
          ...savedBusinessInfo,
          isHomeOffice: asBool((savedBusinessInfo as any).isHomeOffice),
          hasEmployees: asBool((savedBusinessInfo as any).hasEmployees),
          planningEmployees: asBool((savedBusinessInfo as any).planningEmployees),
        }));
      }

      if (savedSpouseBusinessInfo) {
        setSpouseBusinessInfoState((prev) => ({
          ...prev,
          ...savedSpouseBusinessInfo,
          isHomeOffice: asBool((savedSpouseBusinessInfo as any).isHomeOffice),
          hasEmployees: asBool((savedSpouseBusinessInfo as any).hasEmployees),
          planningEmployees: asBool((savedSpouseBusinessInfo as any).planningEmployees),
        }));
      }

      if (savedFinancialInfo) {
        setFinancialInfoState((prev) => ({
          ...prev,
          ...savedFinancialInfo,
          hasWealthDeclaration: asBool((savedFinancialInfo as any).hasWealthDeclaration),
        }));
      }

      if (savedFeedbackInfo) {
        setFeedbackInfoState((prev) => ({
          ...prev,
          ...savedFeedbackInfo,
          agreeToNotifications: asBool((savedFeedbackInfo as any).agreeToNotifications),
        }));
      }
    } catch (e) {
      console.error("Failed loading form from sessionStorage:", e);
      sessionStorage.clear();
      setCurrentStep(1);
    }
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
    // Files can't be reliably persisted in sessionStorage. We only persist the serializable fields.
    const {
      idCardFile,
      additionalIdFile,
      spouseIdCardFile,
      spouseAdditionalIdFile,
      ...serializable
    } = identificationInfo as any;

    sessionStorage.setItem("identificationInfo", JSON.stringify(serializable));
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
    // Files can't be reliably persisted in sessionStorage. Persist serializable fields only.
    const { wealthDeclarationFile, bankConfirmationFile, ...serializable } = financialInfo as any;
    sessionStorage.setItem("financialInfo", JSON.stringify(serializable));
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
    const N8N_PREFIX = "https://n8n.link-up.co.il/webhook/";

    try {
      // Prefer backend proxy for n8n to avoid CORS/network flakiness from the browser
      if (url.startsWith(N8N_PREFIX)) {
        const name = url.slice(N8N_PREFIX.length);

        const { data: res, error } = await supabase.functions.invoke("n8n-proxy", {
          body: { name, payload: data },
        });

        if (error) throw new Error(error.message);
        if (!res?.ok) {
          console.error("Webhook non-OK response (proxy):", {
            url,
            status: res?.upstream_status,
            body: res?.upstream_body,
          });
          toast.error(`שגיאה בשליחת הנתונים (סטטוס ${res?.upstream_status ?? "?"})`);
          return false;
        }

        toast.success("הנתונים נשלחו בהצלחה");
        return true;
      }

      // Fallback: direct call
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        const responseText = await response.text().catch(() => "");

        if (response.ok) {
          toast.success("הנתונים נשלחו בהצלחה");
          return true;
        }

        console.error("Webhook non-OK response:", {
          url,
          status: response.status,
          body: responseText,
        });
        toast.error(`שגיאה בשליחת הנתונים (סטטוס ${response.status})`);
        return false;
      } catch (error: any) {
        const isAbort = error?.name === "AbortError";
        console.error("Webhook error:", error);
        toast.error(isAbort ? "פג זמן החיבור לשרת" : "שגיאה בחיבור לשרת");
        return false;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: any) {
      console.error("Webhook proxy error:", error);
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
