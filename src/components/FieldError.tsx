export const FieldError = ({ show, message = "שדה חובה" }: { show: boolean; message?: string }) =>
  show ? <p className="text-xs text-destructive mt-1">{message}</p> : null;
