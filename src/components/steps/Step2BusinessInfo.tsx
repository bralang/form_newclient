import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { g } from "@/lib/gender-utils";

export const Step2BusinessInfo = () => {
  const {
    serviceType,
    businessInfo,
    setBusinessInfo,
    spouseBusinessInfo,
    setSpouseBusinessInfo,
    personalInfo,
    detailedInfo,
    spouseInfo,
  } = useFormContext();

  const isMarried = personalInfo.maritalStatus === "married";
  const userGender = detailedInfo.gender;
  const spouseGender = spouseInfo.gender;

  const userHasNewBusiness = serviceType.userPurposes.includes("new_business");
  const userHasExistingBusiness = serviceType.userPurposes.includes("existing_business");
  const userHasCompany = serviceType.userPurposes.includes("company");
  const userHasNonprofit = serviceType.userPurposes.includes("nonprofit");

  const spouseHasNewBusiness = serviceType.spousePurposes.includes("new_business");
  const spouseHasExistingBusiness = serviceType.spousePurposes.includes("existing_business");
  const spouseHasCompany = serviceType.spousePurposes.includes("company");
  const spouseHasNonprofit = serviceType.spousePurposes.includes("nonprofit");

  const userName = personalInfo.firstName || "המשתמש";
  const spouseName = personalInfo.spouseName || "בן/בת הזוג";

  // ─── Yes/No Radio helper ───
  const YesNo = ({
    value,
    onChange,
    prefix,
    name,
  }: {
    value: boolean | undefined;
    onChange: (v: boolean) => void;
    prefix: string;
    name: string;
  }) => (
    <RadioGroup
      value={value === true ? "yes" : value === false ? "no" : ""}
      onValueChange={(v) => onChange(v === "yes")}
      className="flex flex-row-reverse gap-4 justify-end"
    >
      <div className="flex items-center space-x-2 space-x-reverse">
        <RadioGroupItem value="yes" id={`${prefix}${name}Yes`} />
        <Label htmlFor={`${prefix}${name}Yes`}>כן</Label>
      </div>
      <div className="flex items-center space-x-2 space-x-reverse">
        <RadioGroupItem value="no" id={`${prefix}${name}No`} />
        <Label htmlFor={`${prefix}${name}No`}>לא</Label>
      </div>
    </RadioGroup>
  );

  // ─── New Business ───
  const renderNewBusiness = (
    info: any,
    setInfo: any,
    name: string,
    gender: "male" | "female" | "",
    idNumber: string,
    prefix = ""
  ) => (
    <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
      <h3 className="text-xl font-bold text-primary">
        העסק החדש של <span className="underline decoration-primary/50">{name}</span>
      </h3>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}businessName`}>שם העסק</Label>
        <Input
          id={`${prefix}businessName`}
          value={info.businessName || ""}
          onChange={(e) => setInfo({ businessName: e.target.value })}
          placeholder={`ברירת מחדל: ${name}`}
        />
        <p className="text-xs text-muted-foreground">לא חייבים לבחור שם עסק, ברירת המחדל היא שמך</p>
      </div>

      <div className="space-y-2">
        <Label>מספר עסק</Label>
        <Input value={idNumber || ""} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">מספר העסק הוא מספר ת.ז. שלך</p>
      </div>

      <div className="space-y-2">
        <Label>
          {g(gender, "האם אתה עכשיו באבטלה או בחופשת לידה?", "האם את עכשיו באבטלה או בחופשת לידה?")}
        </Label>
        <YesNo value={info.isUnemployedOrMaternity} onChange={(v) => setInfo({ isUnemployedOrMaternity: v })} prefix={prefix} name="unemployed" />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}businessField`}>תחום העיסוק</Label>
        <Input id={`${prefix}businessField`} value={info.businessField || ""} onChange={(e) => setInfo({ businessField: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <RadioGroup value={info.businessType || ""} onValueChange={(v: any) => setInfo({ businessType: v })} className="flex flex-row-reverse gap-4 justify-end">
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="exempt" id={`${prefix}exempt`} />
            <Label htmlFor={`${prefix}exempt`}>פטור</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="authorized" id={`${prefix}authorized`} />
            <Label htmlFor={`${prefix}authorized`}>מורשה</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה רוצה להיות עוסק זעיר?", "האם את רוצה להיות עוסקת זעירה?")}</Label>
        <YesNo value={info.wantSmallBusiness} onChange={(v) => setInfo({ wantSmallBusiness: v })} prefix={prefix} name="small" />
      </div>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה בעלים יחיד או בשותפות?", "האם את בעלים יחידה או בשותפות?")}</Label>
        <RadioGroup value={info.ownershipType || ""} onValueChange={(v: any) => setInfo({ ownershipType: v })} className="flex flex-row-reverse gap-4 justify-end">
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole" id={`${prefix}sole`} />
            <Label htmlFor={`${prefix}sole`}>{g(gender, "יחיד", "יחידה")}</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id={`${prefix}partnership`} />
            <Label htmlFor={`${prefix}partnership`}>שותפות</Label>
          </div>
        </RadioGroup>
      </div>

      {info.ownershipType === "partnership" && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}businessNumber`}>מספר העוסק (שותפות)</Label>
          <Input id={`${prefix}businessNumber`} value={info.businessNumber || ""} onChange={(e) => setInfo({ businessNumber: e.target.value })} />
        </div>
      )}

      <div className="space-y-2">
        <Label>האם העסק מתנהל מהבית?</Label>
        <YesNo value={info.isHomeOffice} onChange={(v) => setInfo({ isHomeOffice: v })} prefix={prefix} name="home" />
      </div>

      {info.isHomeOffice === false && (
        <div className="space-y-3 mr-4">
          <Label className="text-base font-semibold">כתובת העסק</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${prefix}street`}>רחוב</Label>
              <Input id={`${prefix}street`} value={info.businessAddress?.street || ""} onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, street: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${prefix}number`}>מספר</Label>
              <Input id={`${prefix}number`} value={info.businessAddress?.number || ""} onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, number: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${prefix}city`}>עיר</Label>
              <Input id={`${prefix}city`} value={info.businessAddress?.city || ""} onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, city: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      {/* Bank details - only for authorized */}
      {info.businessType === "authorized" && (
        <div className="space-y-3 p-4 bg-card rounded-xl border border-border">
          <Label className="text-base font-semibold">פרטי חשבון</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>בנק</Label>
              <Input value={info.bankDetails?.bank || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, bank: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label>סניף</Label>
              <Input value={info.bankDetails?.branch || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, branch: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label>מספר חשבון</Label>
              <Input value={info.bankDetails?.accountNumber || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountNumber: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label>שם בעל החשבון</Label>
              <Input value={info.bankDetails?.accountHolder || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountHolder: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>האם העסק צפוי להעסיק עובדים?</Label>
        <YesNo value={info.planningEmployees} onChange={(v) => setInfo({ planningEmployees: v })} prefix={prefix} name="emp" />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}activityStartDate`}>מתי התחילה הפעילות העסקית?</Label>
        <Input id={`${prefix}activityStartDate`} type="date" value={info.activityStartDate || ""} onChange={(e) => setInfo({ activityStartDate: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}expectedRevenue`}>מה המחזור הצפוי בעסק השנה?</Label>
        <Input id={`${prefix}expectedRevenue`} value={info.expectedRevenue || ""} onChange={(e) => setInfo({ expectedRevenue: e.target.value })} placeholder="לדוגמה: 100,000 ₪" />
      </div>
    </div>
  );

  // ─── Existing Business ───
  const renderExistingBusiness = (
    info: any,
    setInfo: any,
    name: string,
    gender: "male" | "female" | "",
    idNumber: string,
    prefix = ""
  ) => (
    <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
      <h3 className="text-xl font-bold text-primary">
        העסק הקיים של <span className="underline decoration-primary/50">{name}</span>
      </h3>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה בעלים יחיד או בשותפות?", "האם את בעלים יחידה או בשותפות?")}</Label>
        <RadioGroup value={info.ownershipType || ""} onValueChange={(v: any) => setInfo({ ownershipType: v })} className="flex flex-row-reverse gap-4 justify-end">
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="sole" id={`${prefix}exSole`} />
            <Label htmlFor={`${prefix}exSole`}>{g(gender, "יחיד", "יחידה")}</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="partnership" id={`${prefix}exPartnership`} />
            <Label htmlFor={`${prefix}exPartnership`}>שותפות</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}exBusinessNumber`}>מספר העוסק</Label>
        <Input
          id={`${prefix}exBusinessNumber`}
          value={info.businessNumber || (info.ownershipType !== "partnership" ? idNumber : "")}
          onChange={(e) => setInfo({ businessNumber: e.target.value })}
          disabled={info.ownershipType !== "partnership"}
        />
        {info.ownershipType !== "partnership" && (
          <p className="text-xs text-muted-foreground">מספר העוסק הוא מספר ת.ז. שלך</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>האם העסק מעסיק עובדים?</Label>
        <YesNo value={info.hasEmployees} onChange={(v) => setInfo({ hasEmployees: v })} prefix={prefix} name="exEmp" />
      </div>
    </div>
  );

  // ─── Company (Purpose 4) ───
  const renderCompany = (
    info: any,
    setInfo: any,
    name: string,
    _gender: "male" | "female" | "",
    prefix = ""
  ) => {
    const existingCount = info.existingCompanyCount || 0;
    const newCount = info.newCompanyCount || 0;

    return (
      <div className="space-y-5 p-5 bg-muted/30 rounded-xl border border-border/50">
        <h3 className="text-xl font-bold text-primary">
          חברות של <span className="underline decoration-primary/50">{name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}existingCount`}>לכמה חברות קיימות (עם תיק פתוח ברשות המיסים) מעוניין לקבל שירות?</Label>
            <Input
              id={`${prefix}existingCount`}
              type="number"
              min="0"
              value={existingCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                const companies = info.existingCompanies || [];
                const adjusted = Array.from({ length: count }, (_, i) => companies[i] || { name: "", companyNumber: "" });
                setInfo({ existingCompanyCount: count, existingCompanies: adjusted });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}newCount`}>כמה חברות חדשות רוצה לפתוח?</Label>
            <Input
              id={`${prefix}newCount`}
              type="number"
              min="0"
              value={newCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                const companies = info.newCompanies || [];
                const adjusted = Array.from({ length: count }, (_, i) => companies[i] || {});
                setInfo({ newCompanyCount: count, newCompanies: adjusted });
              }}
            />
          </div>
        </div>

        {/* Existing companies */}
        {(info.existingCompanies || []).map((company: any, idx: number) => (
          <div key={`existing-${idx}`} className="space-y-3 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary">חברה קיימת #{idx + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>שם חברה</Label>
                <Input
                  value={company.name || ""}
                  onChange={(e) => {
                    const updated = [...(info.existingCompanies || [])];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setInfo({ existingCompanies: updated });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>ח.פ.</Label>
                <Input
                  value={company.companyNumber || ""}
                  onChange={(e) => {
                    const updated = [...(info.existingCompanies || [])];
                    updated[idx] = { ...updated[idx], companyNumber: e.target.value };
                    setInfo({ existingCompanies: updated });
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* New companies */}
        {(info.newCompanies || []).map((company: any, idx: number) => (
          <div key={`new-${idx}`} className="space-y-4 p-4 border border-border rounded-xl bg-card">
            <h4 className="font-bold text-primary">חברה חדשה #{idx + 1}</h4>

            <div className="space-y-2">
              <Label>האם החברה קיימת ברשם החברות?</Label>
              <YesNo
                value={company.existsInRegistrar}
                onChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], existsInRegistrar: v };
                  setInfo({ newCompanies: updated });
                }}
                prefix={`${prefix}reg${idx}`}
                name="reg"
              />
            </div>

            {company.existsInRegistrar === false && (
              <div className="space-y-3">
                <Label className="font-semibold">3 שמות מבוקשים</Label>
                {[1, 2, 3].map((n) => (
                  <Input
                    key={n}
                    placeholder={`שם מבוקש ${n}`}
                    value={company[`requestedName${n}`] || ""}
                    onChange={(e) => {
                      const updated = [...(info.newCompanies || [])];
                      updated[idx] = { ...updated[idx], [`requestedName${n}`]: e.target.value };
                      setInfo({ newCompanies: updated });
                    }}
                  />
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>מי יהיו בעלי המניות בחברה?</Label>
              <RadioGroup
                value={company.shareholderType || ""}
                onValueChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], shareholderType: v };
                  setInfo({ newCompanies: updated });
                }}
                className="flex flex-row-reverse gap-4 justify-end"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="alone" id={`${prefix}sh${idx}Alone`} />
                  <Label htmlFor={`${prefix}sh${idx}Alone`}>אני לבד</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="other" id={`${prefix}sh${idx}Other`} />
                  <Label htmlFor={`${prefix}sh${idx}Other`}>אחר</Label>
                </div>
              </RadioGroup>
            </div>

            {company.shareholderType === "other" && (
              <div className="space-y-2">
                <Label>פירוט בעלי מניות</Label>
                <Input
                  value={company.shareholderDetails || ""}
                  onChange={(e) => {
                    const updated = [...(info.newCompanies || [])];
                    updated[idx] = { ...updated[idx], shareholderDetails: e.target.value };
                    setInfo({ newCompanies: updated });
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>האם החברה צפויה להעסיק עובדים?</Label>
              <YesNo
                value={company.planningEmployees}
                onChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], planningEmployees: v };
                  setInfo({ newCompanies: updated });
                }}
                prefix={`${prefix}emp${idx}`}
                name="emp"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Nonprofit ───
  const renderNonprofitMessage = (name: string) => (
    <div className="p-5 bg-primary/5 rounded-xl border border-primary/15">
      <h3 className="text-xl font-bold text-primary mb-2">עמותה – {name}</h3>
      <p className="text-muted-foreground">ניצור איתך קשר למטרת קידום העסק</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">
        חלק ב׳ –מידע נחוץ כדי להרוויח את השירות שלנו – פרטי העסק
      </h2>

      {/* User sections */}
      {userHasNewBusiness && renderNewBusiness(businessInfo, setBusinessInfo, userName, userGender, detailedInfo.idNumber)}
      {userHasExistingBusiness && renderExistingBusiness(businessInfo, setBusinessInfo, userName, userGender, detailedInfo.idNumber)}
      {userHasNonprofit && renderNonprofitMessage(userName)}
      {userHasCompany && renderCompany(businessInfo, setBusinessInfo, userName, userGender)}

      {/* Spouse sections */}
      {isMarried && spouseHasNewBusiness && renderNewBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasExistingBusiness && renderExistingBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, spouseInfo.idNumber, "sp_")}
      {isMarried && spouseHasNonprofit && renderNonprofitMessage(spouseName)}
      {isMarried && spouseHasCompany && renderCompany(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, "sp_")}
    </div>
  );
};
