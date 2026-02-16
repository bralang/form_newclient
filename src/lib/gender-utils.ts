/**
 * Returns gendered text based on selected gender.
 * Defaults to masculine if gender not yet selected.
 */
export const g = (
  gender: "male" | "female" | "",
  male: string,
  female: string
): string => {
  return gender === "female" ? female : male;
};
