## מה לשנות

ב-`CompanyChainBlock` (בתוך השרשרת של בעלות), כיום מוצגת רק בחירה אחת של "אחד מבעלי המניות" עם Select פשוט (אדם פרטי / חברה / עצמי / עצמי באמצעות חברה). נחליף את זה כך שיתאים לטפסי החברה החיצוניים:

### 1. חברה קיימת בתוך השרשרת
כיום: Select עם 4 אופציות.
שינוי: PillGroup זהה לחברה קיימת חיצונית — שתי אופציות בלבד:
- `{fillerName} ישירות` (alone) — מציג טקסט אישור שהוא בעל המניות היחיד.
- `{fillerName} באמצעות חברה` (self_via_company) — מציג בלוק שרשרת רקורסיבי (CompanyChainBlock נוסף עם chainAllowsNewCompany=false כי האם קיימת).

### 2. חברה חדשה בתוך השרשרת
כיום: Select עם בעל מניות יחיד.
שינוי: PillGroup זהה לחברה חדשה חיצונית:
- `{fillerName} ישירות` → תת-בחירה: "לבד 100%" / "יחד עם אחר"
  - "לבד" → אישור טקסט.
  - "יחד עם אחר" → קריאה ל-`renderShareholdersSection` המלא (ריבוי בעלי מניות עם פרטי בן/בת זוג, אחוזים אוטומטיים וכו').
- `{fillerName} באמצעות חברה` → CompanyChainBlock רקורסיבי (chainAllowsNewCompany נשמר).

## איך מיישמים טכנית

1. הוספה ל-props של `CompanyChainBlock`:
   - `renderShareholders?: (company, updateField, updateMulti, parentName, prefix) => ReactNode` — מועבר מהקומפוננטה הראשית כדי שנוכל לקרוא ל-`renderSharehol