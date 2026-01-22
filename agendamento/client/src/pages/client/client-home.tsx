import { useAuth } from "@/hooks/use-auth";
import {
  useAppointments,
  useCreateAppointment,
} from "@/hooks/use-appointments";
import { useAvailability } from "@/hooks/use-availability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { format, isAfter, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";

function toLocalDate(dateStr: string) {
  // evita bug de utc do new Date("yyyy-mm-dd")
  return startOfDay(parseISO(dateStr));
}

export default function ClientHome() {
  const { user } = useAuth();
  const { data: appointments } = useAppointments();
  const { data: availability } = useAvailability();
  const createAppointment = useCreateAppointment();
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const availableTimes = useMemo(() => {
    if (!availability || !date) return [];
    const dayOfWeek = date.getDay();
    const daySchedule = availability.find(
      (d) => d.dayOfWeek === dayOfWeek && d.isActive,
    );
    return daySchedule ? daySchedule.times : [];
  }, [availability, date]);

  const handleSelectDate = (selected: Date | undefined) => {
    setDate(selected);
    // quando muda a data, limpa horário/obs pra não ficar “preso”
    setTime("");
    setNotes("");
  };

  const handleBook = async () => {
    if (!user || !date || !time) return;

    try {
      await createAppointment.mutateAsync({
        clientId: user.id,
        date: format(date, "yyyy-MM-dd"),
        time,
        notes: notes ? notes : undefined,
      });

      toast({
        title: "Agendamento solicitado!",
        description: "Aguarde a confirmação da psicóloga.",
      });

      setOpen(false);
      setDate(undefined);
      setTime("");
      setNotes("");
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível realizar o agendamento.",
      });
    }
  };

  const nextAppointment = useMemo(() => {
    if (!appointments?.length) return undefined;

    const now = new Date();

    return appointments
      .filter((a) => a.status === "agendado")
      .filter((a) => {
        // aqui pode usar date+time local, tá ok
        const dt = new Date(`${a.date}T${a.time}`);
        return isAfter(dt, now);
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() -
          new Date(`${b.date}T${b.time}`).getTime(),
      )[0];
  }, [appointments]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Olá, {user?.fullName.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Como você está se sentindo hoje?
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30">
              <Plus className="w-5 h-5 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agendar Sessão</DialogTitle>
              <DialogDescription>
                Escolha o melhor dia e horário para você.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="flex justify-center border rounded-lg p-2 bg-slate-50">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleSelectDate}
                  defaultMonth={date ?? new Date()}
                  disabled={(d) => {
                    const day = d.getDay();
                    const isPast = d < todayStart;
                    const hasSlots =
                      availability?.some(
                        (a) => a.dayOfWeek === day && a.isActive,
                      ) ?? false;
                    return isPast || !hasSlots;
                  }}
                  locale={ptBR}
                  className="rounded-md"
                />
              </div>

              {date && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium">
                    Horário Disponível
                  </label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {date && time && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium">
                    Observações (opcional)
                  </label>
                  <Textarea
                    placeholder="Gostaria de falar sobre..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleBook}
                disabled={!date || !time || createAppointment.isPending}
              >
                {createAppointment.isPending
                  ? "Agendando..."
                  : "Confirmar Agendamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card border-l-4 border-l-primary relative overflow-hidden">
          <div className="absolute right-0 top-0 p-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Próxima Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-display font-bold text-foreground">
                    {format(toLocalDate(nextAppointment.date), "dd")}
                  </div>
                  <div className="pb-1 text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {format(toLocalDate(nextAppointment.date), "MMMM", {
                        locale: ptBR,
                      })}
                    </p>
                    <p>
                      {format(toLocalDate(nextAppointment.date), "EEEE", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium bg-primary/10 w-fit px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  {nextAppointment.time}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Nenhuma sessão agendada.</p>
                <button
                  type="button"
                  className="text-primary font-semibold underline underline-offset-4 hover:opacity-90"
                  onClick={() => setOpen(true)}
                >
                  Agendar agora
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments?.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-xs font-bold text-slate-500">
                      {format(toLocalDate(apt.date), "dd/MM")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Sessão de Terapia</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.time}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status as any} />
                </div>
              ))}
              {!appointments?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem histórico ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
