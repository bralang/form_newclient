import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

interface FormNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  showPrev?: boolean;
  nextLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export const FormNavigation = ({
  onNext,
  onPrev,
  showPrev = true,
  nextLabel = "המשך",
  loading = false,
  disabled = false,
}: FormNavigationProps) => {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
      {showPrev ? (
        <Button variant="outline" onClick={onPrev} disabled={loading}>
          <ChevronRight className="ml-2 h-4 w-4" />
          חזור
        </Button>
      ) : (
        <div />
      )}
      <Button onClick={onNext} disabled={disabled || loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {nextLabel}
        <ChevronLeft className="mr-2 h-4 w-4" />
      </Button>
    </div>
  );
};
