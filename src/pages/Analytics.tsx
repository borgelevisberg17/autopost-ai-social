import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";
import { 
  ArrowLeft, TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, 
  Sparkles, Instagram, Facebook, Linkedin, Twitter, BarChart3, Calendar,
  Lightbulb, Target, Zap, ArrowUpRight, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  platform: string;
  content_type: string;
  topic: string | null;
  status: string | null;
  created_at: string;
  generated_content: string;
}

const platformColors: Record<string, string> = {
  instagram: "hsl(330, 70%, 55%)",
  facebook: "hsl(220, 70%, 55%)",
  linkedin: "hsl(210, 80%, 45%)",
  twitter: "hsl(200, 90%, 50%)",
  tiktok: "hsl(340, 80%, 50%)",
  youtube: "hsl(0, 80%, 50%)",
};

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

const chartConfig = {
  posts: { label: "Posts", color: "hsl(var(--primary))" },
  instagram: { label: "Instagram", color: "hsl(330, 70%, 55%)" },
  facebook: { label: "Facebook", color: "hsl(220, 70%, 55%)" },
  linkedin: { label: "LinkedIn", color: "hsl(210, 80%, 45%)" },
  twitter: { label: "Twitter", color: "hsl(200, 90%, 50%)" },
  tiktok: { label: "TikTok", color: "hsl(340, 80%, 50%)" },
  youtube: { label: "YouTube", color: "hsl(0, 80%, 50%)" },
};

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (user) fetchContent();
  }, [user]);

  const fetchContent = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("content_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (!error && data) setContent(data);
    setLoading(false);
  };

  const getPostsByPlatform = () => {
    const counts: Record<string, number> = {};
    content.forEach(c => {
      counts[c.platform] = (counts[c.platform] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: platformColors[name] || "hsl(var(--primary))",
    }));
  };

  const getPostsByWeek = () => {
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { weekday: "short" });
      weeks[key] = 0;
    }
    content.forEach(c => {
      const d = new Date(c.created_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 7) {
        const key = d.toLocaleDateString("pt-BR", { weekday: "short" });
        if (weeks[key] !== undefined) weeks[key]++;
      }
    });
    return Object.entries(weeks).map(([day, posts]) => ({ day, posts }));
  };

  const getContentTypes = () => {
    const counts: Record<string, number> = {};
    content.forEach(c => {
      const type = c.content_type || "post";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: `hsl(${Math.random() * 360}, 70%, 55%)`,
    }));
  };

  const getStatusBreakdown = () => {
    const counts: Record<string, number> = { generated: 0, scheduled: 0, published: 0 };
    content.forEach(c => {
      const s = c.status || "generated";
      counts[s] = (counts[s] || 0) + 1;
    });
    return [
      { name: "Gerado", value: counts.generated, fill: "hsl(var(--primary))" },
      { name: "Agendado", value: counts.scheduled, fill: "hsl(45, 90%, 50%)" },
      { name: "Publicado", value: counts.published, fill: "hsl(142, 70%, 45%)" },
    ].filter(i => i.value > 0);
  };

  const getMonthlyTrend = () => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("pt-BR", { month: "short" });
      months[key] = 0;
    }
    content.forEach(c => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString("pt-BR", { month: "short" });
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([month, posts]) => ({ month, posts }));
  };

  const fetchAISuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const platformSummary = getPostsByPlatform().map(p => `${p.name}: ${p.value}`).join(", ");
      const recentTopics = content.slice(0, 5).map(c => c.topic || "sem tópico").join(", ");
      
      const { data, error } = await supabase.functions.invoke("ai-edit", {
        body: {
          content: `Análise de conteúdo do usuário:\n- Total de posts: ${content.length}\n- Distribuição por plataforma: ${platformSummary}\n- Tópicos recentes: ${recentTopics}\n- Tipos de conteúdo: ${getContentTypes().map(t => `${t.name}: ${t.value}`).join(", ")}`,
          action: "suggestions",
        },
      });

      if (error) throw error;
      const text = data?.editedContent || data?.content || "";
      const lines = text.split("\n").filter((l: string) => l.trim().length > 5);
      setSuggestions(lines.slice(0, 5));
    } catch {
      toast.error("Erro ao gerar sugestões");
      setSuggestions([
        "💡 Diversifique suas plataformas — posts no LinkedIn tendem a ter maior alcance orgânico",
        "📅 Mantenha uma frequência consistente de pelo menos 3 posts por semana",
        "🎯 Use hashtags relevantes e específicas para aumentar o alcance",
        "📊 Experimente diferentes formatos como carrosséis e vídeos curtos",
        "⏰ Publique nos horários de pico da sua audiência (12h-14h e 18h-20h)",
      ]);
    }
    setLoadingSuggestions(false);
  };

  const totalPosts = content.length;
  const thisWeek = content.filter(c => {
    const diff = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;
  const lastWeek = content.filter(c => {
    const diff = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 7 && diff < 14;
  }).length;
  const weekGrowth = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const publishedCount = content.filter(c => c.status === "published").length;
  const scheduledCount = content.filter(c => c.status === "scheduled").length;

  const statCards = [
    { label: "Total de Posts", value: totalPosts, icon: BarChart3, color: "text-primary" },
    { label: "Esta Semana", value: thisWeek, icon: weekGrowth >= 0 ? TrendingUp : TrendingDown, color: weekGrowth >= 0 ? "text-green-500" : "text-red-500", sub: `${weekGrowth >= 0 ? "+" : ""}${weekGrowth}%` },
    { label: "Publicados", value: publishedCount, icon: Share2, color: "text-emerald-500" },
    { label: "Agendados", value: scheduledCount, icon: Calendar, color: "text-amber-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14 max-w-6xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Performance dos seus posts</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAISuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="hidden sm:inline ml-1">Sugestões IA</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    {stat.sub && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {stat.sub}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Sugestões de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <ArrowUpRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts */}
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Posts por Dia</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={getPostsByWeek()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribuição por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie data={getPostsByPlatform()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {getPostsByPlatform().map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                {/* Platform legend */}
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {getPostsByPlatform().map(p => (
                    <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                      {p.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tendência Mensal</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <AreaChart data={getMonthlyTrend()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="gradientPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="posts" stroke="hsl(var(--primary))" fill="url(#gradientPosts)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Status dos Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getStatusBreakdown().map(s => {
                const pct = totalPosts > 0 ? Math.round((s.value / totalPosts) * 100) : 0;
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{s.name}</span>
                      <span className="text-muted-foreground">{s.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.fill }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top platforms performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Performance por Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getPostsByPlatform().sort((a, b) => b.value - a.value).map((p, i) => {
                const Icon = platformIcons[p.name.toLowerCase()] || BarChart3;
                return (
                  <motion.div key={p.name} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.fill}20` }}>
                      <Icon className="w-5 h-5" style={{ color: p.fill }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.value} posts criados</p>
                    </div>
                    <Badge variant="secondary">{i === 0 ? "🏆 Top" : `#${i + 1}`}</Badge>
                  </motion.div>
                );
              })}
              {getPostsByPlatform().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum post ainda. Crie seu primeiro conteúdo!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
