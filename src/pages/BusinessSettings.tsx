import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Settings, 
  Building2, 
  Users, 
  Palette, 
  ArrowLeft,
  Save,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Link
} from "lucide-react";

const businessTypes = [
  "Restaurante/Alimentação",
  "Beleza/Estética",
  "Saúde/Bem-estar",
  "Educação",
  "Tecnologia",
  "Varejo/E-commerce",
  "Serviços Profissionais",
  "Fitness/Academia",
  "Imobiliária",
  "Outro",
];

const tones = [
  "Profissional",
  "Casual",
  "Divertido",
  "Inspirador",
  "Educativo",
  "Persuasivo",
];

const BusinessSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    business_name: "",
    business_type: "",
    target_audience: "",
    brand_voice: "",
    default_tone: "Profissional",
    default_platform: "instagram",
    instagram_handle: "",
    linkedin_url: "",
    twitter_handle: "",
    facebook_url: "",
    auto_hashtags: true,
    include_emojis: true,
    include_cta: true,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(prev => ({
          ...prev,
          business_name: data.business_name || "",
          business_type: data.business_type || "",
          target_audience: data.target_audience || "",
          brand_voice: data.brand_voice || "",
          default_tone: data.default_tone || "Profissional",
          default_platform: data.default_platform || "instagram",
          instagram_handle: data.instagram_handle || "",
          linkedin_url: data.linkedin_url || "",
          twitter_handle: data.twitter_handle || "",
          facebook_url: data.facebook_url || "",
          auto_hashtags: data.auto_hashtags ?? true,
          include_emojis: data.include_emojis ?? true,
          include_cta: data.include_cta ?? true,
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_settings")
        .upsert({
          user_id: user?.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Configurações do Negócio</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Business Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Perfil do Negócio
              </CardTitle>
              <CardDescription>
                Informações básicas sobre sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nome do Negócio</Label>
                  <Input
                    id="business_name"
                    value={settings.business_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Minha Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Tipo de Negócio</Label>
                  <Select
                    value={settings.business_type}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, business_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_audience">Público-Alvo</Label>
                <Textarea
                  id="target_audience"
                  value={settings.target_audience}
                  onChange={(e) => setSettings(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="Descreva seu público-alvo (idade, interesses, localização, etc.)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Brand Voice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Voz da Marca
              </CardTitle>
              <CardDescription>
                Defina o tom e estilo das suas comunicações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand_voice">Descrição da Voz da Marca</Label>
                <Textarea
                  id="brand_voice"
                  value={settings.brand_voice}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_voice: e.target.value }))}
                  placeholder="Ex: Somos uma marca jovem e descontraída, que fala de forma direta e usa humor..."
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default_tone">Tom Padrão</Label>
                  <Select
                    value={settings.default_tone}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, default_tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tom" />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((tone) => (
                        <SelectItem key={tone} value={tone}>
                          {tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_platform">Plataforma Padrão</Label>
                  <Select
                    value={settings.default_platform}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, default_platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Redes Sociais
              </CardTitle>
              <CardDescription>
                Conecte suas contas para publicação automática (disponível no plano Pro)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={settings.instagram_handle}
                    onChange={(e) => setSettings(prev => ({ ...prev, instagram_handle: e.target.value }))}
                    placeholder="@seuusuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={settings.linkedin_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="linkedin.com/company/sua-empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter/X
                  </Label>
                  <Input
                    id="twitter"
                    value={settings.twitter_handle}
                    onChange={(e) => setSettings(prev => ({ ...prev, twitter_handle: e.target.value }))}
                    placeholder="@seuusuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={settings.facebook_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
                    placeholder="facebook.com/suapagina"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Preferências de Conteúdo
              </CardTitle>
              <CardDescription>
                Configurações padrão para geração de conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hashtags Automáticas</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir hashtags relevantes automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.auto_hashtags}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_hashtags: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir Emojis</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicionar emojis ao conteúdo gerado
                  </p>
                </div>
                <Switch
                  checked={settings.include_emojis}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_emojis: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Call-to-Action</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir chamada para ação nos posts
                  </p>
                </div>
                <Switch
                  checked={settings.include_cta}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_cta: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-5 w-5 mr-2" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
