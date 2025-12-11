import { useState } from "react";
import { SurveyBlock, SurveyQuestion } from "@/types/experiment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, MessageSquare, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyEditorProps {
  block: SurveyBlock;
  onChange: (block: SurveyBlock) => void;
}

export function SurveyEditor({ block, onChange }: SurveyEditorProps) {
  const addQuestion = (type: "open" | "multiple_choice") => {
    const newQuestion: SurveyQuestion = {
      id: crypto.randomUUID(),
      type,
      question: "",
      required: true,
      ...(type === "multiple_choice" ? { options: ["", ""] } : {}),
    };

    onChange({
      ...block,
      questions: [...block.questions, newQuestion],
    });
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const newQuestions = [...block.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange({ ...block, questions: newQuestions });
  };

  const deleteQuestion = (index: number) => {
    onChange({
      ...block,
      questions: block.questions.filter((_, i) => i !== index),
    });
  };

  const addOption = (questionIndex: number) => {
    const question = block.questions[questionIndex];
    if (question.type === "multiple_choice" && question.options) {
      updateQuestion(questionIndex, {
        options: [...question.options, ""],
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = block.questions[questionIndex];
    if (question.type === "multiple_choice" && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = block.questions[questionIndex];
    if (question.type === "multiple_choice" && question.options && question.options.length > 2) {
      updateQuestion(questionIndex, {
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-1">Survey Block</h3>
        <p className="text-sm text-muted-foreground">
          Add questions to collect participant responses.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="survey-title">Section Title</Label>
        <Input
          id="survey-title"
          placeholder="e.g., Demographics, Post-Task Questions"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Questions ({block.questions.length})</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuestion("open")}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Open-Ended
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuestion("multiple_choice")}
            >
              <ListChecks className="h-4 w-4 mr-1" />
              Multiple Choice
            </Button>
          </div>
        </div>

        {block.questions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No questions yet. Add your first question above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {block.questions.map((question, index) => (
              <Card key={question.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium text-muted-foreground flex-shrink-0 mt-1">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          question.type === "open"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent text-accent-foreground"
                        )}>
                          {question.type === "open" ? "Open-ended" : "Multiple choice"}
                        </span>
                      </div>

                      <Input
                        placeholder="Enter your question..."
                        value={question.question}
                        onChange={(e) => updateQuestion(index, { question: e.target.value })}
                      />

                      {question.type === "multiple_choice" && question.options && (
                        <div className="space-y-2 pl-4 border-l-2 border-border">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                              <Input
                                placeholder={`Option ${optionIndex + 1}`}
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                className="flex-1"
                              />
                              {question.options!.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteOption(index, optionIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => addOption(index)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`required-${question.id}`}
                            checked={question.required}
                            onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                          />
                          <Label htmlFor={`required-${question.id}`} className="text-sm font-normal">
                            Required
                          </Label>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
