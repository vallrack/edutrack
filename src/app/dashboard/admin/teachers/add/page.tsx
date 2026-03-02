
"use client";

import { useFirebase, useCollection } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { collection, setDoc, doc, serverTimestamp } from "firebase/firestore";
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
  const [shiftId, setShiftId] = useState("");
  const [loading, setLoading] = useState(false);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts } = useCollection(shiftsQuery);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Generar un ID temporal para el perfil. 
    // Nota: En producción, el docente debería registrarse vía Auth y el admin solo crear el perfil previo.
    const tempId = `teacher_${Date.now()}`;
    const teacherRef = doc(firestore, 'userProfiles', tempId);
    
    const profileData = {
      id: tempId,
      email,
      firstName,
      lastName,
      role: 'teacher',
      shiftId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(teacherRef, profileData);
      toast({ title: "Docente registrado", description: "El perfil ha sido creado correctamente." });
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
      
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/teachers">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Registrar Nuevo Docente</h1>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <form onSubmit={handleCreateTeacher}>
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg">Información del Docente</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre(s)</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Apellido(s)</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Correo Institucional</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Asignar Jornada (Horario)</Label>
                <Select value={shiftId} onValueChange={setShiftId} required>
                  <SelectTrigger className="bg-slate-50 border-none shadow-inner">
                    <SelectValue placeholder="Seleccione una jornada" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts?.map(shift => (
                      <SelectItem key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 p-6 flex justify-end">
              <Button type="submit" className="gap-2 font-bold px-8 shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Registrar Docente
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
