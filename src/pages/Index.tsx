import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <FlaskConical className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Araştırma Platformu
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Deneyler oluşturun, katılımcılarla paylaşın ve sonuçları analiz edin.
        </p>
        <Link to="/auth">
          <Button size="lg" className="gap-2">
            Giriş Yap / Kayıt Ol
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
