
"use client";

import { useFirebase, useCollection } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft, Loader2, Clock, Hash, BookOpen, DoorOpen, MapPin } from "lucide-react";
import { useState } from "react";
import { collection, setDoc, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddTeacherPage() {
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [assignedRoom, setAssignedRoom] = useState("");
  const [campus, setCampus] = useState("");
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection(shiftsQuery);

  const toggleShift = (shiftId: string) => {
    setSelectedShiftIds(prev => 
      prev.includes(shiftId) 
        ? prev.filter(id => id !== shiftId) 
        : [...prev, shiftId]
    );
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) {
      toast({ variant: "destructive", title: "Cédula requerida" });
      return;
    }
    if (selectedShiftIds.length === 0) {
      toast({ variant: "destructive", title: "Atención", description: "Debe asignar al menos una jornada." });
      return;
    }

    setLoading(true);
    const tempId = `teacher_${Date.now()}`;
    const teacherRef = doc(firestore, 'userProfiles', tempId);
    
    const profileData = {
      id: tempId,
      email,
      firstName,
      lastName,
      cedula,
      specialty,
      assignedRoom,
      campus,
      role: 'teacher',
      shiftIds: selectedShiftIds,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(teacherRef, profileData);
      toast({ title: "Docente registrado", description: "El perfil y carnet han sido generados." });
      router.push("/dashboard/admin/teachers");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar al docente." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={user ? { id: user.uid, name: user.displayName || 'Admin', role: 'admin', email: user.email || '' } : null} onLogout={handleLogout} />
      
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/teachers">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Registrar Nuevo Docente</h1>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white">
          <form onSubmit={handleCreateTeacher}>
            <CardHeader className="border-b border-slate-50 p-8">
              <CardTitle className="text-lg font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Información Institucional
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nombre(s)</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Nombre" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Apellido(s)</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Apellido" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Cédula
                  </Label>
                  <Input value={cedula} onChange={(e) => setCedula(e.target.value)} required placeholder="Doc. Identidad" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Especialidad
                  </Label>
                  <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Ciencias" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <DoorOpen className="h-3 w-3" /> Salón / Aula
                  </Label>
                  <Input value={assignedRoom} onChange={(e) => setAssignedRoom(e.target.value)} placeholder="Salón asignado" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Sede
                  </Label>
                  <Select onValueChange={setCampus}>
                    <SelectTrigger className="h-11 bg-slate-50 border-none shadow-inner">
                      <SelectValue placeholder="Seleccione Sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Principal">Sede Principal</SelectItem>
                      <SelectItem value="Norte">Sede Norte</SelectItem>
                      <SelectItem value="Sur">Sede Sur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Correo Electrónico</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@institucion.com" className="h-11 bg-slate-50 border-none shadow-inner" />
              </div>
              
              <div className="space-y-4 pt-4">
                <Label className="text-sm font-black text-slate-700 uppercase tracking-tight">Asignar Jornadas</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {shifts?.map(shift => (
                    <div 
                      key={shift.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        selectedShiftIds.includes(shift.id) 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`shift-${shift.id}`}
                          checked={selectedShiftIds.includes(shift.id)}
                          onCheckedChange={() => toggleShift(shift.id)}
                        />
                        <Label htmlFor={`shift-${shift.id}`} className="cursor-pointer">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{shift.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-primary font-black uppercase">
                            <Clock className="h-2.5 w-2.5" />
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 p-8 flex justify-end">
              <Button type="submit" className="h-14 px-10 gap-2 font-black uppercase tracking-widest shadow-xl" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                Registrar y Generar Carnet
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
