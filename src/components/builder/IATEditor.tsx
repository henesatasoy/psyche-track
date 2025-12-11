import { useState, useRef } from "react";
import { IATBlock, IATCategory, IATStimulus } from "@/types/experiment";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Upload, Image, Type, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IATEditorProps {
  block: IATBlock;
  onChange: (block: IATBlock) => void;
}

export function IATEditor({ block, onChange }: IATEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  const updateCategory = (
    side: "left" | "right",
    updates: Partial<IATCategory>
  ) => {
    const key = side === "left" ? "leftCategory" : "rightCategory";
    onChange({
      ...block,
      [key]: { ...block[key], ...updates },
    });
  };

  const addTextStimulus = (side: "left" | "right") => {
    const key = side === "left" ? "leftCategory" : "rightCategory";
    const category = block[key];

    const newStimulus: IATStimulus = {
      id: crypto.randomUUID(),
      type: "text",
      value: "",
    };

    onChange({
      ...block,
      [key]: {
        ...category,
        stimuli: [...category.stimuli, newStimulus],
      },
    });
  };

  const handleImageUpload = async (
    side: "left" | "right",
    file: File
  ) => {
    if (!user) return;

    const setUploading = side === "left" ? setUploadingLeft : setUploadingRight;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("stimuli")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("stimuli")
        .getPublicUrl(fileName);

      const key = side === "left" ? "leftCategory" : "rightCategory";
      const category = block[key];

      const newStimulus: IATStimulus = {
        id: crypto.randomUUID(),
        type: "image",
        value: urlData.publicUrl,
      };

      onChange({
        ...block,
        [key]: {
          ...category,
          stimuli: [...category.stimuli, newStimulus],
        },
      });

      toast({
        title: "Görsel yüklendi",
        description: "Uyaran görseli başarıyla eklendi.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Yükleme başarısız",
        description: "Görsel yüklenemedi. Lütfen tekrar deneyin.",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateStimulus = (
    side: "left" | "right",
    stimulusId: string,
    value: string
  ) => {
    const key = side === "left" ? "leftCategory" : "rightCategory";
    const category = block[key];

    onChange({
      ...block,
      [key]: {
        ...category,
        stimuli: category.stimuli.map((s) =>
          s.id === stimulusId ? { ...s, value } : s
        ),
      },
    });
  };

  const deleteStimulus = (side: "left" | "right", stimulusId: string) => {
    const key = side === "left" ? "leftCategory" : "rightCategory";
    const category = block[key];

    onChange({
      ...block,
      [key]: {
        ...category,
        stimuli: category.stimuli.filter((s) => s.id !== stimulusId),
      },
    });
  };

  const renderCategoryEditor = (
    side: "left" | "right",
    category: IATCategory,
    uploading: boolean,
    fileInputRef: React.RefObject<HTMLInputElement>
  ) => {
    const keyLabel = side === "left" ? "E" : "I";

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold">
              {keyLabel}
            </span>
            {side === "left" ? "Sol Kategori" : "Sağ Kategori"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori Etiketi</Label>
            <Input
              placeholder="örn., Hoş, İyi, Çiçekler"
              value={category.label}
              onChange={(e) => updateCategory(side, { label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Uyaranlar ({category.stimuli.length})</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTextStimulus(side)}
                >
                  <Type className="h-4 w-4 mr-1" />
                  Metin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4 mr-1" />
                  )}
                  Görsel
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(side, file);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>

            {category.stimuli.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-md text-muted-foreground text-sm">
                Henüz uyaran eklenmedi
              </div>
            ) : (
              <div className="space-y-2">
                {category.stimuli.map((stimulus) => (
                  <div
                    key={stimulus.id}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                  >
                    {stimulus.type === "image" ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={stimulus.value}
                          alt="Stimulus"
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="text-sm text-muted-foreground truncate flex-1">
                          Görsel uyaran
                        </span>
                      </div>
                    ) : (
                      <Input
                        value={stimulus.value}
                        onChange={(e) =>
                          updateStimulus(side, stimulus.id, e.target.value)
                        }
                        placeholder="Metin uyaranı girin..."
                        className="flex-1"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => deleteStimulus(side, stimulus.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          IAT Bloğu Yapılandırması
        </h3>
        <p className="text-sm text-muted-foreground">
          Örtük Çağrışım Testinizi kategoriler, uyaranlar ve zamanlama ile yapılandırın.
        </p>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time-limit">Zaman Sınırı</Label>
          <Select
            value={block.timeLimit === 0 ? "unlimited" : "limited"}
            onValueChange={(value) => {
              if (value === "unlimited") {
                onChange({ ...block, timeLimit: 0 });
              } else {
                onChange({ ...block, timeLimit: 3000 });
              }
            }}
          >
            <SelectTrigger id="time-limit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="limited">Sınırlı</SelectItem>
              <SelectItem value="unlimited">Sınırsız</SelectItem>
            </SelectContent>
          </Select>
          {block.timeLimit !== 0 && (
            <Input
              type="number"
              min={500}
              max={10000}
              step={100}
              value={block.timeLimit}
              onChange={(e) =>
                onChange({ ...block, timeLimit: parseInt(e.target.value) || 3000 })
              }
              className="mt-2"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {block.timeLimit === 0 
              ? "Katılımcı istediği kadar zaman alabilir" 
              : "Zaman aşımından önce maksimum yanıt süresi (500-10000ms)"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-type">Geri Bildirim Türü</Label>
          <Select
            value={block.feedbackType}
            onValueChange={(value: "correction" | "flash" | "none") =>
              onChange({ ...block, feedbackType: value })
            }
          >
            <SelectTrigger id="feedback-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="correction">
                Düzeltme (Doğru olana kadar bekle)
              </SelectItem>
              <SelectItem value="flash">
                Flaş (Kısa hata göstergesi)
              </SelectItem>
              <SelectItem value="none">
                Yok (Geri bildirim yok)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Yanlış yanıtlar nasıl işlensin
          </p>
        </div>
      </div>

      {/* Categories */}
      <Tabs defaultValue="left" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="left" className="gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold">
              E
            </span>
            {block.leftCategory.label || "Sol Kategori"}
          </TabsTrigger>
          <TabsTrigger value="right" className="gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold">
              I
            </span>
            {block.rightCategory.label || "Sağ Kategori"}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="left" className="mt-4">
          {renderCategoryEditor(
            "left",
            block.leftCategory,
            uploadingLeft,
            leftFileInputRef
          )}
        </TabsContent>
        <TabsContent value="right" className="mt-4">
          {renderCategoryEditor(
            "right",
            block.rightCategory,
            uploadingRight,
            rightFileInputRef
          )}
        </TabsContent>
      </Tabs>

      {/* Instructions Preview */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Katılımcılar{" "}
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">
              E
            </kbd>{" "}
            tuşuna <strong>{block.leftCategory.label || "Sol"}</strong> için ve{" "}
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">
              I
            </kbd>{" "}
            tuşuna <strong>{block.rightCategory.label || "Sağ"}</strong> için basacaklar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
