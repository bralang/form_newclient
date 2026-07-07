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
  userWarCompensationEntities?: ("business" | "company" | "nonprofit")[];
  spouseWarCompensationEntities?: ("business" | "company" | "nonprofit")[];
}

// ─── Step 2 Interfaces ─────────────────────────────

export type GovPortalIdMethod = "password" | "smartCard" | "biometricId" | "fastLogin";

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
  govPortalIdMethods?: GovPortalIdMethod[];
  govPortalPassword?: string;
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
  govPortalIdMethods?: GovPortalIdMethod[];
  govPortalPassword?: string;
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
  existingPartners?: Array<{
    name: string;
    idNumber: string;
    percentage: string;
    phone: string;
    email: string;
    address: string;
    isVatRepresentative: boolean;
  }>;
  existingPartnershipAgreementFile?: File;


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
  existingCompanyFillMode?: "self" | "office" | "";
  newCompanyCount?: number;
  existingCompanies?: Array<{
    name: string;
    companyNumber: string;
    hasTaxFile?: boolean;
    hasBankAccount?: boolean;
    bankDetails?: {
      bank: string;
      branch: string;
      accountNumber: string;
      accountHolder: string;
    };
    bankConfirmationFile?: File;
    activityStartDate?: string;
    hasEmployees?: boolean;
    shareholderType?: "alone" | "other" | "";
    shareholderCount?: number;
    shareholders?: Array<{
      isSelf?: boolean;
      isSpouse?: boolean;
      name: string;
      idNumber: string;
      idFile?: File;
      phone: string;
      email: string;
      additionalIdType?: "parentId" | "license" | "passport" | "";
      additionalIdNumber?: string;
      additionalIdFile?: File;
      percentage: string;
    }>;
    spouseIsShareholder?: boolean;
    selfViaCompany?: any;
    selfViaCompanyIsNew?: boolean;
  }>;
  newCompanies?: Array<{
    existsInRegistrar?: boolean;
    requestedName1?: string;
    requestedName2?: string;
    requestedName3?: string;
    shareholderType?: "alone" | "other" | "";
    shareholderCount?: number;
    shareholders?: Array<{
      isSelf?: boolean;
      isSpouse?: boolean;
      name: string;
      idNumber: string;
      idFile?: File;
      phone: string;
      email: string;
      additionalIdType?: "parentId" | "license" | "passport" | "";
      additionalIdNumber?: string;
      additionalIdFile?: File;
      percentage: string;
    }>;
    spouseIsShareholder?: boolean;
    planningEmployees?: boolean;
  }>;
}

// ─── Nonprofit Interfaces ───────────────────────────

export interface NonprofitBoardMember {
  name: string;
  idNumber: string;
  idFile?: File;
  email: string;
  phone: string;
  address: string;
  city?: string;
  zip?: string;
  isAuthorizedSigner: boolean;
  isAuditCommittee?: boolean;
}

export interface NonprofitAuditMember {
  name: string;
  idNumber: string;
}

export interface NonprofitInfo {
  // New nonprofit
  requestedName1?: string;
  requestedName2?: string;
  requestedName3?: string;
  objectives?: string;
  boardMemberCount?: number;
  boardMembers?: NonprofitBoardMember[];
  auditCommittee?: NonprofitAuditMember[];
  // Government portal identification (for one of the board members)
  govPortalBoardMemberIdx?: number;
  govPortalBoardMemberIdxs?: number[];
  govPortalIdMethods?: GovPortalIdMethod[];
  govPortalPassword?: string;

  // Existing nonprofit
  hasTaxFile?: boolean;
  nonprofitName?: string;
  nonprofitNumber?: string;
  existingBoardMemberCount?: number;
  existingBoardMemberNames?: string[];
  // Full board details (used when no tax file yet)
  existingBoardMembers?: NonprofitBoardMember[];
  // Index of the board member used for representation (when tax file exists)
  representativeBoardMemberIdx?: number;
  // Existing nonprofit (without tax file): plans to hire employees
  plansEmployees?: boolean;
  // Existing nonprofit (without tax file): bank account
  hasBankAccount?: boolean;
  bankDetails?: { bank?: string; branch?: string; accountNumber?: string; accountHolder?: string };
  bankFile?: File;
  // Existing nonprofit (with tax file): single representative member with optional additional ID
  representativeMember?: NonprofitBoardMember & {
    city?: string;
    zip?: string;
    additionalIdTypes?: ("parentId" | "license" | "passport")[];
    additionalIdNumber?: string;
    additionalLicenseNumber?: string;
    additionalPassportNumber?: string;
    additionalIdFile?: File;
    additionalLicenseFile?: File;
    additionalPassportFile?: File;
  };
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

  nonprofitInfo: NonprofitInfo;
  setNonprofitInfo: (data: Partial<NonprofitInfo>) => void;

  spouseNonprofitInfo: NonprofitInfo;
  setSpouseNonprofitInfo: (data: Partial<NonprofitInfo>) => void;

  documentsInfo: DocumentsInfo;
  setDocumentsInfo: (data: Partial<DocumentsInfo>) => void;

  feedbackInfo: FeedbackInfo;
  setFeedbackInfo: (data: Partial<FeedbackInfo>) => void;

  sendToWebhook: (
    url: string,
    data: any,
    options?: { silent?: boolean }
  ) => Promise<boolean>;

  saveFormData: (overrideStatus?: string) => Promise<void>;

  isLoading: boolean;
  questionnaireId: number | null;
}

// ─── Context ────────────────────────────────────────

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error("useFormContext must be used within FormProvider");
  return context;
};

// ─── Helpers ────────────────────────────────────────

const mapMaritalStatus = (v: string | null): "single" | "married" | "" => {
  if (!v) return "";
  const s = v.toLowerCase();
  if (s === "married" || s === "נשוי" || s === "נשואה") return "married";
  if (s === "single" || s === "רווק" || s === "רווקה") return "single";
  return "";
};

const mapGender = (v: string | null): "male" | "female" | "" => {
  if (!v) return "";
  const g = v.toLowerCase();
  if (g === "male" || g === "זכר" || g === "ז") return "male";
  if (g === "female" || g === "נקבה" || g === "נ") return "female";
  return "";
};

// ─── Provider ───────────────────────────────────────

export const FormProvider: React.FC<{
  children: React.ReactNode;
  questionnaireId?: number | null;
}> = ({ children, questionnaireId = null }) => {
  const [isLoading, setIsLoading] = useState(!!questionnaireId);
  const [currentStep, setCurrentStepRaw] = useState(1);
  const setCurrentStep = (step: number) => {
    setCurrentStepRaw(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const [nonprofitInfo, setNI] = useState<NonprofitInfo>({});
  const [spouseNonprofitInfo, setSNI] = useState<NonprofitInfo>({});

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
  const setNonprofitInfo = (d: Partial<NonprofitInfo>) =>
    setNI((p) => ({ ...p, ...d }));
  const setSpouseNonprofitInfo = (d: Partial<NonprofitInfo>) =>
    setSNI((p) => ({ ...p, ...d }));
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
        if (v instanceof File || (Array.isArray(v) && v[0] instanceof File)) continue;
        if (Array.isArray(v)) {
          clean[k] = v.map((item: any) => {
            if (typeof item === "object" && item !== null) {
              const c: Record<string, any> = {};
              for (const [ik, iv] of Object.entries(item)) {
                if (iv instanceof File) continue;
                c[ik] = iv;
              }
              return c;
            }
            return item;
          });
        } else {
          clean[k] = v;
        }
      }
      return clean;
    };
    sessionStorage.setItem("nonprofitInfo", JSON.stringify(stripFiles(nonprofitInfo)));
  }, [nonprofitInfo]);

  useEffect(() => {
    const stripFiles = (obj: any) => {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v instanceof File || (Array.isArray(v) && v[0] instanceof File)) continue;
        if (Array.isArray(v)) {
          clean[k] = v.map((item: any) => {
            if (typeof item === "object" && item !== null) {
              const c: Record<string, any> = {};
              for (const [ik, iv] of Object.entries(item)) {
                if (iv instanceof File) continue;
                c[ik] = iv;
              }
              return c;
            }
            return item;
          });
        } else {
          clean[k] = v;
        }
      }
      return clean;
    };
    sessionStorage.setItem("spouseNonprofitInfo", JSON.stringify(stripFiles(spouseNonprofitInfo)));
  }, [spouseNonprofitInfo]);

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

  // ─── Load from Supabase ───────────────
  useEffect(() => {
    if (!questionnaireId) return;

    const load = async () => {
      try {
        const { data: questionnaire, error } = await (supabase as any)
          .from("client_questionnaire")
          .select("*")
          .eq("id", questionnaireId)
          .single();

        if (error || !questionnaire) {
          toast.error("שאלון לא נמצא");
          return;
        }

        // 1. קודם מחילים form_data (המצב האחרון שנשמר)
        const fd = questionnaire.form_data;
        if (fd && typeof fd === "object" && Object.keys(fd).length > 0) {
          if (fd.personalInfo) setPI((prev) => ({ ...prev, ...fd.personalInfo }));
          if (fd.serviceType) setST(fd.serviceType);
          if (fd.detailedInfo) setDI((prev) => ({ ...prev, ...fd.detailedInfo }));
          if (fd.spouseInfo) setSI((prev) => ({ ...prev, ...fd.spouseInfo }));
          if (fd.businessInfo) setBI((prev) => ({ ...prev, ...fd.businessInfo }));
          if (fd.spouseBusinessInfo) setSBI((prev) => ({ ...prev, ...fd.spouseBusinessInfo }));
          if (fd.nonprofitInfo) setNI((prev) => ({ ...prev, ...fd.nonprofitInfo }));
          if (fd.spouseNonprofitInfo) setSNI((prev) => ({ ...prev, ...fd.spouseNonprofitInfo }));
          if (fd.documentsInfo) setDocsI((prev) => ({ ...prev, ...fd.documentsInfo }));
          if (fd.feedbackInfo) setFI((prev) => ({ ...prev, ...fd.feedbackInfo }));
          if (fd.currentStep && fd.currentStep >= 1 && fd.currentStep <= 5) {
            setCurrentStepRaw(fd.currentStep);
          }
        }

        // 2. אחר כך persons ממלא רק שדות ריקים (טבלת persons היא המקור הסמכותי לפרטי הבסיס)
        if (questionnaire.lead_id) {
          const { data: lead } = await (supabase as any)
            .from("leads")
            .select("*")
            .eq("lead_id", questionnaire.lead_id)
            .single();

          if (lead?.person_id) {
            const { data: person } = await (supabase as any)
              .from("persons")
              .select("*")
              .eq("person_id", lead.person_id)
              .single();

            if (person) {
              setPI((prev) => ({
                ...prev,
                firstName: prev.firstName || person.first_name || "",
                lastName: prev.lastName || person.last_name || "",
                phone: prev.phone || person.mobile || "",
                email: prev.email || person.email || "",
                maritalStatus: prev.maritalStatus || mapMaritalStatus(person.marital_status),
                ref: prev.ref || person.ref || "",
                agreeToMessages: prev.agreeToMessages || person.Receiving_messages || false,
              }));

              setDI((prev) => ({
                ...prev,
                idNumber: prev.idNumber || person.id_number || "",
                homePhone: prev.homePhone || person.phone || "",
                gender: prev.gender || mapGender(person.gender),
                birthDate: prev.birthDate || person.birth_date || "",
              }));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load questionnaire:", e);
        toast.error("שגיאה בטעינת השאלון");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [questionnaireId]);

  // ─── Session Storage: Load ────────────
  useEffect(() => {
    if (questionnaireId) return; // skip when loading from DB

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

      const ni = parse<NonprofitInfo>("nonprofitInfo");
      if (ni) setNI((prev) => ({ ...prev, ...ni }));

      const sni = parse<NonprofitInfo>("spouseNonprofitInfo");
      if (sni) setSNI((prev) => ({ ...prev, ...sni }));

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

  // ─── Save to Supabase ─────────────────
  const saveFormData = async (overrideStatus?: string): Promise<void> => {
    if (!questionnaireId) return;

    const deepStrip = (obj: any): any => {
      if (obj instanceof File) return undefined;
      if (Array.isArray(obj)) {
        const arr = obj.map(deepStrip).filter((v) => v !== undefined);
        return arr;
      }
      if (obj && typeof obj === "object") {
        const result: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
          const stripped = deepStrip(v);
          if (stripped !== undefined) result[k] = stripped;
        }
        return result;
      }
      return obj;
    };

    const snapshot = deepStrip({
      personalInfo,
      serviceType,
      detailedInfo,
      spouseInfo,
      businessInfo,
      spouseBusinessInfo,
      nonprofitInfo,
      spouseNonprofitInfo,
      documentsInfo,
      feedbackInfo,
      currentStep,
    });

    const update: Record<string, any> = {
      form_data: snapshot,
      updated_at: new Date().toISOString(),
    };
    if (overrideStatus) update.status = overrideStatus;

    const { error } = await (supabase as any)
      .from("client_questionnaire")
      .update(update)
      .eq("id", questionnaireId);

    if (error) console.error("Failed to save form data:", error);
  };

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
        nonprofitInfo,
        setNonprofitInfo,
        spouseNonprofitInfo,
        setSpouseNonprofitInfo,
        feedbackInfo,
        setFeedbackInfo,
        sendToWebhook,
        saveFormData,
        isLoading,
        questionnaireId,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
