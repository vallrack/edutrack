
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, History, UserPlus, Pencil, Trash2, CheckCircle2, QrCode, User } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { TeacherCardQR } from "@/components/attendance/TeacherCardQR";

const DAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];

export default function TeachersAdminPage() {
  const { user, firestore, auth } = useFirebase();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const teachersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'userProfiles'), where('role', '==', 'teacher'));
  }, [firestore, user]);
  const { data: teachers, isLoading } = useCollection(teachersQuery);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts } = useCollection(shiftsQuery);

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers.filter(t => 
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.cedula?.includes(search)
    );
  }, [teachers, search]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'userProfiles', id));
      toast({ title: "Docente eliminado", description: "El perfil ha sido removido del sistema." });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error al eliminar", 
        description: "No tienes permisos suficientes." 
      });
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
        description: `Se registró jornada completa para ${teacher.firstName}.`
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Directorio de Docentes</h1>
            <p className="text-sm text-muted-foreground font-medium">Gestión de personal, carnets y validación de jornadas.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                  placeholder="Buscar docente..." 
                  className="pl-9 bg-white border-none shadow-sm h-11 w-full rounded-xl text-sm outline-none px-4"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/dashboard/admin/teachers/add" className="w-full sm:w-auto">
              <Button className="h-11 w-full sm:w-auto gap-2 font-bold shadow-lg rounded-xl">
                <UserPlus className="h-4 w-4" />
                Nuevo Docente
              </Button>
            </Link>
          </div>
        </header>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="py-5 px-6 md:px-8 font-black text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest">Información Docente</TableHead>
                      <TableHead className="py-5 px-6 md:px-8 font-black text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest">Jornadas</TableHead>
                      <TableHead className="py-5 px-6 md:px-8 font-black text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest text-center">Validación</TableHead>
                      <TableHead className="py-5 px-6 md:px-8 font-black text-slate-400 uppercase text-[9px] md:text-[10px] tracking-widest text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} className="hover:bg-slate-50/50 border-slate-50">
                        <TableCell className="py-4 md:py-5 px-6 md:px-8">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xs md:text-sm font-black uppercase">
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 uppercase tracking-tight text-xs md:text-sm truncate">
                                {teacher.firstName} {teacher.lastName}
                              </span>
                              <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">{teacher.email}</span>
                                <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase h-3 md:h-4 px-1 border-primary/20 text-primary">
                                  ID: {teacher.cedula || '---'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 md:py-5 px-6 md:px-8">
                          <div className="flex flex-col gap-1.5 md:gap-2">
                            {teacher.shiftIds?.map((sid: string) => {
                              const s = shifts?.find(x => x.id === sid);
                              return s ? (
                                <div key={sid} className="flex flex-col gap-0.5 border-l-2 border-primary/20 pl-2 md:pl-3">
                                  <span className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-tight">{s.name}</span>
                                  <div className="flex items-center gap-1.5 md:gap-2">
                                    <span className="text-[8px] md:text-[9px] text-primary font-black">{s.startTime}-{s.endTime}</span>
                                    <div className="flex gap-0.5">
                                      {DAY_INITIALS.map((init, i) => (
                                        <span key={i} className={`text-[7px] md:text-[8px] font-black ${s.days?.includes(i) ? 'text-primary' : 'text-slate-200'}`}>
                                          {init}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })}
                            {(!teacher.shiftIds || teacher.shiftIds.length === 0) && (
                              <span className="text-[9px] md:text-[10px] text-muted-foreground italic">Sin jornadas</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 md:py-5 px-6 md:px-8 text-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 md:h-9 gap-1 md:gap-2 text-primary font-black uppercase text-[8px] md:text-[10px] rounded-xl hover:bg-primary/5">
                                <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden xs:inline">Validar</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 md:w-64 p-3 rounded-2xl shadow-2xl border-none">
                              <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 mb-2">Seleccionar Jornada</p>
                              <div className="space-y-1">
                                {teacher.shiftIds?.map((sid: string) => {
                                  const s = shifts?.find(x => x.id === sid);
                                  return s ? (
                                    <Button 
                                      key={sid} 
                                      variant="ghost" 
                                      className="w-full justify-between h-10 md:h-12 px-3 text-[10px] md:text-[11px] rounded-xl hover:bg-slate-50"
                                      onClick={() => handleManualShiftMark(teacher, sid)}
                                    >
                                      <div className="text-left">
                                        <p className="font-black text-slate-700 uppercase">{s.name}</p>
                                        <p className="text-[8px] md:text-[9px] text-muted-foreground">{s.startTime} - {s.endTime}</p>
                                      </div>
                                      <CheckCircle2 className="h-4 w-4 text-green-500 opacity-40" />
                                    </Button>
                                  ) : null;
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="py-4 md:py-5 px-6 md:px-8 text-right">
                          <div className="flex items-center justify-end gap-0.5 md:gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-blue-500 hover:bg-blue-50 rounded-xl" title="Ver Carnet">
                                  <QrCode className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none p-0 overflow-hidden">
                                 <DialogHeader className="sr-only">
                                   <DialogTitle>Carnet de {teacher.firstName} {teacher.lastName}</DialogTitle>
                                   <DialogDescription>Información institucional del docente y código QR para validación.</DialogDescription>
                                 </DialogHeader>
                                 <TeacherCardQR teacher={teacher} shifts={shifts || []} />
                              </DialogContent>
                            </Dialog>
                            
                            <Link href={`/dashboard/records?userId=${teacher.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:bg-slate-50 rounded-xl" title="Historial">
                                <History className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </Button>
                            </Link>
                            
                            <Link href={`/dashboard/admin/teachers/edit/${teacher.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:bg-slate-50 rounded-xl" title="Editar">
                                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </Button>
                            </Link>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-destructive hover:bg-destructive/5 rounded-xl" title="Eliminar">
                                  <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl border-none">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-black uppercase tracking-tight">¿Eliminar docente?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción borrará permanentemente el perfil de {teacher.firstName} {teacher.lastName} y sus registros históricos.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTeachers.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 md:py-24">
                           <div className="flex flex-col items-center gap-2">
                             <User className="h-10 w-10 md:h-12 md:w-12 text-slate-100" />
                             <p className="text-[10px] md:text-sm font-bold text-slate-300 uppercase tracking-widest italic">Sin resultados</p>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
