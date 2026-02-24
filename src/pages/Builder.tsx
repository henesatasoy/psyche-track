import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Save,
  Play,
  Copy,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableBlock } from "@/components/builder/SortableBlock";
import { BlockEditor } from "@/components/builder/BlockEditor";
import { AddBlockMenu } from "@/components/builder/AddBlockMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ExperimentBlock,
  BlockType,
  InstructionBlock,
  SurveyBlock,
  IATBlock,
} from "@/types/experiment";

type ExperimentStatus = "draft" | "active" | "closed";

interface ExperimentData {
  id: string;
  title: string;
  status: ExperimentStatus;
  config: ExperimentBlock[];
  owner_id: string;
}

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [experiment, setExperiment] = useState<ExperimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch experiment
  useEffect(() => {
    if (id && user) {
      fetchExperiment();
    }
  }, [id, user]);

  const fetchExperiment = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setExperiment({
        id: data.id,
        title: data.title,
        status: data.status as ExperimentStatus,
        config: (data.config as unknown as ExperimentBlock[]) || [],
        owner_id: data.owner_id,
      });
    } catch (error) {
      console.error("Error fetching experiment:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Deney yüklenemedi.",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const saveExperiment = useCallback(async () => {
    if (!experiment || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("experiments")
        .update({
          title: experiment.title,
          status: experiment.status,
          config: JSON.parse(JSON.stringify(experiment.config)),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Kaydedildi",
        description: "Deney başarıyla kaydedildi.",
      });
    } catch (error) {
      console.error("Error saving experiment:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Deney kaydedilemedi.",
      });
    } finally {
      setSaving(false);
    }
  }, [experiment, id, toast]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && experiment) {
      const oldIndex = experiment.config.findIndex((b) => b.id === active.id);
      const newIndex = experiment.config.findIndex((b) => b.id === over.id);

      setExperiment({
        ...experiment,
        config: arrayMove(experiment.config, oldIndex, newIndex),
      });
    }
  };

  const addBlock = (type: BlockType) => {
    if (!experiment) return;

    let newBlock: ExperimentBlock;
    const blockId = crypto.randomUUID();

    switch (type) {
      case "instruction":
        newBlock = {
          id: blockId,
          type: "instruction",
          content: "",
        } as InstructionBlock;
        break;
      case "survey":
        newBlock = {
          id: blockId,
          type: "survey",
          title: "",
          questions: [],
        } as SurveyBlock;
        break;
      case "iat":
        newBlock = {
          id: blockId,
          type: "iat",
          timeLimit: 3000,
          feedbackType: "correction",
          leftCategory: { id: crypto.randomUUID(), label: "Kategori A", stimuli: [] },
          rightCategory: { id: crypto.randomUUID(), label: "Kategori B", stimuli: [] },
        } as IATBlock;
        break;
      default:
        return;
    }

    setExperiment({
      ...experiment,
      config: [...experiment.config, newBlock],
    });
    setSelectedBlockId(blockId);
  };

  const updateBlock = (updatedBlock: ExperimentBlock) => {
    if (!experiment) return;

    setExperiment({
      ...experiment,
      config: experiment.config.map((block) =>
        block.id === updatedBlock.id ? updatedBlock : block
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    if (!experiment) return;

    setExperiment({
      ...experiment,
      config: experiment.config.filter((block) => block.id !== blockId),
    });

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const copyRunLink = () => {
    if (!id) return;
    const url = `${window.location.origin}/run/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link kopyalandı",
      description: "Katılımcı linki panoya kopyalandı.",
    });
  };

  const selectedBlock = experiment?.config.find((b) => b.id === selectedBlockId) || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "closed":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!experiment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Input
              value={experiment.title}
              onChange={(e) =>
                setExperiment({ ...experiment, title: e.target.value })
              }
              className="max-w-xs font-medium border-transparent hover:border-input focus:border-input"
              placeholder="Deney başlığı"
            />

            <Select
              value={experiment.status}
              onValueChange={(value: ExperimentStatus) =>
                setExperiment({ ...experiment, status: value })
              }
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="closed">Kapalı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={copyRunLink}>
              <Copy className="h-4 w-4 mr-2" />
              Linki Kopyala
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/run/${id}`} target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4 mr-2" />
                Önizleme
              </a>
            </Button>
            <Button size="sm" onClick={saveExperiment} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Block List */}
        <aside className="w-72 border-r border-border bg-card p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-foreground">Bloklar</h2>
            <Badge variant="secondary" className="text-xs">
              {experiment.config.length}
            </Badge>
          </div>

          <AddBlockMenu onAdd={addBlock} />

          <div className="mt-4 flex-1 overflow-y-auto space-y-2">
            {experiment.config.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Henüz blok yok. Yukarıdan ilk bloğunuzu ekleyin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={experiment.config.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {experiment.config.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </aside>

        {/* Editor Panel */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <BlockEditor block={selectedBlock} onChange={updateBlock} />
          </div>
        </main>
      </div>
    </div>
  );
}
