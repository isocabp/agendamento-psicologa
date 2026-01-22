import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/use-appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AdminAppointments() {
  const { data: appointments, isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = appointments?.filter(apt => {
    const matchesFilter = filter === "all" || apt.status === filter;
    const matchesSearch = apt.client?.fullName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-display font-bold">Gestão de Agendamentos</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar paciente..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="em_analise">Pendentes</SelectItem>
              <SelectItem value="agendado">Confirmados</SelectItem>
              <SelectItem value="recusado">Recusados</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered?.map((apt) => (
          <Card key={apt.id} className="overflow-hidden hover:shadow-sm transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 flex-1 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-col items-center justify-center w-14 h-14 bg-slate-100 rounded-lg hidden md:flex text-slate-600">
                    <span className="text-xl font-bold">{format(new Date(apt.date), "dd")}</span>
                    <span className="text-[10px] uppercase font-bold">{format(new Date(apt.date), "MMM", { locale: ptBR })}</span>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between md:justify-start gap-2">
                      <h3 className="font-semibold text-lg">{apt.client?.fullName}</h3>
                      <span className="text-sm text-muted-foreground md:hidden">{format(new Date(apt.date), "dd/MM")}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(apt.date), "EEEE", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>{apt.time}</span>
                    </div>
                    {apt.notes && (
                      <p className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded mt-2 inline-block">
                        Obs: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t md:border-t-0 md:border-l flex items-center justify-between md:justify-end gap-3 min-w-[200px]">
                  <StatusBadge status={apt.status as any} />
                  
                  {apt.status === "em_analise" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => updateStatus.mutate({ id: apt.id, status: "recusado" })}
                        disabled={updateStatus.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatus.mutate({ id: apt.id, status: "agendado" })}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {apt.status === "agendado" && (
                     <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: apt.id, status: "cancelado" })}
                      disabled={updateStatus.isPending}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            Nenhum agendamento encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
