import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Captions, Loader2, Sparkles, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent?: string;
}

export function CCDialog({ open, onOpenChange, initialContent = "" }: CCDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [duration, setDuration] = useState([60]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCC, setGeneratedCC] = useState("");

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("Por favor, informe o conteúdo/roteiro do vídeo");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-edit', {
        body: {
          action: 'generate-cc',
          content,
          videoDuration: duration[0]
        }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedCC(data.result);
      toast.success("Legendas geradas com sucesso! 📝");
    } catch (error) {
      console.error('Error generating CC:', error);
      toast.error("Erro ao gerar legendas. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCC);
    toast.success("Legendas copiadas! 📋");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCC], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legendas-${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo SRT baixado! 📥");
  };

  const handleClose = () => {
    setGeneratedCC("");
    setContent(initialContent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Captions className="w-5 h-5 text-primary" />
            Gerar Closed Captions (Legendas)
          </DialogTitle>
          <DialogDescription>
            Crie legendas SRT automaticamente a partir do roteiro ou transcrição
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!generatedCC ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              {/* Content */}
              <div className="space-y-2">
                <Label>Roteiro / Transcrição *</Label>
                <Textarea
                  placeholder="Cole aqui o roteiro do vídeo ou transcrição do áudio..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Duração do Vídeo</Label>
                  <span className="text-sm font-medium text-primary">{duration[0]}s</span>
                </div>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={15}
                  max={600}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15s</span>
                  <span>10min</span>
                </div>
              </div>

              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleGenerate}
                disabled={isGenerating || !content.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Legendas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Legendas SRT
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <Captions className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Legendas SRT</p>
                    <p className="text-xs text-muted-foreground">{duration[0]}s de vídeo</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4 max-h-[350px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {generatedCC}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setGeneratedCC("")}
                >
                  Gerar Novas
                </Button>
                <Button 
                  variant="gradient" 
                  className="flex-1"
                  onClick={handleClose}
                >
                  Concluir
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
