
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, ArrowLeft, Loader2, Clock, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, updateDoc, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditTeacherPage() {
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch current user profile for Navbar
  const adminProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: adminProfile } = useDoc(adminProfileRef);

  // Fetch target teacher profile
  const teacherRef = useMemoFirebase(() => 
    teacherId ? doc(firestore, 'userProfiles', teacherId) : null,
  [firestore, teacherId]);
  const { data: teacher, isLoading: isLoadingTeacher } = useDoc(teacherRef);

  // Fetch all shifts
  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection(shiftsQuery);

  useEffect(() => {
    if (teacher && !hasInitialized) {
      setFirstName(teacher.firstName || "");
      setLastName(teacher.lastName || "");
      setEmail(teacher.email || "");
      setSelectedShiftIds(teacher.shiftIds || []);
      setHasInitialized(true);
    }
  }, [teacher, hasInitialized]);

  const toggleShift = (shiftId: string) => {
    setSelectedShiftIds(prev => 
      prev.includes(shiftId) 
        ? prev.filter(id => id !== shiftId) 
        : [...prev, shiftId]
    );
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShiftIds.length === 0) {
      toast({ variant: "destructive", title: "Atención", description: "Debe asignar al menos una jornada." });
      return;
    }

    setLoading(true);
    const teacherDocRef = doc(firestore, 'userProfiles', teacherId);
    
    const updateData = {
      firstName,
      lastName,
      email,
      shiftIds: selectedShiftIds,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(teacherDocRef, updateData);
      toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente." });
      router.push("/dashboard/admin/teachers");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (isLoadingTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={adminProfile ? { 
        id: adminProfile.id, 
        name: `${adminProfile.firstName} ${adminProfile.lastName}`, 
        role: adminProfile.role,
        email: adminProfile.email
      } : null} onLogout={handleLogout} />
      
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/teachers">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Editar Perfil de Docente</h1>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <form onSubmit={handleUpdateTeacher}>
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Información del Docente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
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
              
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-700">Asignar Jornadas (Horarios)</Label>
                {isLoadingShifts ? (
                  <div className="flex items-center gap-2 text-muted-foreground italic text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" /> Cargando jornadas...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {shifts?.map(shift => (
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
                            id={`shift-edit-${shift.id}`}
                            checked={selectedShiftIds.includes(shift.id)}
                            onCheckedChange={() => toggleShift(shift.id)}
                          />
                          <Label htmlFor={`shift-edit-${shift.id}`} className="cursor-pointer">
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
                    {shifts?.length === 0 && (
                      <p className="text-sm text-orange-500 bg-orange-50 p-4 rounded-xl border border-orange-100">
                        No hay jornadas configuradas.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 p-6 flex justify-end">
              <Button type="submit" className="gap-2 font-bold px-8 shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
