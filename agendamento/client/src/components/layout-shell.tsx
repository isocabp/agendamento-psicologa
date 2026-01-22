import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  Users, 
  Clock, 
  Settings, 
  LogOut, 
  Menu,
  User,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const adminLinks = [
    { href: "/admin/home", label: "Visão Geral", icon: Home },
    { href: "/admin/appointments", label: "Agendamentos", icon: Calendar },
    { href: "/admin/clients", label: "Pacientes", icon: Users },
    { href: "/admin/availability", label: "Horários", icon: Clock },
  ];

  const clientLinks = [
    { href: "/client/home", label: "Início", icon: Home },
    { href: "/client/appointments", label: "Meus Agendamentos", icon: History },
    { href: "/client/profile", label: "Meu Perfil", icon: User },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-primary">Psi. Ana</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {isAdmin ? "Painel Administrativo" : "Portal do Paciente"}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-200 bg-white/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
            <AvatarImage src={user.photoUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.username}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
          onClick={() => logout.mutate()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md z-40 border-b flex items-center justify-between">
        <span className="font-display font-bold text-primary text-lg">Psi. Ana</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
