
"use client";

import { useFirebase, useCollection } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { useState } from "react";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS_OF_WEEK = [
  { label: "Dom", value: 0 },
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
];

export default function ShiftsPage() {
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [tolerance, setTolerance] = useState(15);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(false);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts, isLoading } = useCollection(shiftsQuery);

  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue) 
        : [...prev, dayValue]
    );
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      toast({ variant: "destructive", title: "Atención", description: "Seleccione al menos un día." });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(firestore, 'shifts'), {
        name,
        startTime,
        endTime,
        tolerance: Number(tolerance),
        days: selectedDays.sort(),
        createdAt: serverTimestamp()
      });
      toast({ title: "Jornada creada", description: "El horario se ha registrado correctamente." });
      setName("");
      setSelectedDays([1, 2, 3, 4, 5]);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la jornada." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'shifts', id));
      toast({ title: "Jornada eliminada" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={user ? { id: user.uid, name: user.displayName || 'Admin', role: 'admin', email: user.email || '' } : null} onLogout={handleLogout} />
      
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Jornadas</h1>
          <p className="text-muted-foreground">Configure los horarios institucionales y días de aplicación.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border-none shadow-xl h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Nueva Jornada</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddShift} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del Turno</Label>
                  <Input placeholder="Ej: Turno Mañana" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entrada</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Salida</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Días de la semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`h-9 w-9 rounded-lg text-xs font-bold transition-all border ${
                          selectedDays.includes(day.value)
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                        }`}
                      >
                        {day.label[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tolerancia (minutos)</Label>
                  <Input type="number" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} required />
                </div>
                <Button type="submit" className="w-full gap-2 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Crear Horario
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg">Horarios Registrados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="px-6">Jornada</TableHead>
                      <TableHead>Horario / Días</TableHead>
                      <TableHead>Tolerancia</TableHead>
                      <TableHead className="text-right px-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts?.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="px-6">
                          <p className="font-bold text-slate-800">{shift.name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary">
                              <Clock className="h-3.5 w-3.5" />
                              {shift.startTime} - {shift.endTime}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {DAYS_OF_WEEK.map(d => (
                                <span 
                                  key={d.value} 
                                  className={`text-[9px] px-1.5 rounded-sm font-black ${
                                    shift.days?.includes(d.value) 
                                      ? 'bg-primary/10 text-primary' 
                                      : 'bg-slate-50 text-slate-300'
                                  }`}
                                >
                                  {d.label[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {shift.tolerance} min
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteShift(shift.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {shifts?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No hay jornadas configuradas.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
