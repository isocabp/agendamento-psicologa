import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Register schema needs password confirmation
const registerSchema = api.auth.register.input.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (user) {
    setLocation(user.role === "admin" ? "/admin/home" : "/client/home");
    return null;
  }

  const loginForm = useForm({
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "", // email
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (data: any) => {
    try {
      await login.mutateAsync(data);
      toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message,
      });
    }
  };

  const onRegister = async (data: any) => {
    try {
      const { confirmPassword, ...rest } = data;
      await register.mutateAsync(rest);
      toast({ title: "Conta criada!", description: "Bem-vindo ao sistema." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary/5 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent z-0" />
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-2xl mx-auto shadow-xl shadow-primary/20 flex items-center justify-center mb-8">
            <span className="text-4xl">🌱</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-primary">
            Cuidando da sua mente,<br />cultivando seu bem-estar
          </h1>
          <p className="text-lg text-muted-foreground">
            Agende suas sessões de terapia de forma simples, rápida e segura.
            Um espaço dedicado ao seu crescimento pessoal.
          </p>
        </div>
        
        {/* Decorative circle */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1920&q=80')] opacity-5 bg-cover bg-center mix-blend-overlay" />
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-none shadow-none bg-transparent">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="login" className="text-base">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="text-base">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-display">Bem-vindo de volta</CardTitle>
                <CardDescription>Entre com seu e-mail e senha para acessar.</CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit(onLogin)}>
                <CardContent className="space-y-4 px-0">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" {...loginForm.register("username")} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" {...loginForm.register("password")} required />
                  </div>
                </CardContent>
                <CardFooter className="px-0">
                  <Button className="w-full h-12 text-base" type="submit" disabled={login.isPending}>
                    {login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-display">Crie sua conta</CardTitle>
                <CardDescription>Comece sua jornada de autocuidado hoje.</CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit(onRegister)}>
                <CardContent className="space-y-4 px-0">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input placeholder="Maria Silva" {...registerForm.register("fullName")} />
                    {registerForm.formState.errors.fullName && <p className="text-xs text-destructive">{registerForm.formState.errors.fullName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input type="email" placeholder="maria@email.com" {...registerForm.register("username")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input placeholder="(11) 99999-9999" {...registerForm.register("phone")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input type="password" {...registerForm.register("password")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar Senha</Label>
                      <Input type="password" {...registerForm.register("confirmPassword")} />
                    </div>
                  </div>
                  {registerForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>}
                </CardContent>
                <CardFooter className="px-0">
                  <Button className="w-full h-12 text-base" type="submit" disabled={register.isPending}>
                    {register.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
