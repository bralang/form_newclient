
## שינוי מבנה בחירת המטרות - שלב 1 ושלב 2

### מה ישתנה למשתמש

במקום 5 אפשרויות שטוחות (עסק חדש, עסק קיים, עמותה, חברה, החזר מס), המבנה החדש:

**4 אפשרויות ראשיות:**
1. עבור עסק עצמאי
2. עבור חברה
3. עבור עמותה
4. להחזר מס

כשבוחרים אחת מ-3 הראשונות, נפתח מתחתיה שדה עם שתי אפשרויות: **חדש** או **קיים**.
"להחזר מס" - ללא שאלת משנה.

למצב נשוי - שתי רשימות נפרדות (לא טבלה).

### מיפוי לוגיקה

הלוגיקה הקיימת בשלב 2 נשארת זהה, רק הדרך לזהות אותה משתנה:

```text
עסק עצמאי + חדש  -->  כמו "new_business" הנוכחי (renderNewBusiness)
עסק עצמאי + קיים -->  כמו "existing_business" הנוכחי (renderExistingBusiness)
חברה + חדש/קיים  -->  כמו "company" הנוכחי (renderCompany)
עמותה + חדש/קיים -->  כמו "nonprofit" הנוכחי (renderNonprofitMessage)
להחזר מס         -->  כמו "tax_refund" הנוכחי (ללא שדות עסקיים)
```

### פירוט טכני

#### 1. FormContext.tsx

הוספת שדות חדשים ל-`ServiceType`:
```typescript
export interface ServiceType {
  userPurposes: string[];        // ["business", "company", "tax_refund"]
  spousePurposes: string[];
  userPurposeStatus: Record<string, "new" | "existing">;    // { business: "new" }
  spousePurposeStatus: Record<string, "new" | "existing">;
}
```

עדכון ה-initial state להוסיף `userPurposeStatus: {}` ו-`spousePurposeStatus: {}`.
עדכון session storage save/load בהתאם.

#### 2. Step1Purpose.tsx

- שינוי רשימת PURPOSES:
  - `business` - "עבור עסק עצמאי" (hasSubStatus: true)
  - `company` - "עבור חברה" (hasSubStatus: true)
  - `nonprofit` - "עבור עמותה" (hasSubStatus: true)
  - `tax_refund` - "להחזר מס" (hasSubStatus: false)

- כשבוחרים אפשרות עם hasSubStatus, נפתח מתחתיה RadioGroup עם "חדש" / "קיים"
- כשמבטלים בחירה, מוחקים את הסטטוס שלה מ-purposeStatus
- למצב נשוי: שתי רשימות checkbox נפרדות עם כותרות (שם המשתמש / שם בן הזוג) במקום טבלה

#### 3. Step2BusinessInfo.tsx

שינוי הבדיקות בשורות 23-31 מ:
```typescript
const userHasNewBusiness = serviceType.userPurposes.includes("new_business");
const userHasExistingBusiness = serviceType.userPurposes.includes("existing_business");
```
ל:
```typescript
const userHasNewBusiness = serviceType.userPurposes.includes("business") 
  && serviceType.userPurposeStatus?.business === "new";
const userHasExistingBusiness = serviceType.userPurposes.includes("business") 
  && serviceType.userPurposeStatus?.business === "existing";
```

אותו דבר לבן/בת זוג עם `spousePurposeStatus`.

ה-render functions עצמן (renderNewBusiness, renderExistingBusiness, renderCompany, renderNonprofitMessage) נשארות בדיוק כמו שהן - רק הבדיקות שמפעילות אותן משתנות.

#### 4. קבצים נוספים שעשויים להשתנות

בדיקה אם יש התייחסויות ל-`new_business` / `existing_business` בקבצים אחרים (Step3Documents, Step4Completion) - ועדכונן בהתאם לשמות החדשים.
