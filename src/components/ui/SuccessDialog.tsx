import { CheckCircle2 } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

export function SuccessDialog({
  open,
  onClose,
  title,
  message,
  buttonLabel = "OK",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonLabel?: string;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Button onClick={onClose} className="w-full sm:w-auto">
          {buttonLabel}
        </Button>
      }>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-50 grid place-items-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <p className="text-sm text-ink-700 pt-2">{message}</p>
      </div>
    </Dialog>
  );
}
