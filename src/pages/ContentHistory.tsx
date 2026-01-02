import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  History, 
  Copy, 
  Edit, 
  Calendar, 
  Trash2, 
  ArrowLeft,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Clock,
  CalendarIcon
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

interface ContentItem {
  id: string;
  generated_content: string;
  platform: string;
  content_type: string;
  topic: string;
  status: string;
  created_at: string;
  scheduled_at: string | null;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
};

const ContentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [schedulingItem, setSchedulingItem] = useState<ContentItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("12:00");

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("content_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory((data || []) as ContentItem[]);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (generated_content: string) => {
    await navigator.clipboard.writeText(generated_content);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditedContent(item.generated_content);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from("content_history")
        .update({ generated_content: editedContent })
        .eq("id", editingItem.id);

      if (error) throw error;

      setHistory(prev =>
        prev.map(item =>
          item.id === editingItem.id ? { ...item, generated_content: editedContent } : item
        )
      );
      setEditingItem(null);
      toast({
        title: "Salvo!",
        description: "Conteúdo atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error updating content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Excluído!",
        description: "Conteúdo removido do histórico.",
      });
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleSchedule = (item: ContentItem) => {
    setSchedulingItem(item);
    if (item.scheduled_at) {
      const scheduledDate = new Date(item.scheduled_at);
      setScheduleDate(scheduledDate);
      setScheduleTime(format(scheduledDate, "HH:mm"));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate(tomorrow);
      setScheduleTime("12:00");
    }
  };

  const handleSaveSchedule = async () => {
    if (!schedulingItem || !scheduleDate) return;

    try {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      const scheduledAt = new Date(scheduleDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from("content_history")
        .update({ 
          scheduled_at: scheduledAt.toISOString(),
          status: "scheduled"
        })
        .eq("id", schedulingItem.id);

      if (error) throw error;

      setHistory(prev =>
        prev.map(item =>
          item.id === schedulingItem.id 
            ? { ...item, scheduled_at: scheduledAt.toISOString(), status: "scheduled" } 
            : item
        )
      );
      setSchedulingItem(null);
      toast({
        title: "Agendado!",
        description: `Conteúdo agendado para ${format(scheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
      });
    } catch (error) {
      console.error("Error scheduling content:", error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSchedule = async (item: ContentItem) => {
    try {
      const { error } = await supabase
        .from("content_history")
        .update({ 
          scheduled_at: null,
          status: "generated"
        })
        .eq("id", item.id);

      if (error) throw error;

      setHistory(prev =>
        prev.map(i =>
          i.id === item.id 
            ? { ...i, scheduled_at: null, status: "generated" } 
            : i
        )
      );
      toast({
        title: "Cancelado!",
        description: "Agendamento cancelado com sucesso.",
      });
    } catch (error) {
      console.error("Error canceling schedule:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (item: ContentItem) => {
    if (item.status === "scheduled" && item.scheduled_at) {
      return (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
          <Clock className="h-3 w-3 mr-1" />
          Agendado para {format(new Date(item.scheduled_at), "dd/MM 'às' HH:mm")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="capitalize">
        {item.status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Histórico de Conteúdo</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum conteúdo gerado ainda. Vá para o Dashboard para criar seu primeiro post!
              </p>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Criar Conteúdo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {platformIcons[item.platform] || null}
                      <Badge variant="secondary" className="capitalize">
                        {item.platform}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {item.content_type}
                      </Badge>
                      {getStatusBadge(item)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap mb-4">
                    {item.generated_content}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.generated_content)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    {item.status === "scheduled" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelSchedule(item)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Cancelar Agendamento
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSchedule(item)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[200px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!schedulingItem} onOpenChange={() => setSchedulingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendar Publicação
            </DialogTitle>
            <DialogDescription>
              Selecione a data e horário para publicar este conteúdo automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? (
                      format(scheduleDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Horário</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            {scheduleDate && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  O conteúdo será publicado em:
                </p>
                <p className="font-medium">
                  {format(scheduleDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {scheduleTime}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSchedule} disabled={!scheduleDate}>
              <Clock className="h-4 w-4 mr-2" />
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentHistory;
