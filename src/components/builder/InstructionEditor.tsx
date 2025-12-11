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
        <h3 className="text-lg font-medium text-foreground mb-1">Yönerge Bloğu</h3>
        <p className="text-sm text-muted-foreground">
          Katılımcıların devam etmeden önce göreceği talimatları veya yönergeleri ekleyin.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instruction-content">İçerik</Label>
        <Textarea
          id="instruction-content"
          placeholder="Talimatlarınızı buraya girin. Görevi açıklamak için birden fazla paragraf kullanabilirsiniz..."
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          rows={10}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Katılımcılar için açık ve net talimatlar yazın.
        </p>
      </div>
    </div>
  );
}
