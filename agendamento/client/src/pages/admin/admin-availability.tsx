import { useAvailability, useUpdateAvailability } from "@/hooks/use-availability";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { type InsertAvailability } from "@shared/routes";

const DAYS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", 
  "Quinta-feira", "Sexta-feira", "Sábado"
];

export default function AdminAvailability() {
  const { data: serverAvailability } = useAvailability();
  const updateAvailability = useUpdateAvailability();
  const { toast } = useToast();
  
  const [schedule, setSchedule] = useState<InsertAvailability[]>([]);

  // Initialize schedule structure for all 7 days
  useEffect(() => {
    if (serverAvailability) {
      const fullSchedule = Array.from({ length: 7 }).map((_, dayOfWeek) => {
        const existing = serverAvailability.find(a => a.dayOfWeek === dayOfWeek);
        return existing || { dayOfWeek, times: [], isActive: false };
      });
      setSchedule(fullSchedule);
    }
  }, [serverAvailability]);

  const handleToggleDay = (dayIndex: number, isActive: boolean) => {
    setSchedule(prev => prev.map((day, idx) => 
      idx === dayIndex ? { ...day, isActive } : day
    ));
  };

  const handleAddTime = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, idx) => 
      idx === dayIndex ? { ...day, times: [...day.times, "09:00"] } : day
    ));
  };

  const handleRemoveTime = (dayIndex: number, timeIndex: number) => {
    setSchedule(prev => prev.map((day, idx) => 
      idx === dayIndex ? { ...day, times: day.times.filter((_, i) => i !== timeIndex) } : day
    ));
  };

  const handleTimeChange = (dayIndex: number, timeIndex: number, newValue: string) => {
    setSchedule(prev => prev.map((day, idx) => 
      idx === dayIndex ? { 
        ...day, 
        times: day.times.map((t, i) => i === timeIndex ? newValue : t)
      } : day
    ));
  };

  const handleSave = async () => {
    try {
      await updateAvailability.mutateAsync(schedule);
      toast({ title: "Horários atualizados!", description: "Sua agenda foi salva com sucesso." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar horários." });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Configurar Horários</h1>
          <p className="text-muted-foreground">Defina os dias e horários que você atende.</p>
        </div>
        <Button onClick={handleSave} disabled={updateAvailability.isPending} className="w-32">
          {updateAvailability.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid gap-6">
        {schedule.map((day, dayIndex) => (
          <Card key={dayIndex} className={`transition-all ${day.isActive ? 'border-primary/50 bg-white' : 'opacity-60 bg-slate-50'}`}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={day.isActive || false}
                  onCheckedChange={(checked) => handleToggleDay(dayIndex, checked)}
                />
                <CardTitle className="text-lg">{DAYS[dayIndex]}</CardTitle>
              </div>
              {day.isActive && (
                <Button variant="ghost" size="sm" onClick={() => handleAddTime(dayIndex)} className="text-primary hover:text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Horário
                </Button>
              )}
            </CardHeader>
            
            {day.isActive && (
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {day.times.map((time, timeIndex) => (
                    <div key={timeIndex} className="flex items-center gap-1 bg-slate-100 p-1 pl-3 rounded-lg border">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(dayIndex, timeIndex, e.target.value)}
                        className="w-24 h-8 border-none bg-transparent focus-visible:ring-0 p-0 text-sm"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveTime(dayIndex, timeIndex)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {day.times.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-2">Nenhum horário definido para este dia.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
