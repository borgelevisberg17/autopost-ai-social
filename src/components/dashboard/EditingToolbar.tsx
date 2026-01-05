import { 
  Scissors, 
  Type, 
  Palette, 
  Wand2, 
  Hash, 
  Smile, 
  AlignLeft, 
  RotateCcw,
  Sparkles,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface EditingToolbarProps {
  onSplit?: () => void;
  onAddHashtags?: () => void;
  onAddEmojis?: () => void;
  onChangeTone?: () => void;
  onTranslate?: () => void;
  onShorten?: () => void;
  onExpand?: () => void;
  onReset?: () => void;
}

const tools = [
  { icon: Scissors, label: "Dividir", action: "split", description: "Dividir em partes" },
  { icon: Hash, label: "Hashtags", action: "hashtags", description: "Adicionar hashtags" },
  { icon: Smile, label: "Emojis", action: "emojis", description: "Adicionar emojis" },
  { icon: Palette, label: "Tom", action: "tone", description: "Mudar tom" },
  { icon: Languages, label: "Traduzir", action: "translate", description: "Traduzir texto" },
  { icon: AlignLeft, label: "Resumir", action: "shorten", description: "Encurtar texto" },
  { icon: Wand2, label: "Expandir", action: "expand", description: "Expandir texto" },
  { icon: RotateCcw, label: "Reset", action: "reset", description: "Voltar ao original" },
];

export function EditingToolbar({
  onSplit,
  onAddHashtags,
  onAddEmojis,
  onChangeTone,
  onTranslate,
  onShorten,
  onExpand,
  onReset,
}: EditingToolbarProps) {
  const handleAction = (action: string) => {
    switch (action) {
      case "split": onSplit?.(); break;
      case "hashtags": onAddHashtags?.(); break;
      case "emojis": onAddEmojis?.(); break;
      case "tone": onChangeTone?.(); break;
      case "translate": onTranslate?.(); break;
      case "shorten": onShorten?.(); break;
      case "expand": onExpand?.(); break;
      case "reset": onReset?.(); break;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/50 backdrop-blur-sm rounded-2xl p-3 border border-border"
    >
      <div className="flex items-center gap-1 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Ferramentas de Edição</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
        {tools.map((tool) => (
          <Tooltip key={tool.action}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-12 sm:h-10 flex-col sm:flex-row gap-1 sm:gap-2 px-2 sm:px-3 hover:bg-primary/10 hover:text-primary"
                onClick={() => handleAction(tool.action)}
              >
                <tool.icon className="w-4 h-4" />
                <span className="text-[10px] sm:text-xs">{tool.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </motion.div>
  );
}
