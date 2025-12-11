import { CheckCircle } from "lucide-react";

export function RunnerComplete() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Thank You!
        </h1>

        <p className="text-muted-foreground mb-6">
          Your responses have been recorded successfully. You may now close this window.
        </p>

        <p className="text-sm text-muted-foreground">
          If you have any questions about this study, please contact the researcher.
        </p>
      </div>
    </div>
  );
}
