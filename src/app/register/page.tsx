
"use client";

import { useState } from "react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, ArrowLeft, Loader2, UserPlus, Clock, Hash, BookOpen, DoorOpen, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function RegisterPage() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) {
      toast({ variant: "destructive", title: "Cédula requerida" });
      return;
    }
    if (selectedShiftIds.length === 0) {
      toast({ variant: "destructive", title: "Horario requerido", description: "Seleccione al menos una jornada." });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const profileRef = doc(firestore, "userProfiles", uid);
      const profileData = {
        id: uid,
        firebaseAuthUid: uid,
        email,
        firstName,
        lastName,
        cedula,
        specialty,
        assignedRoom,
        campus,
        role: "teacher",
        shiftIds: selectedShiftIds,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(profileRef, profileData);

      toast({ 
        title: "Registro Exitoso", 
        description: "Su cuenta ha sido creada. ¡Bienvenido!" 
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error de registro", 
        description: error.message || "No se pudo crear la cuenta." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 py-12">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-primary rounded-2xl mb-4 shadow-xl shadow-primary/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Registro Institucional</h1>
          <p className="text-muted-foreground text-sm font-medium">Complete su perfil para generar su carnet digital</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
          <form onSubmit={handleRegister}>
            <CardHeader className="bg-white border-b border-slate-50 p-8">
              <CardTitle className="text-lg font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Datos del Docente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nombre(s)</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Ej: María" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Apellido(s)</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Ej: García" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Cédula / ID
                  </Label>
                  <Input value={cedula} onChange={(e) => setCedula(e.target.value)} required placeholder="Documento identidad" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Especialidad
                  </Label>
                  <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Matemáticas" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <DoorOpen className="h-3 w-3" /> Salón Asignado
                  </Label>
                  <Input value={assignedRoom} onChange={(e) => setAssignedRoom(e.target.value)} placeholder="Ej: Aula 102" className="h-11 bg-slate-50 border-none shadow-inner" />
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Correo Institucional</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="docente@institucion.com" className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Contraseña</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 bg-slate-50 border-none shadow-inner" />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-sm font-black text-slate-700 uppercase tracking-tight">Asignación de Jornadas</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                  {isLoadingShifts ? (
                    <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios...
                    </div>
                  ) : shifts?.map(shift => (
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
                          id={`reg-shift-${shift.id}`}
                          checked={selectedShiftIds.includes(shift.id)}
                          onCheckedChange={() => toggleShift(shift.id)}
                        />
                        <Label htmlFor={`reg-shift-${shift.id}`} className="cursor-pointer">
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
            <CardFooter className="bg-slate-50 p-8 flex flex-col gap-6">
              <Button type="submit" className="w-full h-14 gap-2 font-black uppercase tracking-widest shadow-xl" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                Completar Registro
              </Button>
              <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Volver al Inicio
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
