import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExperimentBlock, Experiment } from "@/types/experiment";
import { Loader2 } from "lucide-react";
import { InstructionRunner } from "@/components/runner/InstructionRunner";
import { SurveyRunner } from "@/components/runner/SurveyRunner";
import { IATRunner } from "@/components/runner/IATRunner";
import { RunnerComplete } from "@/components/runner/RunnerComplete";
import { useToast } from "@/hooks/use-toast";

interface BlockResult {
  blockId: string;
  blockType: string;
  data: Record<string, unknown>;
  completedAt: number;
}

type RunnerState = "loading" | "preloading" | "running" | "complete" | "error";

export default function Runner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [state, setState] = useState<RunnerState>("loading");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [results, setResults] = useState<BlockResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch experiment
  useEffect(() => {
    if (id) {
      fetchExperiment();
    }
  }, [id]);

  const fetchExperiment = async () => {
    try {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError("Experiment not found");
        setState("error");
        return;
      }

      if (data.status === "closed") {
        setError("This experiment is no longer accepting responses");
        setState("error");
        return;
      }

      const experimentData: Experiment = {
        id: data.id,
        title: data.title,
        status: data.status as "draft" | "active" | "closed",
        config: (data.config as unknown as ExperimentBlock[]) || [],
        owner_id: data.owner_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      if (experimentData.config.length === 0) {
        setError("This experiment has no content");
        setState("error");
        return;
      }

      setExperiment(experimentData);
      setState("preloading");
    } catch (err) {
      console.error("Error fetching experiment:", err);
      setError("Failed to load experiment");
      setState("error");
    }
  };

  // Preload images
  useEffect(() => {
    if (state === "preloading" && experiment) {
      preloadImages();
    }
  }, [state, experiment]);

  const preloadImages = async () => {
    if (!experiment) return;

    const imageUrls: string[] = [];

    // Collect all image URLs from IAT blocks
    experiment.config.forEach((block) => {
      if (block.type === "iat") {
        block.leftCategory.stimuli.forEach((s) => {
          if (s.type === "image") imageUrls.push(s.value);
        });
        block.rightCategory.stimuli.forEach((s) => {
          if (s.type === "image") imageUrls.push(s.value);
        });
      }
    });

    if (imageUrls.length === 0) {
      setState("running");
      return;
    }

    // Preload all images
    const loadPromises = imageUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
          img.src = url;
        })
    );

    await Promise.all(loadPromises);
    setState("running");
  };

  const handleBlockComplete = useCallback(
    (blockData: Record<string, unknown>) => {
      if (!experiment) return;

      const currentBlock = experiment.config[currentBlockIndex];
      const blockResult: BlockResult = {
        blockId: currentBlock.id,
        blockType: currentBlock.type,
        data: blockData,
        completedAt: Date.now(),
      };

      const newResults = [...results, blockResult];
      setResults(newResults);

      if (currentBlockIndex < experiment.config.length - 1) {
        setCurrentBlockIndex(currentBlockIndex + 1);
      } else {
        // All blocks complete - submit results
        submitResults(newResults);
      }
    },
    [experiment, currentBlockIndex, results]
  );

  const submitResults = async (finalResults: BlockResult[]) => {
    if (!id) return;

    try {
      const { error } = await supabase.from("results").insert([{
        experiment_id: id,
        data_json: JSON.parse(JSON.stringify(finalResults)),
      }]);

      if (error) throw error;

      setState("complete");
    } catch (err) {
      console.error("Error submitting results:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your responses. Please try again.",
      });
    }
  };

  const renderCurrentBlock = () => {
    if (!experiment || state !== "running") return null;

    const block = experiment.config[currentBlockIndex];
    const progress = ((currentBlockIndex + 1) / experiment.config.length) * 100;

    switch (block.type) {
      case "instruction":
        return (
          <InstructionRunner
            block={block}
            onComplete={handleBlockComplete}
            progress={progress}
          />
        );
      case "survey":
        return (
          <SurveyRunner
            block={block}
            onComplete={handleBlockComplete}
            progress={progress}
          />
        );
      case "iat":
        return (
          <IATRunner
            block={block}
            onComplete={handleBlockComplete}
            progress={progress}
          />
        );
      default:
        return null;
    }
  };

  // Loading state
  if (state === "loading" || state === "preloading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">
          {state === "loading" ? "Loading experiment..." : "Preparing stimuli..."}
        </p>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Unable to Load Experiment
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    );
  }

  // Complete state
  if (state === "complete") {
    return <RunnerComplete />;
  }

  // Running state
  return renderCurrentBlock();
}
