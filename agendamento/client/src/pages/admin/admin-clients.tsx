import { useUsersList } from "@/hooks/use-users";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function AdminClients() {
  const { data: users, isLoading } = useUsersList();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const clients = useMemo(() => {
    const list =
      users?.filter(
        (u) =>
          u.role === "client" &&
          u.fullName.toLowerCase().includes(search.toLowerCase()),
      ) || [];
    return list;
  }, [users, search]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-display font-bold">Meus Pacientes</h1>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card
            key={client.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation(`/admin/clients/${client.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setLocation(`/admin/clients/${client.id}`);
              }
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                  <AvatarImage src={client.photoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {client.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-tight truncate">
                    {client.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {client.username}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone || "Não informado"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {client.city
                      ? `${client.city}, ${client.state}`
                      : "Endereço não cadastrado"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/admin/clients/${client.id}`);
                }}
              >
                Ver Detalhes
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum paciente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
