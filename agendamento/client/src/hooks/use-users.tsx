import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { UpdateUserRequest } from "@shared/schema";

export function useUsersList() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useUser(id?: number) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id: id! });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("Usuário não encontrado");
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateUserRequest;
    }) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: (_updated, vars) => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      queryClient.invalidateQueries({
        queryKey: [api.users.get.path, vars.id],
      });
    },
  });
}

export function useViaCep() {
  return useMutation({
    mutationFn: async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, "");
      if (cleanCep.length !== 8) return null;
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!res.ok) throw new Error("Failed to fetch address");
      const data = await res.json();
      if (data.erro) throw new Error("CEP not found");
      return data as {
        cep: string;
        logradouro: string;
        complemento: string;
        bairro: string;
        localidade: string;
        uf: string;
      };
    },
  });
}
