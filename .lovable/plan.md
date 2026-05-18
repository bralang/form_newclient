## מטרה

בתרחיש **פיצויי מלחמה ← עסק ← שותפות** להציג רק את שדה **"מספר השותפות"** (מזהה השותפות במע"מ/רשם השותפויות), ולא לאסוף מספר שותפים או פרטי שותפים.

## מצב נוכחי

ב־`Step2BusinessInfo.tsx` בתוך `renderPartnershipSection`:
- כאשר `isWarComp = true` כבר מוסתרים: מסגרת נציג מע"מ, פרטי שותפים, צירוף הסכם שותפות.
- אבל עדיין מוצג שדה **"מספר שותפים (כולל אותך)"** (שורות 354–362) שאינו רלוונטי בפיצויי מלחמה.

## השינוי

ב־`renderPartnershipSection`, לעטוף את בלוק "מספר שותפים" ב־`{!isWarComp && ...}`.

במקומו, כאשר `isWarComp = true`, להציג שדה חדש:
- **תווית:** "מספר השותפות"
- **placeholder/הסבר:** "מספר תיק השותפות במע״מ / רשם השותפויות"
- **קלט:** טקסט מספרי בלבד (`inputMode="numeric"`, ספרות), נשמר כ־`info.partnershipNumber`.

כך בתרחיש פיצויי מלחמה + עסק + שותפות יוצג רק שדה בודד אחד: "מספר השותפות".

## פירוט טכני

קובץ: `src/components/steps/Step2BusinessInfo.tsx`

1. בשורות 353–362, להפוך את הבלוק לתנאי:
   ```tsx
   {!isWarComp ? (
     <div className="space-y-2">
       <Label htmlFor={`${prefix}partnerCount`}>מספר שותפים (כולל אותך)</Label>
       <Input ... />
     </div>
   ) : (
     <div className="space-y-2">
       <Label htmlFor={`${prefix}partnershipNumber`}>מספר השותפות</Label>
       <Input
         id={`${prefix}partnershipNumber`}
         type="text" inputMode="numeric" pattern="[0-9]*"
         placeholder="מספר תיק השותפות במע״מ / רשם השותפויות"
         value={info.partnershipNumber || ""}
         onChange={(e) => setInfo({ partnershipNumber: e.target.value })}
       />
     </div>
   )}
   ```

2. אין צורך בשינוי ב־`FormContext` – הערך נשמר תחת אותו `businessInfo`/`spouseBusinessInfo` כשדה דינמי `partnershipNumber` (כפי שכבר עובדים שדות אחרים שם). אם רוצים typing מפורש, נוסיף שדה אופציונלי `partnershipNumber?: string` ל־interface הרלוונטי.

3. השדה ייכלל אוטומטית בפיילואד שנשלח לוובהוק n8n כחלק מאובייקט ה־businessInfo.

## מה לא משתנה

- ההתנהגות בכל יתר התרחישים (לא־פיצויי־מלחמה) נשארת זהה: שדה "מספר שותפים" + פרטי שותפים + נציג מע"מ + הסכם שותפות.
- שמות שדות קיימים, ולידציות וניווט לא משתנים.
