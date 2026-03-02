
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
import { GraduationCap, ArrowLeft, Loader2, UserPlus, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function RegisterPage() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    if (selectedShiftIds.length === 0) {
      toast({ variant: "destructive", title: "Horario requerido", description: "Seleccione al menos una jornada de trabajo." });
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Create Profile in Firestore
      const profileRef = doc(firestore, "userProfiles", uid);
      const profileData = {
        id: uid,
        firebaseAuthUid: uid,
        email,
        firstName,
        lastName,
        role: "teacher",
        shiftIds: selectedShiftIds,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(profileRef, profileData);

      toast({ 
        title: "Registro Exitoso", 
        description: "Su cuenta de docente ha sido creada. ¡Bienvenido!" 
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-primary rounded-xl mb-4 shadow-lg shadow-primary/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Registro de Docente</h1>
          <p className="text-muted-foreground text-sm">Crea tu perfil y selecciona tus jornadas laborales</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <form onSubmit={handleRegister}>
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg">Datos Personales</CardTitle>
              <CardDescription>Información básica para el control de asistencia</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre(s)</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Ej: Maria" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido(s)</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Ej: García" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Institucional</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="docente@institucion.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-sm font-bold text-slate-700">Asignación de Jornadas</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {isLoadingShifts ? (
                    <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios disponibles...
                    </div>
                  ) : shifts?.map(shift => (
                    <div 
                      key={shift.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
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
                          <p className="text-sm font-bold text-slate-800">{shift.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                            <Clock className="h-2.5 w-2.5" />
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </Label>
                      </div>
                      <div className="text-[10px] bg-white px-2 py-1 rounded-md border text-muted-foreground font-bold">
                        {shift.tolerance}m Tol.
                      </div>
                    </div>
                  ))}
                  {(!shifts || shifts.length === 0) && !isLoadingShifts && (
                    <p className="text-xs text-orange-500 bg-orange-50 p-4 rounded-xl text-center">
                      No hay jornadas configuradas por la institución.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 p-6 flex flex-col gap-4">
              <Button type="submit" className="w-full h-12 gap-2 font-bold shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Crear mi Cuenta de Docente
              </Button>
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Ya tengo cuenta, ir al login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
