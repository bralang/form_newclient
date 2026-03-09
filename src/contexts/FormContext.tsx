import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Step 1 Interfaces ─────────────────────────────

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  maritalStatus: "single" | "married" | "";
  spouseName: string;
  step1CompletedAt?: string;
  ref?: string;
  agreeToMessages: boolean;
  agreeToPrivacy: boolean;
  otherPurposeDetails: string;
}

export interface ServiceType {
  userPurposes: string[];
  spousePurposes: string[];
  userPurposeStatus: Record<string, ("new" | "existing")[]>;
  spousePurposeStatus: Record<string, ("new" | "existing")[]>;
}

// ─── Step 2 Interfaces ─────────────────────────────

export interface DetailedPersonalInfo {
  idNumber: string;
  homePhone: string;
  gender: "male" | "female" | "";
  birthDate: string;
  availability: string;
  detailedMaritalStatus: string;
  additionalIdTypes: ("parentId" | "license" | "passport")[];
  additionalIdNumber: string;
  additionalLicenseNumber: string;
  additionalPassportNumber: string;
}

export interface SpouseDetailedInfo {
  idNumber: string;
  email: string;
  phone: string;
  gender: "male" | "female" | "";
  additionalIdTypes: ("parentId" | "license" | "passport")[];
  additionalIdNumber: string;
  additionalLicenseNumber: string;
  additionalPassportNumber: string;
  availability: string;
}

export interface BusinessInfo {
  // Common
  ownershipType?: "sole" | "partnership" | "";
  businessNumber?: string;
  hasEmployees?: boolean;
  hadPreviousBusiness?: boolean;

  // Partnership details (new business)
  partners?: Array<{
    name: string;
    idNumber: string;
    percentage: string;
    phone: string;
    email: string;
    address: string;
    isVatRepresentative: boolean;
  }>;
  partnershipAgreementFile?: File;

  // New business
  businessName?: string;
  isUnemployedOrMaternity?: boolean;
  businessField?: string;
  businessType?: "exempt" | "authorized" | "";
  wantSmallBusiness?: boolean;
  isHomeOffice?: boolean;
  businessAddress?: { street: string; number: string; city: string };
  hasSeparateBankAccount?: boolean;
  bankDetails?: {
    bank: string;
    branch: string;
    accountNumber: string;
    accountHolder: string;
  };
  bankConfirmationFile?: File;
  leaseAgreementFile?: File;
  planningEmployees?: boolean;
  activityStartDate?: string;
  expectedRevenue?: string;

  // Company (purpose 4)
  existingCompanyCount?: number;
  newCompanyCount?: number;
  existingCompanies?: Array<{ name: string; companyNumber: string }>;
  newCompanies?: Array<{
    existsInRegistrar?: boolean;
    requestedName1?: string;
    requestedName2?: string;
    requestedName3?: string;
    shareholderType?: "alone" | "other" | "";
    shareholderDetails?: string;
    planningEmployees?: boolean;
  }>;
}

// ─── Step 3 Interfaces ─────────────────────────────

export interface DocumentsInfo {
  idCardFiles?: File[];
  parentIdNumber?: string;
  licenseNumber?: string;
  passportNumber?: string;
  licenseFile?: File;
  passportFile?: File;

  spouseIdCardFiles?: File[];
  spouseParentIdNumber?: string;
  spouseLicenseNumber?: string;
  spousePassportNumber?: string;
  spouseLicenseFile?: File;
  spousePassportFile?: File;

  bankConfirmationFile?: File;
  leaseAgreementFile?: File;
  spouseBankConfirmationFile?: File;
  spouseLeaseAgreementFile?: File;

  incorporationFiles?: File[];
  registrarExtractFile?: File;
  companyBankConfirmationFile?: File;
}

// ─── Step 4 Interfaces ─────────────────────────────

export interface FeedbackInfo {
  agreeToNotifications: boolean;
  hasScheduledMeeting: boolean;
  preferredMeetingDate: string;
  finalQuestion: string;
}

// ─── Context Type ───────────────────────────────────

interface FormContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  personalInfo: PersonalInfo;
  setPersonalInfo: (data: Partial<PersonalInfo>) => void;

  serviceType: ServiceType;
  setServiceType: (data: Partial<ServiceType>) => void;

  detailedInfo: DetailedPersonalInfo;
  setDetailedInfo: (data: Partial<DetailedPersonalInfo>) => void;

  spouseInfo: SpouseDetailedInfo;
  setSpouseInfo: (data: Partial<SpouseDetailedInfo>) => void;

  businessInfo: BusinessInfo;
  setBusinessInfo: (data: Partial<BusinessInfo>) => void;

  spouseBusinessInfo: BusinessInfo;
  setSpouseBusinessInfo: (data: Partial<BusinessInfo>) => void;

  documentsInfo: DocumentsInfo;
  setDocumentsInfo: (data: Partial<DocumentsInfo>) => void;

  feedbackInfo: FeedbackInfo;
  setFeedbackInfo: (data: Partial<FeedbackInfo>) => void;

  sendToWebhook: (
    url: string,
    data: any,
    options?: { silent?: boolean }
  ) => Promise<boolean>;
}

// ─── Context ────────────────────────────────────────

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error("useFormContext must be used within FormProvider");
  return context;
};

// ─── Provider ───────────────────────────────────────

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [personalInfo, setPI] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    maritalStatus: "",
    spouseName: "",
    agreeToMessages: false,
    agreeToPrivacy: false,
    otherPurposeDetails: "",
  });
  const [serviceType, setST] = useState<ServiceType>({
    userPurposes: [],
    spousePurposes: [],
    userPurposeStatus: {},
    spousePurposeStatus: {},
  });

  // Step 2
  const [detailedInfo, setDI] = useState<DetailedPersonalInfo>({
    idNumber: "",
    homePhone: "",
    gender: "",
    birthDate: "",
    availability: "",
    detailedMaritalStatus: "",
    additionalIdTypes: [],
    additionalIdNumber: "",
    additionalLicenseNumber: "",
    additionalPassportNumber: "",
  });
  const [spouseInfo, setSI] = useState<SpouseDetailedInfo>({
    idNumber: "",
    email: "",
    phone: "",
    gender: "",
    additionalIdTypes: [],
    additionalIdNumber: "",
    additionalLicenseNumber: "",
    additionalPassportNumber: "",
    availability: "",
  });
  const [businessInfo, setBI] = useState<BusinessInfo>({});
  const [spouseBusinessInfo, setSBI] = useState<BusinessInfo>({});

  // Step 3
  const [documentsInfo, setDocsI] = useState<DocumentsInfo>({});

  // Step 4
  const [feedbackInfo, setFI] = useState<FeedbackInfo>({
    agreeToNotifications: false,
    hasScheduledMeeting: false,
    preferredMeetingDate: "",
    finalQuestion: "",
  });

  // ─── Setters ──────────────────────────
  const setPersonalInfo = (d: Partial<PersonalInfo>) =>
    setPI((p) => ({ ...p, ...d }));
  const setServiceType = (d: Partial<ServiceType>) =>
    setST((p) => ({ ...p, ...d }));
  const setDetailedInfo = (d: Partial<DetailedPersonalInfo>) =>
    setDI((p) => ({ ...p, ...d }));
  const setSpouseInfo = (d: Partial<SpouseDetailedInfo>) =>
    setSI((p) => ({ ...p, ...d }));
  const setBusinessInfo = (d: Partial<BusinessInfo>) =>
    setBI((p) => ({ ...p, ...d }));
  const setSpouseBusinessInfo = (d: Partial<BusinessInfo>) =>
    setSBI((p) => ({ ...p, ...d }));
  const setDocumentsInfo = (d: Partial<DocumentsInfo>) =>
    setDocsI((p) => ({ ...p, ...d }));
  const setFeedbackInfo = (d: Partial<FeedbackInfo>) =>
    setFI((p) => ({ ...p, ...d }));

  // ─── Session Storage: Save ────────────
  useEffect(() => {
    sessionStorage.setItem("formStep", String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    sessionStorage.setItem("personalInfo", JSON.stringify(personalInfo));
  }, [personalInfo]);

  useEffect(() => {
    sessionStorage.setItem("serviceType", JSON.stringify(serviceType));
  }, [serviceType]);

  useEffect(() => {
    sessionStorage.setItem("detailedInfo", JSON.stringify(detailedInfo));
  }, [detailedInfo]);

  useEffect(() => {
    sessionStorage.setItem("spouseInfo", JSON.stringify(spouseInfo));
  }, [spouseInfo]);

  useEffect(() => {
    const stripFiles = (obj: any) => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v instanceof File || (Array.isArray(v) && v[0] instanceof File))
          continue;
        clean[k] = v;
      }
      return clean;
    };
    sessionStorage.setItem("businessInfo", JSON.stringify(stripFiles(businessInfo)));
  }, [businessInfo]);

  useEffect(() => {
    const stripFiles = (obj: any) => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v instanceof File || (Array.isArray(v) && v[0] instanceof File))
          continue;
        clean[k] = v;
      }
      return clean;
    };
    sessionStorage.setItem(
      "spouseBusinessInfo",
      JSON.stringify(stripFiles(spouseBusinessInfo))
    );
  }, [spouseBusinessInfo]);

  useEffect(() => {
    const stripFiles = (obj: any) => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v instanceof File || (Array.isArray(v) && v[0] instanceof File))
          continue;
        clean[k] = v;
      }
      return clean;
    };
    sessionStorage.setItem(
      "documentsInfo",
      JSON.stringify(stripFiles(documentsInfo))
    );
  }, [documentsInfo]);

  useEffect(() => {
    sessionStorage.setItem("feedbackInfo", JSON.stringify(feedbackInfo));
  }, [feedbackInfo]);

  // ─── Session Storage: Load ────────────
  useEffect(() => {
    const parse = <T,>(key: string): T | null => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    };

    try {
      const step = Number(sessionStorage.getItem("formStep"));
      if (step >= 1 && step <= 5) setCurrentStep(step);

      const pi = parse<PersonalInfo>("personalInfo");
      if (pi) setPI((prev) => ({ ...prev, ...pi }));

      const st = parse<ServiceType>("serviceType");
      if (st)
        setST({
          userPurposes: Array.isArray(st.userPurposes) ? st.userPurposes : [],
          spousePurposes: Array.isArray(st.spousePurposes)
            ? st.spousePurposes
            : [],
          userPurposeStatus: st.userPurposeStatus || {},
          spousePurposeStatus: st.spousePurposeStatus || {},
        });

      const di = parse<DetailedPersonalInfo>("detailedInfo");
      if (di) setDI((prev) => ({ ...prev, ...di }));

      const si = parse<SpouseDetailedInfo>("spouseInfo");
      if (si) setSI((prev) => ({ ...prev, ...si }));

      const bi = parse<BusinessInfo>("businessInfo");
      if (bi) setBI((prev) => ({ ...prev, ...bi }));

      const sbi = parse<BusinessInfo>("spouseBusinessInfo");
      if (sbi) setSBI((prev) => ({ ...prev, ...sbi }));

      const docs = parse<DocumentsInfo>("documentsInfo");
      if (docs) setDocsI((prev) => ({ ...prev, ...docs }));

      const fi = parse<FeedbackInfo>("feedbackInfo");
      if (fi) setFI((prev) => ({ ...prev, ...fi }));
    } catch (e) {
      console.error("Failed loading form state:", e);
      sessionStorage.clear();
      setCurrentStep(1);
    }
  }, []);

  // ─── Webhook ──────────────────────────
  const sendToWebhook = async (
    url: string,
    data: any,
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    const N8N_ROUTES = [
      {
        prefix: "https://n8n.link-up.co.il/webhook/",
        toName: (path: string) => path,
      },
      {
        prefix: "https://n8n.chasida.biz/webhook/",
        toName: (path: string) => `chasida-${path}`,
      },
    ] as const;

    const notify = !options?.silent;
    const route = N8N_ROUTES.find((r) => url.startsWith(r.prefix));

    try {
      if (route) {
        const path = url.slice(route.prefix.length);
        const name = route.toName(path);

        const { data: res, error } = await supabase.functions.invoke(
          "n8n-proxy",
          { body: { name, payload: data } }
        );

        if (error) throw new Error(error.message);
        if (!res?.ok) {
          if (notify)
            toast.error(
              `שגיאה בשליחת הנתונים (סטטוס ${res?.upstream_status ?? "?"})`
            );
          return false;
        }

        if (notify) toast.success("הנתונים נשלחו בהצלחה");
        return true;
      }

      // Fallback: direct call
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (response.ok) {
          if (notify) toast.success("הנתונים נשלחו בהצלחה");
          return true;
        }

        if (notify)
          toast.error(`שגיאה בשליחת הנתונים (סטטוס ${response.status})`);
        return false;
      } catch (error: any) {
        const isAbort = error?.name === "AbortError";
        if (notify)
          toast.error(isAbort ? "פג זמן החיבור לשרת" : "שגיאה בחיבור לשרת");
        return false;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error: any) {
      console.error("Webhook error:", error);
      if (notify) toast.error("שגיאה בחיבור לשרת");
      return false;
    }
  };

  // ─── Render ───────────────────────────
  return (
    <FormContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        personalInfo,
        setPersonalInfo,
        serviceType,
        setServiceType,
        detailedInfo,
        setDetailedInfo,
        spouseInfo,
        setSpouseInfo,
        businessInfo,
        setBusinessInfo,
        spouseBusinessInfo,
        setSpouseBusinessInfo,
        documentsInfo,
        setDocumentsInfo,
        feedbackInfo,
        setFeedbackInfo,
        sendToWebhook,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
