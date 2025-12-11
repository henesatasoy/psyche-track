import { ExperimentBlock, InstructionBlock, SurveyBlock, IATBlock } from "@/types/experiment";
import { InstructionEditor } from "./InstructionEditor";
import { SurveyEditor } from "./SurveyEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";

interface BlockEditorProps {
  block: ExperimentBlock | null;
  onChange: (block: ExperimentBlock) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  if (!block) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Select a block to edit its content</p>
          <p className="text-xs mt-1">or add a new block from the sidebar</p>
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
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">IAT Block</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              The IAT block editor will be implemented in Phase 3.
            </p>
          </CardContent>
        </Card>
      );
    default:
      return null;
  }
}
