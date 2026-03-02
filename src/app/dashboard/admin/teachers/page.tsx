
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Search, Loader2, History, UserPlus, Clock, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, addDoc, serverTimestamp, doc, deleteDoc, getDocs, limit, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoFirebase } from "@/firebase/provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TeachersAdminPage() {
  const { user, firestore, auth } = useFirebase();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const teachersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'userProfiles'), where('role', '==', 'teacher')),
  [firestore]);
  const { data: teachers, isLoading } = useCollection(teachersQuery);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts } = useCollection(shiftsQuery);

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers.filter(t => 
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [teachers, search]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'userProfiles', id));
      toast({
        title: "Docente eliminado",
        description: "El perfil ha sido removido del sistema."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar al docente."
      });
    }
  };

  const handleManualFullDayMark = async (teacher: any) => {
    const firstShiftId = teacher.shiftIds?.[0];
    const shift = shifts?.find(s => s.id === firstShiftId);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    if (!shift) {
      toast({ variant: "destructive", title: "Sin Jornada", description: "El docente no tiene jornadas asignadas." });
      return;
    }

    const recordsRef = collection(firestore, 'userProfiles', teacher.id, 'attendanceRecords');
    const todayQuery = query(recordsRef, where('date', '==', todayStr), limit(1));
    const querySnapshot = await getDocs(todayQuery);

    const entryDateTime = `${todayStr}T${shift.startTime}:00`;
    const exitDateTime = `${todayStr}T${shift.endTime}:00`;

    const attendanceData = {
      userId: teacher.id,
      date: todayStr,
      entryDateTime,
      exitDateTime,
      entryMethod: 'manual',
      exitMethod: 'manual',
      entryLocationLatitude: 0,
      entryLocationLongitude: 0,
      markedByCoordinatorId: user?.uid,
      isManualOverride: true,
      updatedAt: serverTimestamp()
    };

    try {
      if (!querySnapshot.empty) {
        await setDoc(doc(recordsRef, querySnapshot.docs[0].id), attendanceData, { merge: true });
      } else {
        await addDoc(recordsRef, { ...attendanceData, createdAt: serverTimestamp() });
      }
      toast({
        title: "Jornada Completa Registrada",
        description: `Se registró el horario de ${shift.startTime} a ${shift.endTime} para ${teacher.firstName}.`
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la jornada." });
    }
  };

  const getShiftNames = (shiftIds?: string[]) => {
    if (!shiftIds || !shifts || shiftIds.length === 0) return "Sin jornadas";
    return shiftIds
      .map(id => shifts.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={profile ? { 
        id: profile.id, 
        name: `${profile.firstName} ${profile.lastName}`, 
        role: profile.role,
        email: profile.email
      } : null} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio de Docentes</h1>
            <p className="text-muted-foreground">Supervisión y registro de personal docente.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                  placeholder="Buscar docente..." 
                  className="pl-9 bg-white border-none shadow-sm h-11 w-full rounded-md text-sm outline-none px-4"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/dashboard/admin/teachers/add">
              <Button className="h-11 gap-2 font-bold shadow-lg">
                <UserPlus className="h-4 w-4" />
                Nuevo Docente
              </Button>
            </Link>
          </div>
        </header>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-xl font-bold">Listado de Personal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Nombre</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Jornadas</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Marcar Jornada</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{teacher.firstName} {teacher.lastName}</span>
                            <span className="text-[10px] text-muted-foreground">{teacher.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <Clock className="h-3 w-3 text-primary" />
                          <span className="max-w-[200px] truncate">{getShiftNames(teacher.shiftIds)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleManualFullDayMark(teacher)}
                          className="h-8 gap-2 text-primary hover:bg-primary/5 font-bold"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Día Completo
                        </Button>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/records?userId=${teacher.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-primary hover:bg-primary/5" title="Ver Historial">
                              <History className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/admin/teachers/edit/${teacher.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-primary hover:bg-primary/5" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-destructive hover:bg-destructive/5" title="Eliminar">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará el perfil de {teacher.firstName} {teacher.lastName} permanentemente. 
                                  No se eliminarán sus registros de asistencia pasados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.id)} className="bg-destructive hover:bg-destructive/90">
                                  Eliminar Docente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-24 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                           <GraduationCap className="h-12 w-12 opacity-10" />
                           <p>No se encontraron docentes registrados.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
