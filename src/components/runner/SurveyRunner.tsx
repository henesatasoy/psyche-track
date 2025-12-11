import { useState } from "react";
import { SurveyBlock, SurveyQuestion } from "@/types/experiment";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SurveyRunnerProps {
  block: SurveyBlock;
  onComplete: (data: Record<string, unknown>) => void;
  progress: number;
}

interface SurveyResponse {
  questionId: string;
  question: string;
  type: "open" | "multiple_choice";
  answer: string;
}

export function SurveyRunner({ block, onComplete, progress }: SurveyRunnerProps) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, string>>({});

  const updateResponse = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // Validate required questions
    const unansweredRequired = block.questions.filter(
      (q) => q.required && !responses[q.id]?.trim()
    );

    if (unansweredRequired.length > 0) {
      toast({
        variant: "destructive",
        title: "Zorunlu Sorular",
        description: "Devam etmeden önce lütfen tüm zorunlu soruları yanıtlayın.",
      });
      return;
    }

    // Format responses
    const formattedResponses: SurveyResponse[] = block.questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      type: q.type,
      answer: responses[q.id] || "",
    }));

    onComplete({
      title: block.title,
      responses: formattedResponses,
    });
  };

  const renderQuestion = (question: SurveyQuestion, index: number) => {
    return (
      <div key={question.id} className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {question.question}
              {question.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </p>
          </div>
        </div>

        <div className="pl-8">
          {question.type === "open" ? (
            <Textarea
              placeholder="Yanıtınızı buraya yazın..."
              value={responses[question.id] || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              rows={3}
              className="resize-none"
            />
          ) : (
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => updateResponse(question.id, value)}
              className="space-y-2"
            >
              {question.options?.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="flex items-center space-x-3 p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem
                    value={option}
                    id={`${question.id}-${optionIndex}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${optionIndex}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 pt-12 overflow-y-auto">
        <div className="max-w-2xl w-full animate-fade-in pb-8">
          {block.title && (
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              {block.title}
            </h2>
          )}

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-6">
            {block.questions.map((question, index) =>
              renderQuestion(question, index)
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleSubmit}>
              Devam Et
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
