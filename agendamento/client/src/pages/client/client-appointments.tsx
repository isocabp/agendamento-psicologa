import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, MessageSquare } from "lucide-react";

function toLocalDate(dateStr: string) {
  // evita bug de utc do new Date("yyyy-mm-dd")
  return startOfDay(parseISO(dateStr));
}

export default function ClientAppointments() {
  const { data: appointments, isLoading } = useAppointments();

  if (isLoading) return <div>Carregando...</div>;

  const todayStart = startOfDay(new Date());

  const upcoming = (appointments ?? [])
    .filter((a) => {
      const d = toLocalDate(a.date);
      const isFutureOrToday = d >= todayStart;
      const isUpcomingStatus =
        a.status === "em_analise" || a.status === "agendado";
      return isFutureOrToday && isUpcomingStatus;
    })
    .sort(
      (a, b) => toLocalDate(a.date).getTime() - toLocalDate(b.date).getTime(),
    );

  const history = (appointments ?? [])
    .filter((a) => {
      const d = toLocalDate(a.date);
      const isPast = d < todayStart;
      const isHistoryStatus =
        a.status === "recusado" || a.status === "cancelado";
      return isPast || isHistoryStatus;
    })
    .sort(
      (a, b) => toLocalDate(b.date).getTime() - toLocalDate(a.date).getTime(),
    );

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary shrink-0">
              <span className="text-2xl font-bold font-display">
                {format(toLocalDate(appointment.date), "dd")}
              </span>
              <span className="text-xs uppercase font-medium">
                {format(toLocalDate(appointment.date), "MMM", { locale: ptBR })}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                Sessão de Terapia Individual
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {appointment.time}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(toLocalDate(appointment.date), "EEEE", {
                    locale: ptBR,
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Online
                </div>
              </div>

              {appointment.notes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-slate-50 p-2 rounded-md">
                  <MessageSquare className="w-4 h-4" />
                  <span className="italic">"{appointment.notes}"</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center md:flex-col gap-2">
            <StatusBadge
              status={appointment.status}
              className="px-4 py-1.5 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Meus Agendamentos</h1>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent
          value="upcoming"
          className="space-y-4 animate-in fade-in-50"
        >
          {upcoming.length > 0 ? (
            upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <p className="text-muted-foreground">
                Você não tem agendamentos futuros.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="history"
          className="space-y-4 animate-in fade-in-50"
        >
          {history.length > 0 ? (
            history.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <p className="text-muted-foreground">Histórico vazio.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
