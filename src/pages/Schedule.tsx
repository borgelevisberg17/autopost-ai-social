import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, isSameDay, startOfMonth, endOfMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MobileNav } from "@/components/dashboard/MobileNav";
import {
  CalendarIcon,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface ScheduledItem {
  id: string;
  generated_content: string;
  platform: string;
  content_type: string;
  topic: string | null;
  status: string | null;
  created_at: string;
  scheduled_at: string | null;
  published_at?: string | null;
  publish_error?: string | null;
}

const platformConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  instagram: { icon: <Instagram className="h-4 w-4" />, color: "text-pink-500", bg: "bg-pink-500/10" },
  linkedin: { icon: <Linkedin className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-600/10" },
  twitter: { icon: <Twitter className="h-4 w-4" />, color: "text-sky-500", bg: "bg-sky-500/10" },
  facebook: { icon: <Facebook className="h-4 w-4" />, color: "text-blue-500", bg: "bg-blue-500/10" },
};

const Schedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [allContent, setAllContent] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>("all");

  useEffect(() => {
    if (user) fetchContent();
  }, [user]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      const content = (data || []) as ScheduledItem[];
      setAllContent(content);
      setItems(content.filter(i => i.scheduled_at));
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduledDates = useMemo(() => {
    const dates = new Map<string, ScheduledItem[]>();
    items.forEach(item => {
      if (item.scheduled_at) {
        const key = format(new Date(item.scheduled_at), "yyyy-MM-dd");
        if (!dates.has(key)) dates.set(key, []);
        dates.get(key)!.push(item);
      }
    });
    return dates;
  }, [items]);

  const selectedDayItems = useMemo(() => {
    return items.filter(item =>
      item.scheduled_at && isSameDay(new Date(item.scheduled_at), selectedDate)
    ).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  }, [items, selectedDate]);

  const filteredItems = useMemo(() => {
    if (selectedPlatformFilter === "all") return selectedDayItems;
    return selectedDayItems.filter(i => i.platform === selectedPlatformFilter);
  }, [selectedDayItems, selectedPlatformFilter]);

  const unscheduledContent = useMemo(() => {
    return allContent.filter(i => !i.scheduled_at);
  }, [allContent]);

  const handleSchedule = async () => {
    if (!selectedContentId || !scheduleDate) return;

    try {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from("content_history")
        .update({ scheduled_at: scheduledAt.toISOString(), status: "scheduled" })
        .eq("id", selectedContentId);

      if (error) throw error;

      await fetchContent();
      setShowScheduleDialog(false);
      toast({
        title: "Agendado!",
        description: `Post agendado para ${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
      });
    } catch (error) {
      console.error("Error scheduling:", error);
      toast({ title: "Erro", description: "Não foi possível agendar.", variant: "destructive" });
    }
  };

  const handleCancelSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_history")
        .update({ scheduled_at: null, status: "generated" })
        .eq("id", id);

      if (error) throw error;
      await fetchContent();
      toast({ title: "Cancelado!", description: "Agendamento removido." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível cancelar.", variant: "destructive" });
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Copiado!", description: "Conteúdo copiado." });
  };

  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = items.filter(i => {
      if (!i.scheduled_at) return false;
      const d = new Date(i.scheduled_at);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const upcoming = items.filter(i => i.scheduled_at && new Date(i.scheduled_at) > today);
    const todayItems = items.filter(i => i.scheduled_at && isSameDay(new Date(i.scheduled_at), today));
    return { total: thisMonth.length, upcoming: upcoming.length, today: todayItems.length };
  }, [items]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Agenda</h1>
          </div>
          <Button size="sm" onClick={() => {
            setScheduleDate(selectedDate);
            setShowScheduleDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-1" />
            Agendar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Este mês", value: stats.total, color: "text-primary" },
            { label: "Hoje", value: stats.today, color: "text-emerald-500" },
            { label: "Próximos", value: stats.upcoming, color: "text-amber-500" },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <CardContent className="py-3 px-2">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-2 sm:p-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              className="pointer-events-auto w-full"
              modifiers={{
                scheduled: (date) => scheduledDates.has(format(date, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                scheduled: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        {/* Platform filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "instagram", "linkedin", "twitter", "facebook"].map(p => (
            <Button
              key={p}
              variant={selectedPlatformFilter === p ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPlatformFilter(p)}
              className="whitespace-nowrap"
            >
              {p === "all" ? "Todos" : (
                <span className="flex items-center gap-1">
                  {platformConfig[p]?.icon}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Selected day items */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {isToday(selectedDate)
              ? "Hoje"
              : format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            {filteredItems.length > 0 && ` · ${filteredItems.length} post${filteredItems.length > 1 ? "s" : ""}`}
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <CalendarIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum post agendado para este dia</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setScheduleDate(selectedDate);
                    setShowScheduleDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agendar post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredItems.map((item, idx) => {
                  const pc = platformConfig[item.platform] || { icon: null, color: "", bg: "bg-muted" };
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="overflow-hidden">
                        <div className="flex">
                          <div className={cn("w-1 shrink-0", pc.bg.replace("/10", ""))} />
                          <div className="flex-1 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-lg", pc.bg)}>
                                  <span className={pc.color}>{pc.icon}</span>
                                </div>
                                <div>
                                  <p className="text-xs font-medium capitalize">{item.platform}</p>
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.scheduled_at && format(new Date(item.scheduled_at), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {item.status === "published" && (
                                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                                    Publicado
                                  </Badge>
                                )}
                                {item.status === "failed" && (
                                  <Badge variant="destructive" className="text-[10px]">Falhou</Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {item.content_type}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm line-clamp-3">{item.generated_content}</p>
                            {item.publish_error && (
                              <p className="text-[10px] text-destructive line-clamp-2">{item.publish_error}</p>
                            )}
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleCopy(item.generated_content)}>
                                <Copy className="h-3 w-3 mr-1" /> Copiar
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleCancelSchedule(item.id)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Agendar Publicação
            </DialogTitle>
            <DialogDescription>Selecione um conteúdo e defina data/hora para publicação.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um conteúdo..." />
                </SelectTrigger>
                <SelectContent>
                  {unscheduledContent.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {platformConfig[c.platform]?.icon}
                        <span className="truncate max-w-[200px]">{c.generated_content.slice(0, 50)}...</span>
                      </span>
                    </SelectItem>
                  ))}
                  {unscheduledContent.length === 0 && (
                    <SelectItem value="none" disabled>Nenhum conteúdo disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>

            {scheduleDate && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Publicação em:</p>
                <p className="font-medium text-sm">
                  {format(scheduleDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {scheduleTime}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancelar</Button>
            <Button onClick={handleSchedule} disabled={!selectedContentId || !scheduleDate}>
              <Clock className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
};

export default Schedule;
