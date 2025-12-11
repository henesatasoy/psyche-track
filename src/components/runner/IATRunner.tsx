import { useState, useEffect, useCallback, useRef } from "react";
import { IATBlock, IATStimulus } from "@/types/experiment";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface IATRunnerProps {
  block: IATBlock;
  onComplete: (data: Record<string, unknown>) => void;
  progress: number;
}

interface Trial {
  stimulus: IATStimulus;
  correctSide: "left" | "right";
  categoryLabel: string;
}

interface TrialResult {
  stimulusId: string;
  stimulusValue: string;
  stimulusType: "text" | "image";
  correctSide: "left" | "right";
  responseSide: "left" | "right" | null;
  reactionTime: number;
  correct: boolean;
  timedOut: boolean;
}

type IATState = "ready" | "fixation" | "stimulus" | "feedback" | "complete";

export function IATRunner({ block, onComplete, progress }: IATRunnerProps) {
  const [state, setState] = useState<IATState>("ready");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showError, setShowError] = useState(false);

  const stimulusStartTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Disable scrolling and zooming during IAT
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  // Generate randomized trials
  useEffect(() => {
    const allTrials: Trial[] = [];

    block.leftCategory.stimuli.forEach((stimulus) => {
      allTrials.push({
        stimulus,
        correctSide: "left",
        categoryLabel: block.leftCategory.label,
      });
    });

    block.rightCategory.stimuli.forEach((stimulus) => {
      allTrials.push({
        stimulus,
        correctSide: "right",
        categoryLabel: block.rightCategory.label,
      });
    });

    // Shuffle trials
    for (let i = allTrials.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTrials[i], allTrials[j]] = [allTrials[j], allTrials[i]];
    }

    setTrials(allTrials);
  }, [block]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state === "ready") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          startTask();
        }
        return;
      }

      if (state !== "stimulus") return;

      const key = e.key.toLowerCase();
      if (key !== "e" && key !== "i") return;

      e.preventDefault();
      const responseSide: "left" | "right" = key === "e" ? "left" : "right";
      handleResponse(responseSide);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, currentTrialIndex, trials]);

  const startTask = () => {
    if (trials.length === 0) {
      onComplete({ trials: [], message: "Uyaran yapılandırılmamış" });
      return;
    }
    showNextStimulus();
  };

  const showNextStimulus = () => {
    setState("fixation");

    // Brief fixation cross
    setTimeout(() => {
      setState("stimulus");
      stimulusStartTime.current = performance.now();

      // Set timeout only if time limit is set (not unlimited)
      if (block.timeLimit > 0) {
        timeoutRef.current = setTimeout(() => {
          handleTimeout();
        }, block.timeLimit);
      }
    }, 500);
  };

  const handleResponse = useCallback(
    (responseSide: "left" | "right") => {
      if (state !== "stimulus" || currentTrialIndex >= trials.length) return;

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const reactionTime = performance.now() - stimulusStartTime.current;
      const trial = trials[currentTrialIndex];
      const correct = responseSide === trial.correctSide;

      const result: TrialResult = {
        stimulusId: trial.stimulus.id,
        stimulusValue: trial.stimulus.value,
        stimulusType: trial.stimulus.type,
        correctSide: trial.correctSide,
        responseSide,
        reactionTime: Math.round(reactionTime * 100) / 100,
        correct,
        timedOut: false,
      };

      if (!correct && block.feedbackType !== "none") {
        handleIncorrectResponse(result);
      } else {
        recordResultAndAdvance(result);
      }
    },
    [state, currentTrialIndex, trials, block.feedbackType]
  );

  const handleIncorrectResponse = (result: TrialResult) => {
    setShowError(true);
    setFeedback("incorrect");

    if (block.feedbackType === "correction") {
      // Block until correct - don't advance, let them try again
      setState("feedback");
      setTimeout(() => {
        setShowError(false);
        setFeedback(null);
        setState("stimulus");
        stimulusStartTime.current = performance.now();

        // Reset timeout only if time limit is set (not unlimited)
        if (block.timeLimit > 0) {
          timeoutRef.current = setTimeout(() => {
            handleTimeout();
          }, block.timeLimit);
        }
      }, 300);
    } else if (block.feedbackType === "flash") {
      // Brief error flash, then advance
      setState("feedback");
      setTimeout(() => {
        setShowError(false);
        setFeedback(null);
        recordResultAndAdvance(result);
      }, 200);
    }
  };

  const handleTimeout = () => {
    if (state !== "stimulus" || currentTrialIndex >= trials.length) return;

    const trial = trials[currentTrialIndex];
    const result: TrialResult = {
      stimulusId: trial.stimulus.id,
      stimulusValue: trial.stimulus.value,
      stimulusType: trial.stimulus.type,
      correctSide: trial.correctSide,
      responseSide: null,
      reactionTime: block.timeLimit,
      correct: false,
      timedOut: true,
    };

    recordResultAndAdvance(result);
  };

  const recordResultAndAdvance = (result: TrialResult) => {
    const newResults = [...results, result];
    setResults(newResults);

    if (currentTrialIndex < trials.length - 1) {
      setCurrentTrialIndex(currentTrialIndex + 1);
      showNextStimulus();
    } else {
      // All trials complete
      setState("complete");
      onComplete({
        timeLimit: block.timeLimit,
        feedbackType: block.feedbackType,
        leftCategory: block.leftCategory.label,
        rightCategory: block.rightCategory.label,
        trials: newResults,
        meanRT: calculateMeanRT(newResults),
        accuracy: calculateAccuracy(newResults),
      });
    }
  };

  const calculateMeanRT = (results: TrialResult[]) => {
    const validResults = results.filter((r) => r.correct && !r.timedOut);
    if (validResults.length === 0) return 0;
    const sum = validResults.reduce((acc, r) => acc + r.reactionTime, 0);
    return Math.round(sum / validResults.length);
  };

  const calculateAccuracy = (results: TrialResult[]) => {
    if (results.length === 0) return 0;
    const correct = results.filter((r) => r.correct).length;
    return Math.round((correct / results.length) * 100);
  };

  const currentTrial = trials[currentTrialIndex];
  const trialProgress = trials.length > 0 ? ((currentTrialIndex + 1) / trials.length) * 100 : 0;

  // Ready state - instructions
  if (state === "ready") {
    return (
      <div className="min-h-screen flex flex-col bg-background select-none">
        <div className="fixed top-0 left-0 right-0 z-10">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg text-center animate-fade-in">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Sınıflandırma Görevi
            </h2>

            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground text-xl font-bold mb-2">
                    E
                  </div>
                  <p className="font-medium text-foreground">
                    {block.leftCategory.label}
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground text-xl font-bold mb-2">
                    I
                  </div>
                  <p className="font-medium text-foreground">
                    {block.rightCategory.label}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>{block.leftCategory.label}</strong> kategorisine ait öğeler için <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs font-mono">E</kbd> tuşuna basın
                <br />
                <strong>{block.rightCategory.label}</strong> kategorisine ait öğeler için <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs font-mono">I</kbd> tuşuna basın
              </p>
            </div>

            <p className="text-muted-foreground mb-4">
              Mümkün olduğunca hızlı ve doğru yanıt verin.
            </p>

            <p className="text-sm text-primary font-medium">
              Başlamak için BOŞLUK veya ENTER tuşuna basın
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Task running
  return (
    <div className="min-h-screen flex flex-col bg-background select-none">
      {/* Progress bars */}
      <div className="fixed top-0 left-0 right-0 z-10">
        <Progress value={progress} className="h-1 rounded-none" />
        <Progress value={trialProgress} className="h-0.5 rounded-none bg-muted" />
      </div>

      {/* Category labels */}
      <div className="fixed top-8 left-0 right-0 flex justify-between px-8 z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
            <span className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
              E
            </span>
            <span className="font-medium text-foreground">
              {block.leftCategory.label}
            </span>
          </div>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
            <span className="font-medium text-foreground">
              {block.rightCategory.label}
            </span>
            <span className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
              I
            </span>
          </div>
        </div>
      </div>

      {/* Stimulus area */}
      <div className="flex-1 flex items-center justify-center p-6">
        {state === "fixation" && (
          <div className="text-4xl font-light text-muted-foreground">+</div>
        )}

        {(state === "stimulus" || state === "feedback") && currentTrial && (
          <div className="relative">
            {/* Error indicator */}
            {showError && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                <span className="text-destructive text-2xl font-bold">✗</span>
              </div>
            )}

            {/* Stimulus */}
            <div
              className={cn(
                "transition-opacity",
                showError ? "opacity-50" : "opacity-100"
              )}
            >
              {currentTrial.stimulus.type === "image" ? (
                <img
                  src={currentTrial.stimulus.value}
                  alt="Stimulus"
                  className="max-w-[300px] max-h-[300px] object-contain"
                  draggable={false}
                />
              ) : (
                <div className="text-4xl font-medium text-foreground">
                  {currentTrial.stimulus.value}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trial counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <span className="text-xs text-muted-foreground">
          {currentTrialIndex + 1} / {trials.length}
        </span>
      </div>
    </div>
  );
}
