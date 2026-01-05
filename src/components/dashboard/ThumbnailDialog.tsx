import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Image, Loader2, Sparkles, Download, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ThumbnailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
}

const styles = [
  { value: "youtube", label: "YouTube (16:9)" },
  { value: "instagram", label: "Instagram (1:1)" },
  { value: "tiktok", label: "TikTok (9:16)" },
  { value: "linkedin", label: "LinkedIn (16:9)" },
];

const themes = [
  { value: "tech", label: "Tecnologia" },
  { value: "business", label: "Negócios" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "education", label: "Educação" },
  { value: "entertainment", label: "Entretenimento" },
  { value: "gaming", label: "Gaming" },
  { value: "fitness", label: "Fitness" },
  { value: "food", label: "Gastronomia" },
];

export function ThumbnailDialog({ open, onOpenChange, initialTitle = "" }: ThumbnailDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [style, setStyle] = useState("youtube");
  const [theme, setTheme] = useState("tech");
  const [includeText, setIncludeText] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error("Por favor, informe o título para a thumbnail");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: {
          title,
          style,
          theme,
          includeText
        }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedImage(data.imageUrl);
      toast.success("Thumbnail gerada com sucesso! 🎨");
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast.error("Erro ao gerar thumbnail. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `thumbnail-${style}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Thumbnail baixada! 📥");
  };

  const handleRegenerate = () => {
    setGeneratedImage("");
    handleGenerate();
  };

  const handleClose = () => {
    setGeneratedImage("");
    setTitle(initialTitle);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-accent" />
            Gerar Thumbnail com IA
          </DialogTitle>
          <DialogDescription>
            Crie thumbnails atraentes para seus vídeos com inteligência artificial
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!generatedImage ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              {/* Title */}
              <div className="space-y-2">
                <Label>Título do Vídeo *</Label>
                <Input
                  placeholder="Ex: 5 DICAS para DOBRAR suas VENDAS"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use CAPS para palavras de destaque na thumbnail
                </p>
              </div>

              {/* Style & Theme */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tema Visual</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Include Text */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Incluir Texto na Imagem</Label>
                  <p className="text-xs text-muted-foreground">Adicionar título como overlay</p>
                </div>
                <Switch checked={includeText} onCheckedChange={setIncludeText} />
              </div>

              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleGenerate}
                disabled={isGenerating || !title.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Thumbnail...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Thumbnail
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-4"
            >
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img 
                  src={generatedImage} 
                  alt="Generated thumbnail"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar
                    </>
                  )}
                </Button>
                <Button 
                  variant="gradient" 
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
