import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, FileText, ClipboardList, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExperimentBlock } from "@/types/experiment";
import { cn } from "@/lib/utils";

interface SortableBlockProps {
  block: ExperimentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const blockIcons = {
  instruction: FileText,
  survey: ClipboardList,
  iat: Brain,
};

const blockLabels = {
  instruction: "Yönerge",
  survey: "Anket",
  iat: "IAT Bloğu",
};

export function SortableBlock({ block, isSelected, onSelect, onDelete }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = blockIcons[block.type];

  const getBlockPreview = () => {
    switch (block.type) {
      case "instruction":
        return block.content ? block.content.slice(0, 80) + (block.content.length > 80 ? "..." : "") : "Henüz içerik yok";
      case "survey":
        return `${block.questions.length} soru`;
      case "iat":
        return `${block.leftCategory.label} vs ${block.rightCategory.label}`;
      default:
        return "";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-all",
        isDragging && "opacity-50 shadow-lg",
        isSelected
          ? "ring-2 ring-primary border-primary"
          : "hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      <button
        className="touch-none p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground">
          {blockLabels[block.type]}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {getBlockPreview()}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
