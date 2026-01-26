import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Phone, Mail, MapPin, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AdminClientDetails() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [match, params] = useRoute("/admin/clients/:id");
  const id = match ? Number(params?.id) : undefined;

  const { data: client, isLoading } = useUser(id);
  const updateUser = useUpdateUser();
  const { data: appointments } = useAppointments();

  const [notes, setNotes] = useState("");

  const clientAppointments = useMemo(() => {
    if (!appointments || !id) return [];
    return appointments
      .filter((a) => a.clientId === id)
      .sort(
        (a, b) =>
          new Date(`${b.date}T${b.time}`).getTime() -
          new Date(`${a.date}T${a.time}`).getTime(),
      );
  }, [appointments, id]);

  useEffect(() => {
    if (client) setNotes(client.privateNotes ?? "");
  }, [client?.id]);

  if (!match) return null;
  if (isLoading) return <div>Carregando...</div>;
  if (!client) return <div>Paciente não encontrado.</div>;

  const fullAddress = [
    client.address
      ? `${client.address}${client.number ? `, ${client.number}` : ""}`
      : null,
    client.complement ? client.complement : null,
    client.neighborhood ? client.neighborhood : null,
    client.city && client.state ? `${client.city}/${client.state}` : null,
    client.zipCode ? `CEP: ${client.zipCode}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const handleSaveNotes = async () => {
    try {
      await updateUser.mutateAsync({
        id: client.id,
        data: { privateNotes: notes },
      });

      toast({
        title: "Notas salvas!",
        description: "As notas privadas foram atualizadas com sucesso.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as notas privadas.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/clients")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <h1 className="text-3xl font-display font-bold">
            Detalhes do Paciente
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border">
                <AvatarImage src={client.photoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {client.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="font-bold text-lg truncate">{client.fullName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {client.username}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.username}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{client.phone || "Telefone não informado"}</span>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="leading-relaxed">
                  {fullAddress || "Endereço não cadastrado"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notas Privadas</CardTitle>

            <Button
              onClick={handleSaveNotes}
              disabled={updateUser.isPending}
              className="h-9"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateUser.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Observações do paciente.
            </p>

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Preferências, pontos de atenção, evolução..."
              className="min-h-[140px]"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Agendamentos</CardTitle>
        </CardHeader>

        <CardContent>
          {clientAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              Nenhum agendamento encontrado para este paciente.
            </div>
          ) : (
            <div className="space-y-3">
              {clientAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-slate-50 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {format(new Date(apt.date), "dd/MM/yyyy")} • {apt.time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(apt.date), "EEEE", { locale: ptBR })}
                    </div>
                    {apt.notes && (
                      <div className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded inline-block">
                        Obs: {apt.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <StatusBadge status={apt.status as any} />
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLocation(`/admin/appointments/${apt.id}`)
                      }
                    >
                      Ver Agendamento
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
