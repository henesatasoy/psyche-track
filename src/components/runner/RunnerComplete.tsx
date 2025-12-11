import { CheckCircle } from "lucide-react";

export function RunnerComplete() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Teşekkür Ederiz!
        </h1>

        <p className="text-muted-foreground mb-6">
          Yanıtlarınız başarıyla kaydedildi. Artık bu pencereyi kapatabilirsiniz.
        </p>

        <p className="text-sm text-muted-foreground">
          Bu çalışma hakkında sorularınız varsa, lütfen araştırmacı ile iletişime geçin.
        </p>
      </div>
    </div>
  );
}
