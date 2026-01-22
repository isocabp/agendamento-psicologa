import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser, useViaCep } from "@/hooks/use-users";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { UploadButton } from "@/lib/uploadthing";

type ProfileFormValues = {
  fullName: string;
  phone: string;
  photoUrl?: string | null;

  zipCode: string;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export default function ClientProfile() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const viaCep = useViaCep();
  const { toast } = useToast();

  const lastCepFetchedRef = useRef<string>("");
  const debounceRef = useRef<number | null>(null);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
      photoUrl: user?.photoUrl ?? null,

      zipCode: user?.zipCode ?? "",
      address: user?.address ?? "",
      number: user?.number ?? "",
      complement: user?.complement ?? "",
      neighborhood: user?.neighborhood ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
    },
  });

  useEffect(() => {
    if (!user) return;

    form.reset({
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      photoUrl: user.photoUrl ?? null,

      zipCode: user.zipCode ?? "",
      address: user.address ?? "",
      number: user.number ?? "",
      complement: user.complement ?? "",
      neighborhood: user.neighborhood ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
    });

    lastCepFetchedRef.current = onlyDigits(user.zipCode ?? "");
  }, [user, form]);

  const zipCodeValue = form.watch("zipCode");
  const photoUrlValue = form.watch("photoUrl") ?? "";

  const normalizedCep = useMemo(
    () => onlyDigits(zipCodeValue ?? ""),
    [zipCodeValue],
  );

  const fillAddressFromCep = (data: any) => {
    form.setValue("address", data.logradouro ?? "");
    form.setValue("neighborhood", data.bairro ?? "");
    form.setValue("city", data.localidade ?? "");
    form.setValue("state", data.uf ?? "");
  };

  const fetchCep = async (cepDigits: string) => {
    if (!cepDigits || cepDigits.length !== 8) return;
    if (lastCepFetchedRef.current === cepDigits) return;

    try {
      const data = await viaCep.mutateAsync(cepDigits);

      if (!data || (data as any).erro) throw new Error("CEP não encontrado");

      lastCepFetchedRef.current = cepDigits;
      fillAddressFromCep(data);

      toast({
        title: "endereço encontrado!",
        description: "os campos foram preenchidos automaticamente.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "cep não encontrado",
        description: "verifique o número digitado.",
      });
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (normalizedCep.length !== 8) return;

    debounceRef.current = window.setTimeout(() => {
      fetchCep(normalizedCep);
    }, 450);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCep]);

  const handleCepButton = async () => {
    await fetchCep(normalizedCep);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    const payload: ProfileFormValues = {
      ...data,
      zipCode: onlyDigits(data.zipCode ?? ""),
      photoUrl: data.photoUrl?.trim() ? data.photoUrl.trim() : null,
    };

    try {
      await updateUser.mutateAsync({ id: user.id, data: payload });
      toast({
        title: "perfil atualizado!",
        description: "seus dados foram salvos com sucesso.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "erro",
        description: "não foi possível salvar as alterações.",
      });
    }
  };

  const handleRemovePhoto = () => {
    form.setValue("photoUrl", null, { shouldDirty: true });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>
            Mantenha seus dados de contato e endereço atualizados.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* foto */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium mb-4">Foto</h3>

              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                  {photoUrlValue ? (
                    <img
                      src={photoUrlValue}
                      alt="foto do perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {user?.fullName?.slice(0, 1)?.toUpperCase() ?? "u"}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <UploadButton
                      endpoint="profileImage"
                      onClientUploadComplete={(res) => {
                        const fileUrl = res?.[0]?.url ?? res?.[0]?.ufsUrl;
                        if (fileUrl) form.setValue("photoUrl", fileUrl);
                        toast({
                          title: "Upload concluído!",
                          description: "Agora é só salvar as alterações.",
                        });
                      }}
                      onUploadError={(error) => {
                        toast({
                          variant: "destructive",
                          title: "Erro no upload",
                          description: error.message,
                        });
                      }}
                      appearance={{
                        container: "flex items-center gap-3",
                        button:
                          "h-10 px-4 rounded-lg border border-primary bg-primary text-primary-foreground font-semibold " +
                          "hover:opacity-90 transition",
                        allowedContent: "hidden", // some com "Image (4MB)" etc
                        clearBtn: "hidden",
                      }}
                      content={{
                        button: ({ isUploading }) =>
                          isUploading ? "Enviando..." : "Escolher foto",
                        allowedContent: () => null,
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemovePhoto}
                      disabled={!photoUrlValue}
                      title="remover foto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Depois do upload, clica em “salvar alterações” pra gravar no
                    seu perfil.
                  </p>
                </div>
              </div>
            </div>

            {/* dados básicos */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input {...form.register("fullName")} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  {...form.register("phone")}
                  placeholder="(22) 99999-9999"
                />
              </div>
            </div>

            {/* endereço */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Endereço</h3>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00000-000"
                      {...form.register("zipCode", {
                        onChange: (e) => {
                          const digits = onlyDigits(e.target.value);
                          form.setValue("zipCode", digits);
                        },
                      })}
                      inputMode="numeric"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCepButton}
                      disabled={viaCep.isPending || normalizedCep.length !== 8}
                      title="Buscar CEP"
                    >
                      {viaCep.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
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
                {updateUser.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
