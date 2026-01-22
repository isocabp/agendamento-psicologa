import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, MessageSquare } from "lucide-react";

export default function ClientAppointments() {
  const { data: appointments, isLoading } = useAppointments();

  if (isLoading) return <div>Carregando...</div>;

  const today = new Date().setHours(0,0,0,0);
  
  const future = appointments?.filter(a => new Date(a.date) >= new Date(today)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const history = appointments?.filter(a => new Date(a.date) < new Date(today)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary shrink-0">
              <span className="text-2xl font-bold font-display">{format(new Date(appointment.date), "dd")}</span>
              <span className="text-xs uppercase font-medium">{format(new Date(appointment.date), "MMM", { locale: ptBR })}</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Sessão de Terapia Individual</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {appointment.time}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(appointment.date), "EEEE", { locale: ptBR })}
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
            <StatusBadge status={appointment.status} className="px-4 py-1.5 text-sm" />
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

      <Tabs defaultValue="future" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="future">Próximos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="future" className="space-y-4 animate-in fade-in-50">
          {future.length > 0 ? (
            future.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <p className="text-muted-foreground">Você não tem agendamentos futuros.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 animate-in fade-in-50">
          {history.length > 0 ? (
            history.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)
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
