import { useAuth } from "@/hooks/use-auth";
import { useUsersList, useUpdateUser, useViaCep } from "@/hooks/use-users";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useEffect } from "react";

export default function ClientProfile() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const viaCep = useViaCep();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      zipCode: user?.zipCode || "",
      address: user?.address || "",
      number: user?.number || "",
      complement: user?.complement || "",
      neighborhood: user?.neighborhood || "",
      city: user?.city || "",
      state: user?.state || "",
    }
  });

  const handleCepBlur = async () => {
    const cep = form.getValues("zipCode");
    if (!cep || cep.length < 8) return;

    try {
      const data = await viaCep.mutateAsync(cep);
      if (data) {
        form.setValue("address", data.logradouro);
        form.setValue("neighborhood", data.bairro);
        form.setValue("city", data.localidade);
        form.setValue("state", data.uf);
        toast({ title: "Endereço encontrado!", description: "Os campos foram preenchidos automaticamente." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "CEP não encontrado", description: "Verifique o número digitado." });
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    try {
      await updateUser.mutateAsync({ id: user.id, data });
      toast({ title: "Perfil atualizado!", description: "Seus dados foram salvos com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar as alterações." });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Mantenha seus dados de contato e endereço atualizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input {...form.register("fullName")} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...form.register("phone")} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Endereço</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input 
                      {...form.register("zipCode")} 
                      onBlur={handleCepBlur}
                      placeholder="00000-000" 
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleCepBlur} disabled={viaCep.isPending}>
                      {viaCep.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input {...form.register("address")} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input {...form.register("number")} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input {...form.register("complement")} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input {...form.register("neighborhood")} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Cidade</Label>
                  <Input {...form.register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input {...form.register("state")} maxLength={2} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
