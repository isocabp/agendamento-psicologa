import {
  useAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Check, X, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminAppointmentDetails() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [match, params] = useRoute("/admin/appointments/:id");
  const id = match ? Number(params?.id) : undefined;

  const { data: appointment, isLoading, error } = useAppointment(id);
  const updateStatus = useUpdateAppointmentStatus();

  if (!match) return null;
  if (isLoading) return <div>Carregando...</div>;
  if (error || !appointment) return <div>Agendamento não encontrado.</div>;

  const clientName = appointment.client?.fullName ?? "Paciente";
  const dateLabel = format(new Date(appointment.date), "dd/MM/yyyy");
  const weekday = format(new Date(appointment.date), "EEEE", { locale: ptBR });

  const handleUpdate = async (
    status: "agendado" | "recusado" | "cancelado",
  ) => {
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status });
      toast({
        title: "Status atualizado!",
        description: "O agendamento foi atualizado com sucesso.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/appointments")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-3xl font-display font-bold">
          Detalhes do Agendamento
        </h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{clientName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {dateLabel} • {weekday} • {appointment.time}
            </p>
          </div>

          <StatusBadge status={appointment.status as any} />
        </CardHeader>

        <CardContent className="space-y-4">
          {appointment.client && (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  E-mail
                </p>
                <p>{appointment.client.username}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Telefone
                </p>
                <p>{appointment.client.phone || "-"}</p>
              </div>
            </div>
          )}

          <div className="text-sm">
            <p className="text-xs font-semibold text-muted-foreground">
              Observação do paciente
            </p>
            <p className="mt-1">
              {appointment.notes?.trim()
                ? appointment.notes
                : "Nenhuma observação informada."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {appointment.status === "em_analise" && (
              <>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleUpdate("recusado")}
                  disabled={updateStatus.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Recusar
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdate("agendado")}
                  disabled={updateStatus.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
              </>
            )}

            {appointment.status === "agendado" && (
              <Button
                variant="outline"
                onClick={() => handleUpdate("cancelado")}
                disabled={updateStatus.isPending}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}

            {appointment.client?.id && (
              <Button
                variant="outline"
                onClick={() =>
                  setLocation(`/admin/clients/${appointment.client!.id}`)
                }
              >
                Ver Paciente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
