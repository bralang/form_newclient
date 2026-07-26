// Shared helpers for marking required fields invalid and guiding the user to them.
export const ERROR_INPUT_CLASS = "border-destructive focus-visible:ring-destructive ring-1 ring-destructive/30";
export const ERROR_BOX_CLASS = "border-destructive ring-1 ring-destructive/30 rounded-xl";

export function errClass(invalid: boolean, extra = "") {
  return [invalid ? ERROR_INPUT_CLASS : "", extra].filter(Boolean).join(" ");
}

export function errBoxClass(invalid: boolean, extra = "") {
  return [invalid ? ERROR_BOX_CLASS : "", extra].filter(Boolean).join(" ");
}

export function scrollToFirstError() {
  requestAnimationFrame(() => {
    document.querySelector(".border-destructive")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
