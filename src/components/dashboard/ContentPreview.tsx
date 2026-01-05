import { Instagram, Facebook, Linkedin, Twitter, Copy, RefreshCw, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ContentPreviewProps {
  content: string;
  platform: string;
  isEditable?: boolean;
  onContentChange?: (content: string) => void;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

const platformIcons: Record<string, { icon: typeof Instagram; color: string }> = {
  instagram: { icon: Instagram, color: "text-pink-500" },
  facebook: { icon: Facebook, color: "text-blue-600" },
  linkedin: { icon: Linkedin, color: "text-blue-700" },
  twitter: { icon: Twitter, color: "text-foreground" },
};

export function ContentPreview({
  content,
  platform,
  isEditable = false,
  onContentChange,
  onCopy,
  onRegenerate,
  onShare,
  onDownload,
}: ContentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const PlatformIcon = platformIcons[platform]?.icon || Instagram;
  const platformColor = platformIcons[platform]?.color || "text-primary";

  const handleSaveEdit = () => {
    onContentChange?.(editedContent);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-secondary/30 rounded-2xl p-4 border border-border/50"
    >
      {/* Platform Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl bg-background ${platformColor}`}>
            <PlatformIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="font-medium capitalize">{platform}</span>
            <p className="text-xs text-muted-foreground">Preview</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        {/* Mock Profile */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full gradient-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">Seu Negócio</p>
            <p className="text-xs text-muted-foreground">Agora</p>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[200px] resize-none mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button size="sm" variant="gradient" onClick={handleSaveEdit} className="flex-1">
                  Salvar
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer hover:bg-secondary/30 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => isEditable && setIsEditing(true)}
            >
              {content}
              {isEditable && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Toque para editar
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
