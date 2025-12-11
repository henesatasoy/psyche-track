import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, ClipboardList, Brain } from "lucide-react";
import { BlockType } from "@/types/experiment";

interface AddBlockMenuProps {
  onAdd: (type: BlockType) => void;
}

const blockOptions = [
  {
    type: "instruction" as BlockType,
    label: "Instruction",
    description: "Text guidelines for participants",
    icon: FileText,
  },
  {
    type: "survey" as BlockType,
    label: "Survey",
    description: "Open-ended or multiple choice questions",
    icon: ClipboardList,
  },
  {
    type: "iat" as BlockType,
    label: "IAT Block",
    description: "Implicit Association Test task",
    icon: Brain,
  },
];

export function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-popover">
        {blockOptions.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => onAdd(option.type)}
            className="flex items-start gap-3 p-3"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
              <option.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
