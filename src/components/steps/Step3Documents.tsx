import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormNavigation } from "@/components/FormNavigation";
import { useEffect, useState } from "react";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UploadedFile = { fileId: string; fileName: string; webViewLink: string };

const DRIVE_UPLOAD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-upload`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const MAX_UPLOAD_SIZE_MB = 8;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;

// Large phone photos get downsized/re-encoded client-side before upload — this keeps
// the server's memory-constrained Edge Function well under its cap without needing
// a bigger raw file-size ceiling. PDFs/docs are left untouched.
const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  if (file.size <= MAX_UPLOAD_SIZE_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (e) {
    console.error("Image compression failed, uploading original file:", e);
    return file;
  }
};

export const Step3Documents = () => {
  const {
    personalInfo,
    detailedInfo,
    spouseInfo,
    serviceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
    nonprofitInfo,
    setNonprofitInfo,
    spouseNonprofitInfo,
    setSpouseNonprofitInfo,
    documentsInfo,
    setDocumentsInfo,
    setCurrentStep,
    sendToWebhook,
    saveFormData,
    questionnaireId,
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"upload" | "email">("upload");

  // ─── Drive folder + already-uploaded files ───
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, { kind: "uploading" } | { kind: "error"; message: string }>>({});

  useEffect(() => {
    if (!questionnaireId) return;
    const clientName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || "לקוח";

    (async () => {
      try {
        const { data: ensureData, error: ensureError } = await supabase.functions.invoke("drive-upload", {
          body: { action: "ensureFolder", questionnaireId, clientName },
        });
        if (ensureError || !ensureData?.ok) return;
        setDriveFolderId(ensureData.folderId);

        const { data: listData, error: listError } = await supabase.functions.invoke("drive-upload", {
          body: { action: "listFiles", folderId: ensureData.folderId },
        });
        if (!listError && listData?.ok) {
          setUploadedFiles(listData.files || {});
        }
      } catch (e) {
        console.error("Drive folder init failed:", e);
      }
    })();
  }, [questionnaireId]);

  const uploadFileToDrive = async (fieldKey: string, file: File, driveLabel: string) => {
    if (!driveFolderId) return;
    setUploadStatus((prev) => ({ ...prev, [fieldKey]: { kind: "uploading" } }));
    try {
      const processedFile = await compressImageIfNeeded(file);
      const clientName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || "לקוח";
      const ext = processedFile.name.match(/\.[^./\\]+$/)?.[0] || "";
      const driveFileName = `${clientName} - ${driveLabel}${ext}`;

      const form = new FormData();
      form.append("action", "uploadFile");
      form.append("folderId", driveFolderId);
      form.append("questionnaireId", String(questionnaireId ?? ""));
      form.append("fieldKey", fieldKey);
      form.append("fileName", driveFileName);
      form.append("file", processedFile, driveFileName);

      const res = await fetch(DRIVE_UPLOAD_URL, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Unknown error");
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldKey]: { fileId: data.fileId, fileName: data.fileName, webViewLink: data.webViewLink },
      }));
      setUploadStatus((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    } catch (e: any) {
      console.error(`Drive upload failed for ${fieldKey}:`, e);
      const message = e?.message?.includes("File too large")
        ? `הקובץ גדול מדי (מקסימום ${(MAX_UPLOAD_SIZE_MB)}MB) — נסו לצלם/לשמור באיכות נמוכה יותר`
        : "שגיאה בהעלאה לדרייב";
      setUploadStatus((prev) => ({ ...prev, [fieldKey]: { kind: "error", message } }));
    }
  };

  const isMarried = personalInfo.maritalStatus === "married";
  const userPurposes = serviceType.userPurposes;
  const spousePurposes = serviceType.spousePurposes;

  const userHasNewBusiness = userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("new");
  const spouseHasNewBusiness = spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("new");

  const userHasAuthorized = userHasNewBusiness && businessInfo.businessType === "authorized";
  const spouseHasAuthorized = spouseHasNewBusiness && spouseBusinessInfo.businessType === "authorized";

  const userNeedsLease = userHasNewBusiness && businessInfo.isHomeOffice === false;
  const spouseNeedsLease = spouseHasNewBusiness && spouseBusinessInfo.isHomeOffice === false;

  const userHasCompany = userPurposes.includes("company");
  const spouseHasCompany = spousePurposes.includes("company");

  const hasExistingCompanies = (businessInfo.existingCompanyCount || 0) > 0 || (spouseBusinessInfo.existingCompanyCount || 0) > 0;
  const hasNewCompaniesInRegistrar = businessInfo.newCompanies?.some((c) => c.existsInRegistrar) || spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar);
  const hasNewCompaniesNotInRegistrarButInRegistrar = businessInfo.newCompanies?.some((c) => c.existsInRegistrar === true) || spouseBusinessInfo.newCompanies?.some((c) => c.existsInRegistrar === true);

  const userHasExistingBusiness = userPurposes.includes("business") && serviceType.userPurposeStatus?.business?.includes("existing");
  const spouseHasExistingBusiness = spousePurposes.includes("business") && serviceType.spousePurposeStatus?.business?.includes("existing");

  const userNewPartnership = userHasNewBusiness && businessInfo.ownershipType === "partnership" && (businessInfo.partners?.length || 0) > 0;
  const userExistingPartnership = userHasExistingBusiness && businessInfo.ownershipType === "partnership" && (businessInfo.existingPartners?.length || 0) > 0;
  const spouseNewPartnership = spouseHasNewBusiness && spouseBusinessInfo.ownershipType === "partnership" && (spouseBusinessInfo.partners?.length || 0) > 0;
  const spouseExistingPartnership = spouseHasExistingBusiness && spouseBusinessInfo.ownershipType === "partnership" && (spouseBusinessInfo.existingPartners?.length || 0) > 0;

  // Builds the same per-person document checklist shown in the upload section below,
  // as plain {person, label} rows — used to send a detailed list by email instead.
  const buildDocumentList = (): { person: string; label: string }[] => {
    const items: { person: string; label: string }[] = [];
    const userName = personalInfo.firstName || "אני";
    const spouseName = personalInfo.spouseName || "בן/בת הזוג";

    items.push({ person: userName, label: "צילום ת.ז. + ספח" });
    if (detailedInfo.additionalIdTypes?.includes("license")) items.push({ person: userName, label: "רישיון נהיגה" });
    if (detailedInfo.additionalIdTypes?.includes("passport")) items.push({ person: userName, label: "דרכון" });

    if (isMarried) {
      items.push({ person: spouseName, label: "צילום ת.ז. + ספח" });
      if (spouseInfo.additionalIdTypes?.includes("license")) items.push({ person: spouseName, label: "רישיון נהיגה" });
      if (spouseInfo.additionalIdTypes?.includes("passport")) items.push({ person: spouseName, label: "דרכון" });
    }

    if (userHasAuthorized) items.push({ person: userName, label: "אישור ניהול חשבון או צילום שיק" });
    if (spouseHasAuthorized) items.push({ person: spouseName, label: "אישור ניהול חשבון או צילום שיק" });

    if (userNeedsLease) items.push({ person: userName, label: "הסכם שכירות לעסק" });
    if (spouseNeedsLease) items.push({ person: spouseName, label: "הסכם שכירות לעסק" });

    if (userNewPartnership) items.push({ person: userName, label: userExistingPartnership ? "הסכם שותפות – עסק חדש" : "הסכם שותפות" });
    if (userExistingPartnership) items.push({ person: userName, label: userNewPartnership ? "הסכם שותפות – עסק קיים" : "הסכם שותפות" });
    if (spouseNewPartnership) items.push({ person: spouseName, label: spouseExistingPartnership ? "הסכם שותפות – עסק חדש" : "הסכם שותפות" });
    if (spouseExistingPartnership) items.push({ person: spouseName, label: spouseNewPartnership ? "הסכם שותפות – עסק קיים" : "הסכם שותפות" });

    (["user", "spouse"] as const).forEach((who) => {
      const bi = who === "user" ? businessInfo : spouseBusinessInfo;
      const name = who === "user" ? userName : spouseName;
      if (bi.existingCompanyFillMode !== "self") return;
      (bi.existingCompanies || []).forEach((company: any, idx: number) => {
        const compName = company.name || `חברה קיימת #${idx + 1}`;
        items.push({ person: name, label: `נסח רשם החברות – ${compName}` });
        if (company.hasBankAccount === true || company.bankDetails?.accountNumber) {
          items.push({ person: name, label: `אישור ניהול חשבון או צילום שיק – ${compName}` });
        }
      });
    });

    (["user", "spouse"] as const).forEach((who) => {
      const info = who === "user" ? businessInfo : spouseBusinessInfo;
      const purposes = who === "user" ? userPurposes : spousePurposes;
      const name = who === "user" ? userName : spouseName;
      if (!purposes.includes("company")) return;

      const pushPersonOwner = (po: any, context: string) => {
        if (!po || !po.name) return;
        items.push({ person: name, label: `צילום ת.ז. + ספח של ${po.name}${context ? ` (${context})` : ""}` });
        if (po.additionalIdType) {
          const t = po.additionalIdType === "license" ? "רישיון נהיגה" : po.additionalIdType === "passport" ? "דרכון" : "ת.ז. הורה";
          items.push({ person: name, label: `צילום ${t} של ${po.name}${context ? ` (${context})` : ""}` });
        }
      };
      const pushChild = (childCompany: any, context: string) => {
        if (!childCompany) return;
        const ctx = childCompany.companyName || childCompany.requestedName1 || context;
        pushPersonOwner(childCompany.personOwner, ctx);
        if (childCompany.childCompany) pushChild(childCompany.childCompany, ctx);
      };
      const pushShareholders = (companyList: any[]) => {
        (companyList || []).forEach((company: any, cIdx: number) => {
          const compName = company.name || company.requestedName1 || `חברה #${cIdx + 1}`;
          (company.shareholders || []).forEach((sh: any) => {
            if (sh.isSelf || sh.isSpouse) return;
            if ((sh.holderType || "person") === "person" && sh.name) {
              items.push({ person: name, label: `צילום ת.ז. + ספח של ${sh.name} (${compName})` });
              if (sh.additionalIdType) {
                const t = sh.additionalIdType === "license" ? "רישיון נהיגה" : sh.additionalIdType === "passport" ? "דרכון" : "ת.ז. הורה";
                items.push({ person: name, label: `צילום ${t} של ${sh.name} (${compName})` });
              }
            } else if (sh.holderType === "company") {
              pushPersonOwner(sh.personOwner, sh.companyName || compName);
              if (sh.childCompany) pushChild(sh.childCompany, sh.companyName || compName);
            }
          });
        });
      };
      pushShareholders(info.existingCompanies || []);
      pushShareholders(info.newCompanies || []);
    });

    (["user", "spouse"] as const).forEach((who) => {
      const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
      const purposes = who === "user" ? userPurposes : spousePurposes;
      const name = who === "user" ? userName : spouseName;
      if (!purposes.includes("nonprofit")) return;

      const rep = info.representativeMember;
      const hasRep = !!rep && info.hasTaxFile === true;
      if (hasRep) {
        const types = (rep as any).additionalIdTypes as string[] | undefined;
        if (types?.includes("passport")) items.push({ person: name, label: `צילום דרכון – ${rep!.name || "חבר הועד"}` });
        if (types?.includes("license")) items.push({ person: name, label: `צילום רישיון נהיגה – ${rep!.name || "חבר הועד"}` });
        if (types?.includes("parentId")) items.push({ person: name, label: `צילום ת.ז. הורה – ${rep!.name || "חבר הועד"}` });
      }

      (info.boardMembers || []).forEach((m: any, idx: number) => {
        items.push({ person: name, label: `צילום ת.ז. + ספח של ${m.name || `חבר ועד #${idx + 1}`}` });
      });
      (info.existingBoardMembers || []).forEach((m: any, idx: number) => {
        items.push({ person: name, label: `צילום ת.ז. + ספח של ${m.name || `חבר ועד #${idx + 1}`}` });
      });
      if (hasRep) {
        items.push({ person: name, label: `צילום ת.ז. + ספח של ${rep!.name || "חבר הועד שיופיע בייצוג"}` });
      }

      if (info.hasTaxFile === false && info.hasBankAccount === true) {
        items.push({ person: name, label: "אישור ניהול חשבון או צילום שיק של העמותה" });
      }
    });

    return items;
  };

  const handleSendEmailList = async (email: string) => {
    await sendToWebhook(
      "https://n8n.chasida.biz/webhook/sendEmailWithForms",
      { email, personalInfo, serviceType, documentList: buildDocumentList() },
      { silent: false }
    );
  };

  const handleNext = async () => {
    setLoading(true);
    await Promise.all([
      sendToWebhook(
        "https://n8n.chasida.biz/webhook/client-intake-step3",
        { documentsInfo, personalInfo },
        { silent: true }
      ),
      saveFormData(),
    ]);
    setLoading(false);
    setCurrentStep(5);
  };

  const FileUpload = ({ id, label, multiple = false, onChange }: { id: string; label: string; multiple?: boolean; onChange: (files: FileList | null) => void }) => {
    const cleanLabel = label.replace(/\s*\*.*$/, "").replace(/\s*\(.*$/, "").trim() || id;

    const handleChange = (files: FileList | null) => {
      onChange(files);
      if (!files || files.length === 0) return;
      Array.from(files).forEach((file, idx) => {
        const fieldKey = multiple ? `${id}-${idx}` : id;
        const driveLabel = multiple ? `${cleanLabel} (${idx + 1})` : cleanLabel;
        uploadFileToDrive(fieldKey, file, driveLabel);
      });
    };

    const relevantKeys = multiple
      ? Array.from(
          new Set([
            ...Object.keys(uploadedFiles).filter((k) => k.startsWith(`${id}-`)),
            ...Object.keys(uploadStatus).filter((k) => k.startsWith(`${id}-`)),
          ])
        ).sort()
      : [id];

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple={multiple}
          onChange={(e) => handleChange(e.target.files)}
        />
        {relevantKeys.map((key) => {
          const uploaded = uploadedFiles[key];
          const status = uploadStatus[key];
          if (!uploaded && !status) return null;
          return (
            <p key={key} className="text-xs flex items-center gap-1">
              {status?.kind === "uploading" && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> מעלה לדרייב...
                </span>
              )}
              {status?.kind === "error" && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {status.message}
                </span>
              )}
              {uploaded && !status && (
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> כבר הועלה: {uploaded.fileName}{" "}
                  <a href={uploaded.webViewLink} target="_blank" rel="noreferrer" className="underline">
                    (צפייה)
                  </a>
                </span>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">עדכון מסמכים</h2>
        <div className="h-1 w-20 bg-primary rounded-full" />
      </div>

      {/* Marketing Text */}
      <div className="p-5 bg-gradient-to-r from-primary/5 to-secondary/20 rounded-xl border border-primary/10 space-y-3">
        <h3 className="text-xl font-bold text-foreground">מסכימים להרוויח יותר מהעסק שלכם?</h3>
        <p className="text-muted-foreground">מסמיכים אותנו להיות המייצגים מול הרשויות?</p>
        <p className="text-sm text-muted-foreground">המסמכים שתעלו בשלב זה יתנו לנו את הרשות להוציא טופסי ייצוג לחתימה.</p>
        <p className="text-lg font-bold text-primary">מתקדמים…</p>
      </div>

      {/* ─── Document Prep Box ─── */}
      <div className="p-5 bg-primary/5 rounded-xl border border-primary/15 space-y-4">
        <h3 className="font-bold text-lg text-foreground">📋 כיצד תרצו להגיש את המסמכים?</h3>

        {/* 3 mutually-exclusive mode buttons */}
        <div className="flex flex-col gap-2">
          {/* Option 1 — Upload directly (default selected) */}
          <button
            type="button"
            onClick={() => setSubmissionMode("upload")}
            className={`w-full text-right flex items-center gap-3 p-3 rounded-lg border transition-colors ${submissionMode === "upload" ? "border-primary/50 bg-primary/10" : "border-border/50 bg-background/60 hover:bg-muted/40"}`}
          >
            <span className="text-primary shrink-0">📁</span>
            <span className="text-sm font-medium">העלאה ישירה כאן</span>
          </button>

          {/* Option 2 — Email list */}
          <button
            type="button"
            onClick={() => setSubmissionMode("email")}
            className={`w-full text-right flex items-center gap-3 p-3 rounded-lg border transition-colors ${submissionMode === "email" ? "border-primary/50 bg-primary/10" : "border-border/50 bg-background/60 hover:bg-muted/40"}`}
          >
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">אני רוצה לקבל רשימת מסמכים למייל</span>
          </button>
          {submissionMode === "email" && (
            <div className="mr-7 space-y-3">
              <p className="text-sm text-muted-foreground">
                הרשימה תישלח לכתובת <span className="font-semibold text-foreground">{personalInfo.email || "שהוזנה בעמוד הראשון"}</span>.
                {" "}לשינוי הכתובת יש לחזור לעמוד הראשון.
              </p>
              <Button
                size="sm"
                onClick={() => handleSendEmailList(personalInfo.email)}
                disabled={!personalInfo.email}
              >
                <Mail className="ml-2 h-4 w-4" />
                שלחו אל {personalInfo.email || "המייל שלי"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Document Uploads — only shown when "upload" mode is selected */}
      {submissionMode === "upload" && <div className="space-y-6">

        {/* User ID Documents */}
        <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
          <h3 className="font-bold text-lg text-foreground">
            מסמכי זיהוי – <span className="text-primary">{personalInfo.firstName || "שלי"}</span>
          </h3>

          <FileUpload
            id="idCardFiles"
            label="צילום ת.ז. + ספח * (ניתן להעלות מספר קבצים)"
            multiple
            onChange={(files) => setDocumentsInfo({ idCardFiles: files ? Array.from(files) : undefined })}
          />

          {detailedInfo.additionalIdTypes?.includes("license") && (
            <FileUpload
              id="licenseFile"
              label="העלאת רישיון נהיגה"
              onChange={(files) => setDocumentsInfo({ licenseFile: files?.[0] })}
            />
          )}
          {detailedInfo.additionalIdTypes?.includes("passport") && (
            <FileUpload
              id="passportFile"
              label="העלאת דרכון"
              onChange={(files) => setDocumentsInfo({ passportFile: files?.[0] })}
            />
          )}
        </div>

        {/* Spouse ID Documents */}
        {isMarried && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg text-foreground">
              מסמכי זיהוי – <span className="text-primary">{personalInfo.spouseName || "בן/בת הזוג"}</span>
            </h3>

            <FileUpload
              id="spouseIdCardFiles"
              label="צילום ת.ז. + ספח * (ניתן להעלות מספר קבצים)"
              multiple
              onChange={(files) => setDocumentsInfo({ spouseIdCardFiles: files ? Array.from(files) : undefined })}
            />

            {spouseInfo.additionalIdTypes?.includes("license") && (
              <FileUpload
                id="spouseLicenseFile"
                label="העלאת רישיון נהיגה"
                onChange={(files) => setDocumentsInfo({ spouseLicenseFile: files?.[0] })}
              />
            )}
            {spouseInfo.additionalIdTypes?.includes("passport") && (
              <FileUpload
                id="spousePassportFile"
                label="העלאת דרכון"
                onChange={(files) => setDocumentsInfo({ spousePassportFile: files?.[0] })}
              />
            )}
          </div>
        )}

        {/* Bank confirmation for authorized */}
        {userHasAuthorized && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">אישור ניהול חשבון – {personalInfo.firstName}</h3>
            <FileUpload
              id="bankConfFile"
              label="אישור ניהול חשבון או צילום שיק"
              onChange={(files) => setDocumentsInfo({ bankConfirmationFile: files?.[0] || undefined })}
            />
          </div>
        )}
        {spouseHasAuthorized && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">אישור ניהול חשבון – {personalInfo.spouseName}</h3>
            <FileUpload
              id="spouseBankConfFile"
              label="אישור ניהול חשבון או צילום שיק"
              onChange={(files) => setDocumentsInfo({ spouseBankConfirmationFile: files?.[0] || undefined })}
            />
          </div>
        )}

        {/* Lease agreement */}
        {userNeedsLease && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">הסכם שכירות לעסק – {personalInfo.firstName}</h3>
            <FileUpload
              id="leaseFile"
              label="העלאת הסכם שכירות"
              onChange={(files) => setDocumentsInfo({ leaseAgreementFile: files?.[0] || undefined })}
            />
          </div>
        )}
        {spouseNeedsLease && (
          <div className="space-y-3 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">הסכם שכירות לעסק – {personalInfo.spouseName}</h3>
            <FileUpload
              id="spouseLeaseFile"
              label="העלאת הסכם שכירות"
              onChange={(files) => setDocumentsInfo({ spouseLeaseAgreementFile: files?.[0] || undefined })}
            />
          </div>
        )}

        {/* Partnership agreement uploads */}
        {(userNewPartnership || userExistingPartnership) && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">מומלץ לצרף הסכם שותפות – {personalInfo.firstName}</h3>
            {userNewPartnership && (
              <FileUpload
                id="partnershipAgreementNew"
                label={userExistingPartnership ? "הסכם שותפות – עסק חדש" : "הסכם שותפות"}
                onChange={(files) => setBusinessInfo({ partnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
            {userExistingPartnership && (
              <FileUpload
                id="partnershipAgreementExisting"
                label={userNewPartnership ? "הסכם שותפות – עסק קיים" : "הסכם שותפות"}
                onChange={(files) => setBusinessInfo({ existingPartnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
          </div>
        )}
        {(spouseNewPartnership || spouseExistingPartnership) && (
          <div className="space-y-4 p-5 bg-muted/40 rounded-xl">
            <h3 className="font-bold text-lg">מומלץ לצרף הסכם שותפות – {personalInfo.spouseName}</h3>
            {spouseNewPartnership && (
              <FileUpload
                id="spousePartnershipAgreementNew"
                label={spouseExistingPartnership ? "הסכם שותפות – עסק חדש" : "הסכם שותפות"}
                onChange={(files) => setSpouseBusinessInfo({ partnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
            {spouseExistingPartnership && (
              <FileUpload
                id="spousePartnershipAgreementExisting"
                label={spouseNewPartnership ? "הסכם שותפות – עסק קיים" : "הסכם שותפות"}
                onChange={(files) => setSpouseBusinessInfo({ existingPartnershipAgreementFile: files?.[0] || undefined })}
              />
            )}
          </div>
        )}


        {/* Company documents */}
        {(["user", "spouse"] as const).map((who) => {
          const bi = who === "user" ? businessInfo : spouseBusinessInfo;
          const setBi = who === "user" ? setBusinessInfo : setSpouseBusinessInfo;
          if (bi.existingCompanyFillMode !== "self") return null;
          const companies = (bi.existingCompanies || []) as any[];
          if (companies.length === 0) return null;
          return companies.map((company: any, idx: number) => (
            <div key={`${who}-exco-${idx}`} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg">
                מסמכי {company.name || `חברה קיימת #${idx + 1}`}
              </h3>
              <FileUpload
                id={`incorp-${who}-${idx}`}
                label="נסח רשם החברות"
                multiple
                onChange={(files) => {
                  const updated = [...companies];
                  updated[idx] = { ...updated[idx], incorporationFiles: files ? Array.from(files) : undefined };
                  setBi({ existingCompanies: updated });
                }}
              />
              {(company.hasBankAccount === true || company.bankDetails?.accountNumber) && (
                <FileUpload
                  id={`bank-${who}-${idx}`}
                  label="אישור ניהול חשבון או צילום שיק"
                  onChange={(files) => {
                    const updated = [...companies];
                    updated[idx] = { ...updated[idx], companyBankConfirmationFile: files?.[0] || undefined };
                    setBi({ existingCompanies: updated });
                  }}
                />
              )}
            </div>
          ));
        })}

        {/* Company shareholders ID uploads (person shareholders + nested personOwners) */}
        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? businessInfo : spouseBusinessInfo;
          const setInfo = who === "user" ? setBusinessInfo : setSpouseBusinessInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("company")) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;

          type Row = { label: string; file?: File; update: (f?: File) => void };
          const rows: Row[] = [];

          const walkPersonOwner = (po: any, path: (po: any) => void, context: string) => {
            if (!po || !po.name) return;
            rows.push({
              label: `צילום ת.ז. + ספח של ${po.name}${context ? ` (${context})` : ""}`,
              file: po.idFile,
              update: (f) => path({ ...po, idFile: f }),
            });
            if (po.additionalIdType) {
              const t = po.additionalIdType === "license" ? "רישיון נהיגה" : po.additionalIdType === "passport" ? "דרכון" : "ת.ז. הורה";
              rows.push({
                label: `צילום ${t} של ${po.name}${context ? ` (${context})` : ""}`,
                file: po.additionalIdFile,
                update: (f) => path({ ...po, additionalIdFile: f }),
              });
            }
          };

          const walkChild = (childCompany: any, setChild: (c: any) => void, context: string) => {
            if (!childCompany) return;
            const ctx = childCompany.companyName || childCompany.requestedName1 || context;
            walkPersonOwner(childCompany.personOwner, (po) => setChild({ ...childCompany, personOwner: po }), ctx);
            if (childCompany.childCompany) {
              walkChild(childCompany.childCompany, (c) => setChild({ ...childCompany, childCompany: c }), ctx);
            }
          };

          const walkShareholder = (companyList: any[], setList: (l: any[]) => void, companyKey: "existingCompanies" | "newCompanies") => {
            companyList?.forEach((company: any, cIdx: number) => {
              const compName = company.name || company.requestedName1 || `חברה #${cIdx + 1}`;
              (company.shareholders || []).forEach((sh: any, sIdx: number) => {
                // Skip self/spouse — their IDs are already collected in the main identity sections
                if (sh.isSelf || sh.isSpouse) return;
                if ((sh.holderType || "person") === "person" && sh.name) {
                  rows.push({
                    label: `צילום ת.ז. + ספח של ${sh.name} (${compName})`,
                    file: sh.idFile,
                    update: (f) => {
                      const updatedList = [...companyList];
                      const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                      updatedShs[sIdx] = { ...updatedShs[sIdx], idFile: f };
                      updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                      setInfo({ [companyKey]: updatedList } as any);
                    },
                  });
                  if (sh.additionalIdType) {
                    const t = sh.additionalIdType === "license" ? "רישיון נהיגה" : sh.additionalIdType === "passport" ? "דרכון" : "ת.ז. הורה";
                    rows.push({
                      label: `צילום ${t} של ${sh.name} (${compName})`,
                      file: sh.additionalIdFile,
                      update: (f) => {
                        const updatedList = [...companyList];
                        const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                        updatedShs[sIdx] = { ...updatedShs[sIdx], additionalIdFile: f };
                        updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                        setInfo({ [companyKey]: updatedList } as any);
                      },
                    });
                  }
                } else if (sh.holderType === "company") {
                  const setPersonOwner = (po: any) => {
                    const updatedList = [...companyList];
                    const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                    updatedShs[sIdx] = { ...updatedShs[sIdx], personOwner: po };
                    updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                    setInfo({ [companyKey]: updatedList } as any);
                  };
                  walkPersonOwner(sh.personOwner, setPersonOwner, sh.companyName || compName);
                  if (sh.childCompany) {
                    const setChildCo = (c: any) => {
                      const updatedList = [...companyList];
                      const updatedShs = [...(updatedList[cIdx].shareholders || [])];
                      updatedShs[sIdx] = { ...updatedShs[sIdx], childCompany: c };
                      updatedList[cIdx] = { ...updatedList[cIdx], shareholders: updatedShs };
                      setInfo({ [companyKey]: updatedList } as any);
                    };
                    walkChild(sh.childCompany, setChildCo, sh.companyName || compName);
                  }
                }
              });
            });
          };

          walkShareholder(info.existingCompanies || [], (l) => setInfo({ existingCompanies: l } as any), "existingCompanies");
          walkShareholder(info.newCompanies || [], (l) => setInfo({ newCompanies: l } as any), "newCompanies");

          if (rows.length === 0) return null;

          return (
            <div key={`shareholders-${who}`} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg text-foreground">
                צילומי ת.ז. – בעלי מניות{ownerName ? ` (${ownerName})` : ""}
              </h3>
              {rows.map((row, i) => (
                <FileUpload
                  key={i}
                  id={`shareholder-${who}-${i}`}
                  label={row.label}
                  onChange={(files) => row.update(files?.[0])}
                />
              ))}
            </div>
          );
        })}

        {/* Nonprofit representative additional ID files */}
        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
          const setInfo = who === "user" ? setNonprofitInfo : setSpouseNonprofitInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("nonprofit")) return null;
          const rep = info.representativeMember;
          if (!rep || info.hasTaxFile !== true) return null;
          const types = (rep as any).additionalIdTypes as string[] | undefined;
          if (!types || types.length === 0) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;
          return (
            <div key={`np-rep-${who}`} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg text-foreground">
                אמצעי זיהוי נוספים – {rep.name || "חבר הועד"}{ownerName ? ` (${ownerName})` : ""}
              </h3>
              {types.includes("passport") && (
                <FileUpload
                  id={`${who}-rep-passport`}
                  label="צילום דרכון"
                  onChange={(files) => setInfo({ representativeMember: { ...(rep as any), additionalPassportFile: files?.[0] } })}
                />
              )}
              {types.includes("license") && (
                <FileUpload
                  id={`${who}-rep-license`}
                  label="צילום רישיון נהיגה"
                  onChange={(files) => setInfo({ representativeMember: { ...(rep as any), additionalLicenseFile: files?.[0] } })}
                />
              )}
              {types.includes("parentId") && (
                <FileUpload
                  id={`${who}-rep-parentid`}
                  label="צילום ת.ז. הורה"
                  onChange={(files) => setInfo({ representativeMember: { ...(rep as any), additionalIdFile: files?.[0] } })}
                />
              )}
            </div>
          );
        })}

        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
          const setInfo = who === "user" ? setNonprofitInfo : setSpouseNonprofitInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("nonprofit")) return null;
          const newMembers = info.boardMembers || [];
          const existingMembers = info.existingBoardMembers || [];
          const rep = info.representativeMember;
          const hasRep = !!rep && info.hasTaxFile === true;
          if (newMembers.length === 0 && existingMembers.length === 0 && !hasRep) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;
          return (
            <div key={who} className="space-y-4 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg">
                צילומי ת.ז. – חברי ועד עמותה{ownerName ? ` (${ownerName})` : ""}
              </h3>
              {newMembers.map((m: any, idx: number) => (
                <FileUpload
                  key={`new-${idx}`}
                  id={`${who}-board-new-${idx}-id`}
                  label={`צילום ת.ז. + ספח של ${m.name || `חבר ועד #${idx + 1}`}`}
                  onChange={(files) => {
                    const updated = [...newMembers];
                    updated[idx] = { ...updated[idx], idFile: files?.[0] };
                    setInfo({ boardMembers: updated });
                  }}
                />
              ))}
              {existingMembers.map((m: any, idx: number) => (
                <FileUpload
                  key={`existing-${idx}`}
                  id={`${who}-board-existing-${idx}-id`}
                  label={`צילום ת.ז. + ספח של ${m.name || `חבר ועד #${idx + 1}`}`}
                  onChange={(files) => {
                    const updated = [...existingMembers];
                    updated[idx] = { ...updated[idx], idFile: files?.[0] };
                    setInfo({ existingBoardMembers: updated });
                  }}
                />
              ))}
              {hasRep && (
                <FileUpload
                  id={`${who}-board-rep-id`}
                  label={`צילום ת.ז. + ספח של ${rep!.name || "חבר הועד שיופיע בייצוג"}`}
                  onChange={(files) => {
                    setInfo({ representativeMember: { ...(rep as any), idFile: files?.[0] } });
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Bank account confirmation for nonprofits without tax file */}
        {(["user", "spouse"] as const).map((who) => {
          const info = who === "user" ? nonprofitInfo : spouseNonprofitInfo;
          const setInfo = who === "user" ? setNonprofitInfo : setSpouseNonprofitInfo;
          const purposes = who === "user" ? userPurposes : spousePurposes;
          if (!purposes.includes("nonprofit")) return null;
          if (info.hasTaxFile !== false || info.hasBankAccount !== true) return null;
          const ownerName = who === "user" ? personalInfo.firstName : personalInfo.spouseName;
          return (
            <div key={`np-bank-${who}`} className="space-y-3 p-5 bg-muted/40 rounded-xl">
              <h3 className="font-bold text-lg">אסמכתא חשבון בנק – עמותה{ownerName ? ` (${ownerName})` : ""}</h3>
              <FileUpload
                id={`${who}-np-bank-file`}
                label="אישור ניהול חשבון או צילום שיק של העמותה"
                onChange={(files) => setInfo({ bankFile: files?.[0] || undefined })}
              />
            </div>
          );
        })}
      </div>}

      <FormNavigation
        onNext={handleNext}
        onPrev={() => setCurrentStep(3)}
        loading={loading}
      />
    </div>
  );
};
