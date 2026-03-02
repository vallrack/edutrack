
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, History, UserPlus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, addDoc, serverTimestamp, doc, deleteDoc, getDocs, limit, setDoc } from "firebase/firestore";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      toast({ title: "Docente eliminado" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleManualShiftMark = async (teacher: any, shiftId: string) => {
    const shift = shifts?.find(s => s.id === shiftId);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    if (!shift) return;

    const recordsRef = collection(firestore, 'userProfiles', teacher.id, 'attendanceRecords');
    const todayQuery = query(recordsRef, where('date', '==', todayStr), where('shiftId', '==', shiftId), limit(1));
    const querySnapshot = await getDocs(todayQuery);

    const entryDateTime = `${todayStr}T${shift.startTime}:00`;
    const exitDateTime = `${todayStr}T${shift.endTime}:00`;

    const attendanceData = {
      userId: teacher.id,
      shiftId: shiftId,
      date: todayStr,
      entryDateTime,
      exitDateTime,
      entryMethod: 'manual',
      exitMethod: 'manual',
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
        title: "Jornada Registrada",
        description: `Se registró ${shift.name} para ${teacher.firstName}.`
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
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
            <p className="text-muted-foreground">Gestión de personal y validación de jornadas.</p>
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
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px]">Nombre</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px]">Jornadas Asignadas</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] text-center">Acción de Marcaje</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] text-right">Gestión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-slate-50/50 border-slate-50">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold uppercase">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{teacher.firstName} {teacher.lastName}</span>
                            <span className="text-[10px] text-muted-foreground">{teacher.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {teacher.shiftIds?.map((sid: string) => {
                            const s = shifts?.find(x => x.id === sid);
                            return s ? (
                              <Badge key={sid} variant="secondary" className="text-[8px] bg-slate-100">
                                {s.name} ({s.startTime})
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary font-bold">
                              <CheckCircle2 className="h-4 w-4" /> Marcar Jornada
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">Selecciona Jornada</p>
                            {teacher.shiftIds?.map((sid: string) => {
                              const s = shifts?.find(x => x.id === sid);
                              return s ? (
                                <Button 
                                  key={sid} 
                                  variant="ghost" 
                                  className="w-full justify-start h-9 text-xs"
                                  onClick={() => handleManualShiftMark(teacher, sid)}
                                >
                                  {s.name}
                                </Button>
                              ) : null;
                            })}
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/records?userId=${teacher.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><History className="h-4 w-4" /></Button>
                          </Link>
                          <Link href={`/dashboard/admin/teachers/edit/${teacher.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar docente?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.id)}>Confirmar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
