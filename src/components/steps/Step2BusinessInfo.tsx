import { useFormContext } from "@/contexts/FormContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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

  // ─── New Business Fields ───
  const renderNewBusiness = (
    info: any, setInfo: any, name: string, gender: "male" | "female" | "", prefix = ""
  ) => (
    <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
      <h3 className="text-xl font-bold text-primary">
        העסק החדש של <span className="underline">{name}</span>
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
        <Input value={detailedInfo.idNumber || ""} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">מספר העסק הוא מספר ת.ז. שלך</p>
      </div>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה עכשיו באבטלה או בחופשת לידה?", "האם את עכשיו באבטלה או בחופשת לידה?")}</Label>
        <RadioGroup
          value={info.isUnemployedOrMaternity === true ? "yes" : info.isUnemployedOrMaternity === false ? "no" : ""}
          onValueChange={(v) => setInfo({ isUnemployedOrMaternity: v === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id={`${prefix}unemployedYes`} />
            <Label htmlFor={`${prefix}unemployedYes`}>כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id={`${prefix}unemployedNo`} />
            <Label htmlFor={`${prefix}unemployedNo`}>לא</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}businessField`}>תחום העיסוק</Label>
        <Input
          id={`${prefix}businessField`}
          value={info.businessField || ""}
          onChange={(e) => setInfo({ businessField: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>סוג העסק</Label>
        <RadioGroup
          value={info.businessType || ""}
          onValueChange={(v: any) => setInfo({ businessType: v })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
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
        <RadioGroup
          value={info.wantSmallBusiness === true ? "yes" : info.wantSmallBusiness === false ? "no" : ""}
          onValueChange={(v) => setInfo({ wantSmallBusiness: v === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id={`${prefix}smallYes`} />
            <Label htmlFor={`${prefix}smallYes`}>כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id={`${prefix}smallNo`} />
            <Label htmlFor={`${prefix}smallNo`}>לא</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Ownership */}
      <div className="space-y-2">
        <Label>{g(gender, "האם אתה בעלים יחיד או בשותפות?", "האם את בעלים יחידה או בשותפות?")}</Label>
        <RadioGroup
          value={info.ownershipType || ""}
          onValueChange={(v: any) => setInfo({ ownershipType: v })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
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
          <Input
            id={`${prefix}businessNumber`}
            value={info.businessNumber || ""}
            onChange={(e) => setInfo({ businessNumber: e.target.value })}
          />
        </div>
      )}

      {/* Home office */}
      <div className="space-y-2">
        <Label>האם העסק מתנהל מהבית?</Label>
        <RadioGroup
          value={info.isHomeOffice === true ? "yes" : info.isHomeOffice === false ? "no" : ""}
          onValueChange={(v) => setInfo({ isHomeOffice: v === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id={`${prefix}homeYes`} />
            <Label htmlFor={`${prefix}homeYes`}>כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id={`${prefix}homeNo`} />
            <Label htmlFor={`${prefix}homeNo`}>לא</Label>
          </div>
        </RadioGroup>
      </div>

      {info.isHomeOffice === false && (
        <div className="space-y-4 mr-6">
          <Label className="text-lg font-semibold">כתובת העסק</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${prefix}street`}>רחוב</Label>
              <Input
                id={`${prefix}street`}
                value={info.businessAddress?.street || ""}
                onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, street: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}number`}>מספר</Label>
              <Input
                id={`${prefix}number`}
                value={info.businessAddress?.number || ""}
                onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, number: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}city`}>עיר</Label>
              <Input
                id={`${prefix}city`}
                value={info.businessAddress?.city || ""}
                onChange={(e) => setInfo({ businessAddress: { ...info.businessAddress, city: e.target.value } })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bank details - only for authorized */}
      {info.businessType === "authorized" && (
        <div className="space-y-4 p-4 bg-background rounded-lg border">
          <Label className="text-lg font-semibold">פרטי חשבון בנק</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${prefix}bank`}>בנק</Label>
              <Input id={`${prefix}bank`} value={info.bankDetails?.bank || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, bank: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}branch`}>סניף</Label>
              <Input id={`${prefix}branch`} value={info.bankDetails?.branch || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, branch: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}accountNumber`}>מספר חשבון</Label>
              <Input id={`${prefix}accountNumber`} value={info.bankDetails?.accountNumber || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountNumber: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${prefix}accountHolder`}>שם בעל החשבון</Label>
              <Input id={`${prefix}accountHolder`} value={info.bankDetails?.accountHolder || ""} onChange={(e) => setInfo({ bankDetails: { ...info.bankDetails, accountHolder: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      {/* Employees */}
      <div className="space-y-2">
        <Label>האם העסק צפוי להעסיק עובדים?</Label>
        <RadioGroup
          value={info.hasEmployees === true ? "yes" : info.hasEmployees === false ? "no" : ""}
          onValueChange={(v) => setInfo({ hasEmployees: v === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id={`${prefix}empYes`} />
            <Label htmlFor={`${prefix}empYes`}>כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id={`${prefix}empNo`} />
            <Label htmlFor={`${prefix}empNo`}>לא</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}activityStartDate`}>מתי התחילה הפעילות העסקית?</Label>
        <Input
          id={`${prefix}activityStartDate`}
          type="date"
          value={info.activityStartDate || ""}
          onChange={(e) => setInfo({ activityStartDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}expectedRevenue`}>מה המחזור הצפוי בעסק השנה?</Label>
        <Input
          id={`${prefix}expectedRevenue`}
          value={info.expectedRevenue || ""}
          onChange={(e) => setInfo({ expectedRevenue: e.target.value })}
          placeholder="לדוגמה: 100,000 ₪"
        />
      </div>
    </div>
  );

  // ─── Existing Business Fields ───
  const renderExistingBusiness = (
    info: any, setInfo: any, name: string, gender: "male" | "female" | "", prefix = ""
  ) => (
    <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
      <h3 className="text-xl font-bold text-primary">
        העסק הקיים של <span className="underline">{name}</span>
      </h3>

      <div className="space-y-2">
        <Label>{g(gender, "האם אתה בעלים יחיד או בשותפות?", "האם את בעלים יחידה או בשותפות?")}</Label>
        <RadioGroup
          value={info.ownershipType || ""}
          onValueChange={(v: any) => setInfo({ ownershipType: v })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
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
        <Label htmlFor={`${prefix}businessNumber`}>מספר העוסק</Label>
        <Input
          id={`${prefix}businessNumber`}
          value={info.businessNumber || (info.ownershipType !== "partnership" ? detailedInfo.idNumber : "")}
          onChange={(e) => setInfo({ businessNumber: e.target.value })}
          disabled={info.ownershipType !== "partnership"}
        />
        {info.ownershipType !== "partnership" && (
          <p className="text-xs text-muted-foreground">מספר העוסק הוא מספר ת.ז. שלך</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>האם העסק מעסיק עובדים?</Label>
        <RadioGroup
          value={info.hasEmployees === true ? "yes" : info.hasEmployees === false ? "no" : ""}
          onValueChange={(v) => setInfo({ hasEmployees: v === "yes" })}
          className="flex flex-row-reverse gap-4 justify-end"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="yes" id={`${prefix}exEmpYes`} />
            <Label htmlFor={`${prefix}exEmpYes`}>כן</Label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value="no" id={`${prefix}exEmpNo`} />
            <Label htmlFor={`${prefix}exEmpNo`}>לא</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  // ─── Company Fields (Purpose 4) ───
  const renderCompany = (
    info: any, setInfo: any, name: string, _gender: "male" | "female" | "", prefix = ""
  ) => {
    const existingCount = info.existingCompanyCount || 0;
    const newCount = info.newCompanyCount || 0;

    return (
      <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-bold text-primary">
          חברות של <span className="underline">{name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}existingCompanyCount`}>לכמה חברות קיימות (עם תיק פתוח ברשות המיסים) מעוניין לקבל שירות?</Label>
            <Input
              id={`${prefix}existingCompanyCount`}
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
            <Label htmlFor={`${prefix}newCompanyCount`}>כמה חברות חדשות רוצה לפתוח?</Label>
            <Input
              id={`${prefix}newCompanyCount`}
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
          <div key={`existing-${idx}`} className="space-y-4 p-3 border rounded-lg">
            <h4 className="font-semibold">חברה קיימת #{idx + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
          <div key={`new-${idx}`} className="space-y-4 p-3 border rounded-lg">
            <h4 className="font-semibold">חברה חדשה #{idx + 1}</h4>

            <div className="space-y-2">
              <Label>האם החברה קיימת ברשם החברות?</Label>
              <RadioGroup
                value={company.existsInRegistrar === true ? "yes" : company.existsInRegistrar === false ? "no" : ""}
                onValueChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], existsInRegistrar: v === "yes" };
                  setInfo({ newCompanies: updated });
                }}
                className="flex flex-row-reverse gap-4 justify-end"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="yes" id={`${prefix}reg${idx}Yes`} />
                  <Label htmlFor={`${prefix}reg${idx}Yes`}>כן</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="no" id={`${prefix}reg${idx}No`} />
                  <Label htmlFor={`${prefix}reg${idx}No`}>לא</Label>
                </div>
              </RadioGroup>
            </div>

            {company.existsInRegistrar === false && (
              <div className="space-y-4">
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
              <RadioGroup
                value={company.planningEmployees === true ? "yes" : company.planningEmployees === false ? "no" : ""}
                onValueChange={(v) => {
                  const updated = [...(info.newCompanies || [])];
                  updated[idx] = { ...updated[idx], planningEmployees: v === "yes" };
                  setInfo({ newCompanies: updated });
                }}
                className="flex flex-row-reverse gap-4 justify-end"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="yes" id={`${prefix}emp${idx}Yes`} />
                  <Label htmlFor={`${prefix}emp${idx}Yes`}>כן</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="no" id={`${prefix}emp${idx}No`} />
                  <Label htmlFor={`${prefix}emp${idx}No`}>לא</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Nonprofit message ───
  const renderNonprofitMessage = (name: string) => (
    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
      <h3 className="text-xl font-bold text-primary mb-2">עמותה - {name}</h3>
      <p className="text-muted-foreground">ניצור איתך קשר למטרת קידום העסק</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">
        חלק ב׳ – מידע נחוץ כדי להרוויח את השירות שלנו – פרטי העסק
      </h2>

      {/* User sections */}
      {userHasNewBusiness && renderNewBusiness(businessInfo, setBusinessInfo, userName, userGender)}
      {userHasExistingBusiness && renderExistingBusiness(businessInfo, setBusinessInfo, userName, userGender)}
      {userHasNonprofit && renderNonprofitMessage(userName)}
      {userHasCompany && renderCompany(businessInfo, setBusinessInfo, userName, userGender)}

      {/* Spouse sections */}
      {isMarried && spouseHasNewBusiness && renderNewBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, "sp_")}
      {isMarried && spouseHasExistingBusiness && renderExistingBusiness(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, "sp_")}
      {isMarried && spouseHasNonprofit && renderNonprofitMessage(spouseName)}
      {isMarried && spouseHasCompany && renderCompany(spouseBusinessInfo, setSpouseBusinessInfo, spouseName, spouseGender, "sp_")}
    </div>
  );
};
