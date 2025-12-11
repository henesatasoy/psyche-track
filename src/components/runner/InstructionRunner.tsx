import { InstructionBlock } from "@/types/experiment";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";

interface InstructionRunnerProps {
  block: InstructionBlock;
  onComplete: (data: Record<string, unknown>) => void;
  progress: number;
}

export function InstructionRunner({ block, onComplete, progress }: InstructionRunnerProps) {
  const handleContinue = () => {
    onComplete({ acknowledged: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full animate-fade-in">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <div className="prose prose-sm max-w-none text-foreground">
              {block.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleContinue}>
              Devam Et
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
