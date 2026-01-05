import { 
  Scissors, 
  Hash, 
  Smile, 
  Palette, 
  Languages, 
  AlignLeft, 
  Wand2, 
  RotateCcw,
  Sparkles,
  Video,
  Image,
  FileText,
  Captions,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";

interface EditingToolbarProps {
  content: string;
  platform: string;
  isProcessing?: boolean;
  onSplit: () => void;
  onAddHashtags: () => void;
  onAddEmojis: () => void;
  onChangeTone: (tone: string) => void;
  onTranslate: (language: string) => void;
  onShorten: () => void;
  onExpand: () => void;
  onReset: () => void;
  onGenerateScript: () => void;
  onGenerateThumbnail: () => void;
  onGenerateCC: () => void;
}

const textTools = [
  { icon: Scissors, label: "Dividir", action: "split", description: "Dividir em partes para stories" },
  { icon: Hash, label: "Hashtags", action: "hashtags", description: "Adicionar hashtags inteligentes" },
  { icon: Smile, label: "Emojis", action: "emojis", description: "Adicionar emojis estratégicos" },
  { icon: Palette, label: "Tom", action: "tone", description: "Mudar tom do texto" },
  { icon: Languages, label: "Traduzir", action: "translate", description: "Traduzir para outro idioma" },
  { icon: AlignLeft, label: "Resumir", action: "shorten", description: "Encurtar mantendo essência" },
  { icon: Wand2, label: "Expandir", action: "expand", description: "Expandir com mais detalhes" },
  { icon: RotateCcw, label: "Reset", action: "reset", description: "Voltar ao original" },
];

const videoTools = [
  { icon: Video, label: "Roteiro", action: "script", description: "Gerar roteiro de vídeo" },
  { icon: Image, label: "Thumbnail", action: "thumbnail", description: "Gerar thumbnail com IA" },
  { icon: Captions, label: "Legendas", action: "cc", description: "Gerar closed captions" },
];

const tones = [
  { value: "divertido", label: "Divertido 😄" },
  { value: "profissional", label: "Profissional 💼" },
  { value: "emocional", label: "Emocional ❤️" },
  { value: "inspirador", label: "Inspirador ✨" },
  { value: "educativo", label: "Educativo 📚" },
  { value: "provocativo", label: "Provocativo 🔥" },
  { value: "casual", label: "Casual 😎" },
];

const languages = [
  { value: "inglês", label: "🇺🇸 English" },
  { value: "espanhol", label: "🇪🇸 Español" },
  { value: "francês", label: "🇫🇷 Français" },
  { value: "alemão", label: "🇩🇪 Deutsch" },
  { value: "italiano", label: "🇮🇹 Italiano" },
  { value: "português", label: "🇧🇷 Português" },
  { value: "japonês", label: "🇯🇵 日本語" },
  { value: "coreano", label: "🇰🇷 한국어" },
  { value: "chinês", label: "🇨🇳 中文" },
];

export function EditingToolbar({
  content,
  platform,
  isProcessing = false,
  onSplit,
  onAddHashtags,
  onAddEmojis,
  onChangeTone,
  onTranslate,
  onShorten,
  onExpand,
  onReset,
  onGenerateScript,
  onGenerateThumbnail,
  onGenerateCC,
}: EditingToolbarProps) {
  const [showToneDialog, setShowToneDialog] = useState(false);
  const [showTranslateDialog, setShowTranslateDialog] = useState(false);
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const handleAction = (action: string) => {
    if (isProcessing) return;
    
    switch (action) {
      case "split": onSplit(); break;
      case "hashtags": onAddHashtags(); break;
      case "emojis": onAddEmojis(); break;
      case "tone": setShowToneDialog(true); break;
      case "translate": setShowTranslateDialog(true); break;
      case "shorten": onShorten(); break;
      case "expand": onExpand(); break;
      case "reset": onReset(); break;
      case "script": onGenerateScript(); break;
      case "thumbnail": onGenerateThumbnail(); break;
      case "cc": onGenerateCC(); break;
    }
  };

  const handleToneConfirm = () => {
    if (selectedTone) {
      onChangeTone(selectedTone);
      setShowToneDialog(false);
      setSelectedTone("");
    }
  };

  const handleTranslateConfirm = () => {
    if (selectedLanguage) {
      onTranslate(selectedLanguage);
      setShowTranslateDialog(false);
      setSelectedLanguage("");
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Text Editing Tools */}
        <div className="bg-secondary/50 backdrop-blur-sm rounded-2xl p-3 border border-border">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Edição de Texto</span>
            {isProcessing && <Loader2 className="w-3 h-3 animate-spin ml-auto text-primary" />}
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
            {textTools.map((tool) => (
              <Tooltip key={tool.action}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    className="h-11 sm:h-9 flex-col sm:flex-row gap-0.5 sm:gap-2 px-1.5 sm:px-3 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                    onClick={() => handleAction(tool.action)}
                  >
                    <tool.icon className="w-4 h-4" />
                    <span className="text-[9px] sm:text-xs leading-tight">{tool.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Video Tools */}
        <div className="bg-accent/10 backdrop-blur-sm rounded-2xl p-3 border border-accent/20">
          <div className="flex items-center gap-1 mb-2">
            <Video className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">Ferramentas de Vídeo</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {videoTools.map((tool) => (
              <Tooltip key={tool.action}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="h-14 flex-col gap-1 hover:bg-accent/10 hover:text-accent hover:border-accent/50 disabled:opacity-50"
                    onClick={() => handleAction(tool.action)}
                  >
                    <tool.icon className="w-5 h-5" />
                    <span className="text-xs">{tool.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tone Selection Dialog */}
      <Dialog open={showToneDialog} onOpenChange={setShowToneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Tom do Texto</DialogTitle>
            <DialogDescription>
              Escolha o novo tom para reescrever seu conteúdo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o tom</Label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um tom" />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowToneDialog(false)}>
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handleToneConfirm} disabled={!selectedTone}>
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Translation Dialog */}
      <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Traduzir Conteúdo</DialogTitle>
            <DialogDescription>
              Escolha o idioma para traduzir seu texto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Idioma de destino</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTranslateDialog(false)}>
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handleTranslateConfirm} disabled={!selectedLanguage}>
                Traduzir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
