import { useAppointments } from "@/hooks/use-appointments";
import { useUsersList } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

export default function AdminHome() {
  const { data: appointments } = useAppointments();
  const { data: users } = useUsersList();
  const [, setLocation] = useLocation();

  const today = format(new Date(), "yyyy-MM-dd");

  const stats = [
    {
      title: "Agendamentos Hoje",
      value:
        appointments?.filter((a) => a.date === today && a.status === "agendado")
          .length || 0,
      icon: Calendar,
      color: "bg-blue-100 text-blue-700",
      href: "/admin/appointments",
    },
    {
      title: "Pendentes",
      value: appointments?.filter((a) => a.status === "em_analise").length || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700",
      href: "/admin/appointments",
    },
    {
      title: "Total Pacientes",
      value: users?.length || 0,
      icon: Users,
      color: "bg-teal-100 text-teal-700",
      href: "/admin/clients",
    },
    {
      title: "Realizados (Mês)",
      value: appointments?.filter((a) => a.status === "agendado").length || 0,
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
      href: "/admin/appointments",
    },
  ];

  const pendingAppointments =
    appointments?.filter((a) => a.status === "em_analise") || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-foreground">
        Painel Administrativo
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;

          return (
            <Card
              key={i}
              className="hover:shadow-md transition-all cursor-pointer"
              onClick={() => setLocation(stat.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setLocation(stat.href);
              }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
          </CardHeader>

          <CardContent>
            {pendingAppointments.length > 0 ? (
              <div className="space-y-4">
                {pendingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => setLocation(`/admin/appointments/${apt.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setLocation(`/admin/appointments/${apt.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xs">
                        {format(new Date(apt.date), "dd/MM")}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {apt.client?.fullName ?? "Paciente"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.time} •{" "}
                          {format(new Date(apt.date), "EEEE", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status="em_analise" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-200" />
                <p>Tudo em dia! Nenhuma solicitação pendente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agenda Hoje</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {appointments
                ?.filter((a) => a.date === today && a.status === "agendado")
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <div className="font-mono text-green-700 font-bold">
                      {apt.time}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {apt.client?.fullName ?? "Paciente"}
                    </div>
                  </div>
                ))}

              {!appointments?.some(
                (a) => a.date === today && a.status === "agendado",
              ) && (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum atendimento hoje.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
