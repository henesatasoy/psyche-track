import { ExperimentBlock } from "@/types/experiment";
import { InstructionEditor } from "./InstructionEditor";
import { SurveyEditor } from "./SurveyEditor";
import { IATEditor } from "./IATEditor";

interface BlockEditorProps {
  block: ExperimentBlock | null;
  onChange: (block: ExperimentBlock) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  if (!block) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-sm">Düzenlemek için bir blok seçin</p>
        <p className="text-xs mt-1">veya kenar çubuğundan yeni bir blok ekleyin</p>
      </div>
    </div>
    );
  }

  switch (block.type) {
    case "instruction":
      return (
        <InstructionEditor
          block={block}
          onChange={(updated) => onChange(updated)}
        />
      );
    case "survey":
      return (
        <SurveyEditor
          block={block}
          onChange={(updated) => onChange(updated)}
        />
      );
    case "iat":
      return (
        <IATEditor
          block={block}
          onChange={(updated) => onChange(updated)}
        />
      );
    default:
      return null;
  }
}
