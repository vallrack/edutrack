
"use client";

import { useFirebase, useCollection } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ShiftsPage() {
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [tolerance, setTolerance] = useState(15);
  const [loading, setLoading] = useState(false);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts, isLoading } = useCollection(shiftsQuery);

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(firestore, 'shifts'), {
        name,
        startTime,
        endTime,
        tolerance: Number(tolerance),
        createdAt: serverTimestamp()
      });
      toast({ title: "Jornada creada", description: "El horario se ha registrado correctamente." });
      setName("");
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
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Jornadas</h1>
          <p className="text-muted-foreground">Configure los horarios institucionales y turnos de trabajo.</p>
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
                <div className="space-y-2">
                  <Label>Tolerancia (minutos)</Label>
                  <Input type="number" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} required />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
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
                      <TableHead>Horario</TableHead>
                      <TableHead>Tolerancia</TableHead>
                      <TableHead className="text-right px-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts?.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="px-6 font-bold">{shift.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Clock className="h-3 w-3 text-primary" />
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </TableCell>
                        <TableCell>{shift.tolerance} min</TableCell>
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
