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
  ChevronDown,
  Loader2
} from "lucide-react";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  
  // Form state
  const [businessType, setBusinessType] = useState("");
  const [audience, setAudience] = useState("");
  const [followers, setFollowers] = useState("");
  const [tone, setTone] = useState("");
  const [contentType, setContentType] = useState("");
  const [platform, setPlatform] = useState("");
  const [topic, setTopic] = useState("");

  const handleGenerate = async () => {
    if (!businessType || !tone || !contentType || !platform) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        description: "Tipo de negócio, tom, tipo de conteúdo e plataforma são necessários.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (will be replaced with actual API call)
    setTimeout(() => {
      const mockContent = `🐾 Seu pet merece o melhor cuidado do mundo!

Na nossa Pet Shop, cada patinha é tratada com amor e carinho. 💕

✨ Banho relaxante com produtos premium
✨ Tosa personalizada para cada raça
✨ Ambiente climatizado e seguro

📍 Venha nos visitar e dê ao seu amiguinho o tratamento VIP que ele merece!

💬 Agende agora pelo WhatsApp (link na bio)

#PetShop #AmordePets #Banhoetosa #CuidadoAnimal #PetLovers`;

      setGeneratedContent(mockContent);
      setIsGenerating(false);
      
      toast({
        title: "Conteúdo gerado com sucesso! ✨",
        description: "Revise e copie o texto gerado.",
      });
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copiado! 📋",
      description: "O texto foi copiado para a área de transferência.",
    });
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col">
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
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
                <PenTool className="w-5 h-5" />
                Criar Conteúdo
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <Home className="w-5 h-5" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <Calendar className="w-5 h-5" />
                Agendamentos
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                <Settings className="w-5 h-5" />
                Configurações
              </a>
            </li>
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Usuário</p>
              <p className="text-sm text-muted-foreground truncate">Plano Free</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Criar Conteúdo</h1>
              <p className="text-muted-foreground">Gere posts personalizados para suas redes sociais</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">3/3 posts restantes esta semana</span>
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl">
            {/* Form */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="font-display font-semibold text-lg mb-6">Configurações do Post</h2>
                
                <div className="space-y-5">
                  {/* Business Type */}
                  <div className="space-y-2">
                    <Label>Tipo de Negócio *</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione seu tipo de negócio" />
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

                  {/* Audience */}
                  <div className="space-y-2">
                    <Label>Público-alvo</Label>
                    <Input
                      placeholder="Ex: Donos de cães, Jovens 18-25 anos"
                      className="h-12"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>

                  {/* Followers */}
                  <div className="space-y-2">
                    <Label>Quantidade de Seguidores</Label>
                    <Input
                      placeholder="Ex: 3000"
                      type="number"
                      className="h-12"
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                    />
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <Label>Tom de Voz *</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o tom" />
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

                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label>Tipo de Conteúdo *</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o tipo" />
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

                  {/* Platform */}
                  <div className="space-y-2">
                    <Label>Plataforma *</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione a rede social" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <p.icon className="w-4 h-4" />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Topic */}
                  <div className="space-y-2">
                    <Label>Tema ou Assunto (opcional)</Label>
                    <Textarea
                      placeholder="Ex: Promoção de banho e tosa no mês dos pets"
                      className="min-h-[100px] resize-none"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full mt-6"
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
                      Gerar Conteúdo
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Result */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-semibold text-lg">Resultado</h2>
                  {generatedContent && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleRegenerate}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerar
                      </Button>
                      <Button variant="gradient" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>
                    </div>
                  )}
                </div>

                {generatedContent ? (
                  <div className="flex-1">
                    {/* Platform Preview */}
                    <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        {platform === "instagram" && <Instagram className="w-5 h-5 text-pink-500" />}
                        {platform === "facebook" && <Facebook className="w-5 h-5 text-blue-600" />}
                        {platform === "linkedin" && <Linkedin className="w-5 h-5 text-blue-700" />}
                        {platform === "twitter" && <Twitter className="w-5 h-5" />}
                        <span className="font-medium capitalize">{platform}</span>
                      </div>
                      <div className="bg-card rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full gradient-primary" />
                          <div>
                            <p className="font-medium">Seu Negócio</p>
                            <p className="text-xs text-muted-foreground">Agora</p>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {generatedContent}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        Agendar
                      </Button>
                      <Button variant="gradient" className="flex-1">
                        Publicar Agora
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                      <Sparkles className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">Nenhum conteúdo gerado</h3>
                    <p className="text-muted-foreground max-w-xs">
                      Preencha as configurações ao lado e clique em "Gerar Conteúdo" para começar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
