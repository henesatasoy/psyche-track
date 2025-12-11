import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Runner() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-xl font-medium text-foreground mb-2">Participant Runner</h1>
        <p className="text-muted-foreground mb-4">
          Experiment ID: {id}
        </p>
        <p className="text-sm text-muted-foreground">
          This will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
