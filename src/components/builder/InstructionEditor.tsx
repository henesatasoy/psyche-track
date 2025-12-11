import { InstructionBlock } from "@/types/experiment";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InstructionEditorProps {
  block: InstructionBlock;
  onChange: (block: InstructionBlock) => void;
}

export function InstructionEditor({ block, onChange }: InstructionEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-1">Instruction Block</h3>
        <p className="text-sm text-muted-foreground">
          Add instructions or guidelines that participants will see before continuing.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instruction-content">Content</Label>
        <Textarea
          id="instruction-content"
          placeholder="Enter your instructions here. You can use multiple paragraphs to explain the task..."
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          rows={10}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Write clear, concise instructions for participants.
        </p>
      </div>
    </div>
  );
}
