import { ExperimentBlock } from "@/types/experiment";

interface BlockResult {
  blockId: string;
  blockType: string;
  data: Record<string, unknown>;
  completedAt: number;
}

interface ResultRow {
  experiment_id: string;
  result_id: string;
  participant_index: number;
  completed_at: string;
  block_index: number;
  block_type: string;
  block_id: string;
  // Survey fields
  survey_title?: string;
  question?: string;
  question_type?: string;
  answer?: string;
  // IAT fields
  iat_left_category?: string;
  iat_right_category?: string;
  iat_time_limit?: number;
  iat_feedback_type?: string;
  iat_mean_rt?: number;
  iat_accuracy?: number;
  trial_index?: number;
  stimulus_type?: string;
  stimulus_value?: string;
  correct_side?: string;
  response_side?: string;
  reaction_time?: number;
  correct?: boolean;
  timed_out?: boolean;
  // Instruction fields
  instruction_acknowledged?: boolean;
}

export function generateCSV(
  experimentId: string,
  experimentTitle: string,
  results: Array<{
    id: string;
    data_json: BlockResult[];
    completed_at: string;
  }>
): string {
  const rows: ResultRow[] = [];

  results.forEach((result, participantIndex) => {
    const blocks = result.data_json || [];

    blocks.forEach((block, blockIndex) => {
      const baseRow = {
        experiment_id: experimentId,
        result_id: result.id,
        participant_index: participantIndex + 1,
        completed_at: result.completed_at,
        block_index: blockIndex + 1,
        block_type: block.blockType,
        block_id: block.blockId,
      };

      switch (block.blockType) {
        case "instruction":
          rows.push({
            ...baseRow,
            instruction_acknowledged: block.data.acknowledged as boolean,
          });
          break;

        case "survey":
          const surveyData = block.data as {
            title: string;
            responses: Array<{
              questionId: string;
              question: string;
              type: string;
              answer: string;
            }>;
          };

          if (surveyData.responses && surveyData.responses.length > 0) {
            surveyData.responses.forEach((response) => {
              rows.push({
                ...baseRow,
                survey_title: surveyData.title,
                question: response.question,
                question_type: response.type,
                answer: response.answer,
              });
            });
          } else {
            rows.push({
              ...baseRow,
              survey_title: surveyData.title,
            });
          }
          break;

        case "iat":
          const iatData = block.data as {
            leftCategory: string;
            rightCategory: string;
            timeLimit: number;
            feedbackType: string;
            meanRT: number;
            accuracy: number;
            trials: Array<{
              stimulusId: string;
              stimulusValue: string;
              stimulusType: string;
              correctSide: string;
              responseSide: string | null;
              reactionTime: number;
              correct: boolean;
              timedOut: boolean;
            }>;
          };

          if (iatData.trials && iatData.trials.length > 0) {
            iatData.trials.forEach((trial, trialIndex) => {
              rows.push({
                ...baseRow,
                iat_left_category: iatData.leftCategory,
                iat_right_category: iatData.rightCategory,
                iat_time_limit: iatData.timeLimit,
                iat_feedback_type: iatData.feedbackType,
                iat_mean_rt: iatData.meanRT,
                iat_accuracy: iatData.accuracy,
                trial_index: trialIndex + 1,
                stimulus_type: trial.stimulusType,
                stimulus_value: trial.stimulusValue,
                correct_side: trial.correctSide,
                response_side: trial.responseSide || "",
                reaction_time: trial.reactionTime,
                correct: trial.correct,
                timed_out: trial.timedOut,
              });
            });
          } else {
            rows.push({
              ...baseRow,
              iat_left_category: iatData.leftCategory,
              iat_right_category: iatData.rightCategory,
              iat_time_limit: iatData.timeLimit,
              iat_feedback_type: iatData.feedbackType,
              iat_mean_rt: iatData.meanRT,
              iat_accuracy: iatData.accuracy,
            });
          }
          break;

        default:
          rows.push(baseRow);
      }
    });
  });

  if (rows.length === 0) {
    return "Veri bulunamadı";
  }

  // Get all unique columns
  const allColumns = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => allColumns.add(key));
  });

  // Order columns logically
  const columnOrder = [
    "experiment_id",
    "result_id",
    "participant_index",
    "completed_at",
    "block_index",
    "block_type",
    "block_id",
    "instruction_acknowledged",
    "survey_title",
    "question",
    "question_type",
    "answer",
    "iat_left_category",
    "iat_right_category",
    "iat_time_limit",
    "iat_feedback_type",
    "iat_mean_rt",
    "iat_accuracy",
    "trial_index",
    "stimulus_type",
    "stimulus_value",
    "correct_side",
    "response_side",
    "reaction_time",
    "correct",
    "timed_out",
  ];

  const columns = columnOrder.filter((col) => allColumns.has(col));

  // Generate CSV
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = columns.join(",");
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeCSV(row[col as keyof ResultRow])).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
