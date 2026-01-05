import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Video, Loader2, Sparkles, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VideoScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
}

const platforms = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram Reels" },
  { value: "shorts", label: "YouTube Shorts" },
];

const styles = [
  { value: "educational", label: "Educativo" },
  { value: "entertainment", label: "Entretenimento" },
  { value: "promotional", label: "Promocional" },
  { value: "tutorial", label: "Tutorial" },
  { value: "storytelling", label: "Storytelling" },
];

export function VideoScriptDialog({ open, onOpenChange, initialTopic = "" }: VideoScriptDialogProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [platform, setPlatform] = useState("youtube");
  const [style, setStyle] = useState("educational");
  const [duration, setDuration] = useState([60]);
  const [includeHooks, setIncludeHooks] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Por favor, informe o tópico do vídeo");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-script', {
        body: {
          topic,
          platform,
          duration: duration[0],
          style,
          includeHooks,
          includeCTA
        }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedScript(data.script);
      toast.success("Roteiro gerado com sucesso! 🎬");
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    toast.success("Roteiro copiado! 📋");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-${platform}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Roteiro baixado! 📥");
  };

  const handleClose = () => {
    setGeneratedScript("");
    setTopic(initialTopic);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Gerar Roteiro de Vídeo
          </DialogTitle>
          <DialogDescription>
            Crie roteiros profissionais com IA para suas produções de vídeo
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!generatedScript ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              {/* Topic */}
              <div className="space-y-2">
                <Label>Tópico do Vídeo *</Label>
                <Textarea
                  placeholder="Ex: Como aumentar vendas com redes sociais em 2024"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Platform & Style */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estilo</Label>
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
                  max={300}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15s</span>
                  <span>5min</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Incluir Ganchos</Label>
                    <p className="text-xs text-muted-foreground">Adicionar hooks para capturar atenção</p>
                  </div>
                  <Switch checked={includeHooks} onCheckedChange={setIncludeHooks} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Incluir CTA</Label>
                    <p className="text-xs text-muted-foreground">Call-to-action no final</p>
                  </div>
                  <Switch checked={includeCTA} onCheckedChange={setIncludeCTA} />
                </div>
              </div>

              <Button 
                variant="hero" 
                className="w-full" 
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Roteiro...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Roteiro
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
                    <Video className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{platform.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{duration[0]}s • {style}</p>
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

              <div className="bg-secondary/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {generatedScript}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setGeneratedScript("")}
                >
                  Gerar Novo
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
