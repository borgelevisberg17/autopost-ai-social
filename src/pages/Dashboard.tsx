import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Home, 
  PenTool, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Copy,
  RefreshCw,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { EditingToolbar } from "@/components/dashboard/EditingToolbar";
import { ContentPreview } from "@/components/dashboard/ContentPreview";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { VideoScriptDialog } from "@/components/dashboard/VideoScriptDialog";
import { ThumbnailDialog } from "@/components/dashboard/ThumbnailDialog";
import { CCDialog } from "@/components/dashboard/CCDialog";
import { cn } from "@/lib/utils";

const businessTypes = [
  "Pet Shop",
  "Barbearia",
  "Restaurante",
  "Loja de Roupas",
  "Academia",
  "Clínica de Estética",
  "Consultoria",
  "E-commerce",
  "Outro"
];

const tones = [
  { value: "divertido", label: "Divertido 😄" },
  { value: "profissional", label: "Profissional 💼" },
  { value: "emocional", label: "Emocional ❤️" },
  { value: "inspirador", label: "Inspirador ✨" },
  { value: "educativo", label: "Educativo 📚" },
];

const contentTypes = [
  { value: "post", label: "Post Feed" },
  { value: "story", label: "Story" },
  { value: "reels", label: "Legenda Reels" },
  { value: "anuncio", label: "Anúncio" },
  { value: "carrossel", label: "Carrossel" },
];

const platforms = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEditProcessing, setIsEditProcessing] = useState(false);
  
  // Dialog states
  const [showVideoScriptDialog, setShowVideoScriptDialog] = useState(false);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [showCCDialog, setShowCCDialog] = useState(false);
  
  // Form state
  const [businessType, setBusinessType] = useState("");
  const [audience, setAudience] = useState("");
  const [followers, setFollowers] = useState("");
  const [tone, setTone] = useState("");
  const [contentType, setContentType] = useState("");
  const [platform, setPlatform] = useState("");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleGenerate = async () => {
    if (!businessType || !tone || !contentType || !platform) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: "Tipo de negócio, tom, tipo de conteúdo e plataforma são necessários.",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          businessType,
          audience: audience || 'público geral',
          followerCount: followers || '1000',
          tone,
          contentType,
          platform,
          topic: topic || 'geral sobre o negócio'
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedContent(data.content);
      setOriginalContent(data.content);

      // Save to content history
      if (user) {
        await supabase.from('content_history').insert({
          user_id: user.id,
          content_type: contentType,
          platform,
          topic,
          generated_content: data.content,
          status: 'generated'
        });
      }
      
      toast.success("Conteúdo gerado com sucesso! ✨");
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Copiado! 📋");
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // AI Edit helper function
  const processAIEdit = async (action: string, extraParams: Record<string, any> = {}) => {
    if (!generatedContent) return;
    
    setIsEditProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-edit', {
        body: {
          action,
          content: generatedContent,
          platform,
          ...extraParams
        }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedContent(data.result);
      toast.success("Edição aplicada! ✨");
    } catch (error) {
      console.error('Error processing AI edit:', error);
      toast.error("Erro ao processar edição. Tente novamente.");
    } finally {
      setIsEditProcessing(false);
    }
  };

  // Editing tool handlers
  const handleSplit = () => processAIEdit('split');
  const handleAddHashtags = () => processAIEdit('hashtags');
  const handleAddEmojis = () => processAIEdit('emojis');
  const handleChangeTone = (targetTone: string) => processAIEdit('tone', { targetTone });
  const handleTranslate = (targetLanguage: string) => processAIEdit('translate', { targetLanguage });
  const handleShorten = () => processAIEdit('shorten');
  const handleExpand = () => processAIEdit('expand');

  const handleReset = () => {
    setGeneratedContent(originalContent);
    toast.success("Texto restaurado!");
  };

  const handleGenerateScript = () => setShowVideoScriptDialog(true);
  const handleGenerateThumbnail = () => setShowThumbnailDialog(true);
  const handleGenerateCC = () => setShowCCDialog(true);

  const handleContentChange = (newContent: string) => {
    setGeneratedContent(newContent);
  };

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex pb-16 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">AutoPost.AI</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
                <PenTool className="w-5 h-5" />
                Criar Conteúdo
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <Home className="w-5 h-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <Calendar className="w-5 h-5" />
                Agendamentos
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </Link>
            </li>
            <li>
              <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <Settings className="w-5 h-5" />
                Configurações
              </Link>
            </li>
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-sm text-muted-foreground truncate">Plano Free</p>
            </div>
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">AutoPost</span>
            </div>
            
            {/* Desktop Title */}
            <div className="hidden lg:block">
              <h1 className="font-display text-2xl font-bold">Criar Conteúdo</h1>
              <p className="text-muted-foreground text-sm">Gere posts personalizados para suas redes sociais</p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">3/3 restantes</span>
              <Button variant="gradient" size="sm" className="h-8 px-3 text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Upgrade</span>
                <span className="sm:hidden">Pro</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 max-w-6xl mx-auto">
            {/* Form - Collapsible on mobile when content exists */}
            <motion.div 
              layout
              className={cn(
                "space-y-4",
                generatedContent && "order-2 lg:order-1"
              )}
            >
              <div className="bg-card rounded-2xl border border-border p-4 lg:p-6 shadow-card">
                {/* Mobile: Collapse form when content is generated */}
                <div 
                  className="flex items-center justify-between cursor-pointer lg:cursor-default"
                  onClick={() => generatedContent && setShowAdvanced(!showAdvanced)}
                >
                  <h2 className="font-display font-semibold text-base lg:text-lg">
                    Configurações
                  </h2>
                  {generatedContent && (
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                
                <AnimatePresence initial={false}>
                  {(!generatedContent || showAdvanced || window.innerWidth >= 1024) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-4">
                        {/* Platform Selection - Prominent */}
                        <div className="grid grid-cols-4 gap-2">
                          {platforms.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => setPlatform(p.value)}
                              className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                                platform === p.value 
                                  ? "border-primary bg-primary/10 text-primary" 
                                  : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                              )}
                            >
                              <p.icon className="w-5 h-5" />
                              <span className="text-[10px] font-medium">{p.label.split('/')[0]}</span>
                            </button>
                          ))}
                        </div>

                        {/* Business Type */}
                        <div className="space-y-1.5">
                          <Label className="text-sm">Tipo de Negócio *</Label>
                          <Select value={businessType} onValueChange={setBusinessType}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type.toLowerCase()}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tone & Content Type in grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Tom *</Label>
                            <Select value={tone} onValueChange={setTone}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Tom" />
                              </SelectTrigger>
                              <SelectContent>
                                {tones.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-sm">Tipo *</Label>
                            <Select value={contentType} onValueChange={setContentType}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {contentTypes.map((ct) => (
                                  <SelectItem key={ct.value} value={ct.value}>
                                    {ct.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Topic */}
                        <div className="space-y-1.5">
                          <Label className="text-sm">Tema (opcional)</Label>
                          <Textarea
                            placeholder="Ex: Promoção de verão"
                            className="min-h-[80px] resize-none"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                          />
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          Opções avançadas
                        </button>

                        <AnimatePresence>
                          {showAdvanced && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-4 overflow-hidden"
                            >
                              <div className="space-y-1.5">
                                <Label className="text-sm">Público-alvo</Label>
                                <Input
                                  placeholder="Ex: Jovens 18-25 anos"
                                  className="h-11"
                                  value={audience}
                                  onChange={(e) => setAudience(e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-sm">Seguidores</Label>
                                <Input
                                  placeholder="Ex: 3000"
                                  type="number"
                                  className="h-11"
                                  value={followers}
                                  onChange={(e) => setFollowers(e.target.value)}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full mt-4"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {generatedContent ? "Regenerar" : "Gerar Conteúdo"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Result */}
            <motion.div 
              layout
              className={cn(
                "space-y-4",
                generatedContent && "order-1 lg:order-2"
              )}
            >
              <div className="bg-card rounded-2xl border border-border p-4 lg:p-6 shadow-card min-h-[400px] lg:min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-base lg:text-lg">Resultado</h2>
                  {generatedContent && !isGenerating && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={isGenerating} className="h-8 px-2">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="gradient" size="sm" onClick={handleCopy} className="h-8 px-3">
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Copiar</span>
                      </Button>
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <LoadingState />
                ) : generatedContent ? (
                  <div className="flex-1 flex flex-col gap-4 animate-fade-in">
                    {/* Content Preview */}
                    <ContentPreview
                      content={generatedContent}
                      platform={platform}
                      isEditable
                      onContentChange={handleContentChange}
                      onCopy={handleCopy}
                      onRegenerate={handleRegenerate}
                    />

                    {/* Editing Toolbar */}
                    <EditingToolbar
                      content={generatedContent}
                      platform={platform}
                      isProcessing={isEditProcessing}
                      onSplit={handleSplit}
                      onAddHashtags={handleAddHashtags}
                      onAddEmojis={handleAddEmojis}
                      onChangeTone={handleChangeTone}
                      onTranslate={handleTranslate}
                      onShorten={handleShorten}
                      onExpand={handleExpand}
                      onReset={handleReset}
                      onGenerateScript={handleGenerateScript}
                      onGenerateThumbnail={handleGenerateThumbnail}
                      onGenerateCC={handleGenerateCC}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-auto pt-4">
                      <Button variant="outline" className="flex-1 h-12">
                        Agendar
                      </Button>
                      <Button variant="gradient" className="flex-1 h-12">
                        Publicar Agora
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Dialogs */}
      <VideoScriptDialog 
        open={showVideoScriptDialog} 
        onOpenChange={setShowVideoScriptDialog}
        initialTopic={topic || generatedContent.substring(0, 100)}
      />
      <ThumbnailDialog 
        open={showThumbnailDialog} 
        onOpenChange={setShowThumbnailDialog}
        initialTitle={topic || "Seu Vídeo Incrível"}
      />
      <CCDialog 
        open={showCCDialog} 
        onOpenChange={setShowCCDialog}
        initialContent={generatedContent}
      />
    </div>
  );
};

export default Dashboard;
