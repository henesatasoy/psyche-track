export type BlockType = "instruction" | "survey" | "iat";

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface InstructionBlock extends BaseBlock {
  type: "instruction";
  content: string;
}

export interface SurveyQuestion {
  id: string;
  type: "open" | "multiple_choice";
  question: string;
  options?: string[]; // For multiple choice
  required: boolean;
}

export interface SurveyBlock extends BaseBlock {
  type: "survey";
  title: string;
  questions: SurveyQuestion[];
}

export interface IATStimulus {
  id: string;
  type: "text" | "image";
  value: string; // Text content or image URL
  correctResponse?: "left" | "right" | "none"; // Which key is correct, or none if no correct answer
}

export interface IATCategory {
  id: string;
  label: string;
  stimuli: IATStimulus[];
}

export interface IATBlock extends BaseBlock {
  type: "iat";
  timeLimit: number; // milliseconds
  feedbackType: "correction" | "flash" | "none";
  leftCategory: IATCategory;
  rightCategory: IATCategory;
}

export type ExperimentBlock = InstructionBlock | SurveyBlock | IATBlock;

export interface Experiment {
  id: string;
  title: string;
  status: "draft" | "active" | "closed";
  config: ExperimentBlock[];
  owner_id: string;
  created_at: string;
  updated_at: string;
}
