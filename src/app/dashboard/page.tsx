
"use client";

import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceStats } from "@/components/dashboard/AttendanceStats";
import { QRMarker } from "@/components/attendance/QRMarker";
import { TeacherCardQR } from "@/components/attendance/TeacherCardQR";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import { Loader2, Sparkles, Clock, Calendar, Smartphone, Users, FileBarChart, History, CheckCircle2, LogIn, LogOut } from "lucide-react";
import { collection, doc, serverTimestamp, query, orderBy, limit, setDoc, getDocs, where, writeBatch } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const isRecordForToday = (record: any) => {
    if (!record?.date) return false;
    const today = new Date();
    const recordDate = record.date.toDate ? record.date.toDate() : parseISO(record.date);
    return today.getFullYear() === recordDate.getFullYear() &&
           today.getMonth() === recordDate.getMonth() &&
           today.getDate() === recordDate.getDate();
};

export default function DashboardPage() {
  const { user, isUserLoading, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'userProfiles', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const isAdmin = useMemo(() => profile?.role === 'admin' || profile?.role?.toLowerCase() === 'coordinator', [profile]);

  const shiftsQuery = useMemoFirebase(() => profile ? collection(firestore, 'shifts') : null, [firestore, profile]);
  const { data: shifts, isLoading: areShiftsLoading } = useCollection(shiftsQuery);

  const teachersQuery = useMemoFirebase(() => 
    profile && isAdmin ? query(collection(firestore, 'userProfiles'), where('role', '==', 'teacher')) : null,
  [firestore, profile, isAdmin]);
  const { data: teachers, isLoading: areTeachersLoading } = useCollection(teachersQuery);

  const personalAttendanceQuery = useMemoFirebase(() =>
    profile && user && !isAdmin ? query(collection(firestore, 'userProfiles', user.uid, 'attendanceRecords'), orderBy('updatedAt', 'desc'), limit(5)) : null,
  [firestore, user, profile, isAdmin]);
  const { data: personalAttendance, isLoading: isPersonalLoading } = useCollection(personalAttendanceQuery);
  
  const globalRecordsQuery = useMemoFirebase(() =>
    profile && isAdmin ? query(collection(firestore, 'globalAttendanceRecords'), orderBy('updatedAt', 'desc'), limit(50)) : null,
  [firestore, profile, isAdmin]);
  const { data: globalRecords, isLoading: isGlobalLoading } = useCollection(globalRecordsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const writeToCollections = async (recordData: any, existingDocId: string | null) => {
    if (!user || !profile) return;
    const batch = writeBatch(firestore);
    
    const userRecordRef = existingDocId 
      ? doc(firestore, 'userProfiles', user.uid, 'attendanceRecords', existingDocId) 
      : doc(collection(firestore, 'userProfiles', user.uid, 'attendanceRecords'));

    const globalRecordRef = existingDocId 
      ? doc(firestore, 'globalAttendanceRecords', existingDocId)
      : doc(firestore, 'globalAttendanceRecords', userRecordRef.id);

    const dataToSet = { 
      ...recordData, 
      userId: user.uid,
      teacherName: `${profile.firstName} ${profile.lastName}`,
      teacherEmail: profile.email,
      updatedAt: serverTimestamp() 
    };
    
    if (existingDocId) {
      batch.update(userRecordRef, dataToSet);
      batch.update(globalRecordRef, dataToSet);
    } else {
      const creationData = { ...dataToSet, createdAt: serverTimestamp() };
      batch.set(userRecordRef, creationData);
      batch.set(globalRecordRef, creationData);
    }
    await batch.commit();
  };

  const createTestData = async () => {
    if (!isAdmin) return;
    setIsActionLoading('test-data');
    try {
        const globalRecordRef = doc(collection(firestore, 'globalAttendanceRecords'));
        const testData = {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            date: format(new Date(), 'yyyy-MM-dd'),
            entryDateTime: new Date().toISOString(),
            exitDateTime: null,
            shiftId: shifts && shifts.length > 0 ? shifts[0].id : 'jornada_prueba',
            teacherName: 'Profesor de Prueba',
            teacherEmail: 'test@profesor.com',
            userId: 'usuario_prueba',
            isManualOverride: false,
        };
        await setDoc(globalRecordRef, testData);
        toast({ title: "Dato de Prueba Creado", description: "El registro de prueba debería aparecer en la tabla." });
    } catch (error) {
        console.error("ERROR creating test data:", error);
        const firestoreError = error as any;
        toast({ variant: "destructive", title: "Error al crear dato", description: firestoreError.message });
    } finally {
        setIsActionLoading(null);
    }
  };

  const handleMarkAttendance = async (shiftId: string, type: 'entry' | 'exit') => {
    if (!user) return;
    setIsActionLoading(`${shiftId}-${type}`);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayQuery = query(collection(firestore, 'userProfiles', user.uid, 'attendanceRecords'), where('date', '==', todayStr), where('shiftId', '==', shiftId), limit(1));

    try {
      const querySnapshot = await getDocs(todayQuery);
      const existingRecord = querySnapshot.docs[0];
      const attendanceData: any = { shiftId, date: todayStr };

      if (type === 'entry') {
        attendanceData.entryDateTime = new Date().toISOString();
        attendanceData.entryMethod = 'manual';
      } else {
        attendanceData.exitDateTime = new Date().toISOString();
        attendanceData.exitMethod = 'manual';
      }

      await writeToCollections(attendanceData, existingRecord?.id || null);
      toast({ title: "Registro Exitoso", description: `Se ha marcado tu ${type === 'entry' ? 'entrada' : 'salida'} correctamente.` });
    } catch (error) {
      console.error("ERROR writing attendance mark:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la asistencia." });
    } finally {
      setIsActionLoading(null);
    }
  };

   const handleFullShiftMark = async (shiftId: string) => {
    if (!user) return;
    setIsActionLoading(shiftId);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayQuery = query(collection(firestore, 'userProfiles', user.uid, 'attendanceRecords'), where('date', '==', todayStr), where('shiftId', '==', shiftId), limit(1));

    try {
        const querySnapshot = await getDocs(todayQuery);
        const existingRecord = querySnapshot.docs[0];
        const attendanceData = {
            shiftId,
            date: todayStr,
            entryDateTime: new Date().toISOString(),
            exitDateTime: new Date().toISOString(),
            entryMethod: 'override',
            exitMethod: 'override',
            isManualOverride: true,
        };
        await writeToCollections(attendanceData, existingRecord?.id || null);
        toast({ title: "Jornada Completa", description: "Se ha registrado el cumplimiento total de la jornada." });
    } catch (error) {
        console.error("ERROR writing full shift mark:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la jornada completa." });
    } finally {
        setIsActionLoading(null);
    }
  };

  const renderStatusBadge = (record: any) => {
    if (record.isManualOverride) return <Badge className="bg-sky-100 text-sky-800">COMPLETO</Badge>;
    if (record.exitDateTime) return <Badge className="bg-green-100 text-green-800">CUMPLIDO</Badge>;
    if (record.entryDateTime) return <Badge className="bg-amber-100 text-amber-800">EN PROCESO</Badge>;
    return <Badge variant="secondary">PENDIENTE</Badge>;
  };

  const currentDayOfWeek = new Date().getDay();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const adminStats = [
    { label: "Docentes", value: areTeachersLoading? '...' : teachers?.length, icon: Users, href: "/dashboard/admin/teachers" },
    { label: "Asistencias Hoy", value: isGlobalLoading? '...' : (globalRecords || []).filter(r => r.date === todayStr).length, icon: Clock, href: "/dashboard/admin/reports" },
    { label: "Jornadas", value: areShiftsLoading? '...' : shifts?.length, icon: Calendar, href: "/dashboard/admin/shifts" },
    { label: "Reportes", value: "PDF/XLS", icon: FileBarChart, href: "/dashboard/admin/reports" },
  ];

  if (isUserLoading || !user || !profile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={{ id: user.uid, name: `${profile.firstName} ${profile.lastName}`, role: profile.role, email: profile.email }} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {isAdmin ? (
          <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {adminStats.map((stat) => (
                 <Card key={stat.label} className="shadow-lg border-none rounded-2xl hover:bg-slate-50 transition-colors">
                   <Link href={stat.href} className="block p-4">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div><div className="text-2xl font-bold">{stat.value}</div></div>
                   </Link>
                </Card>
              ))}
            </div>
            <Card className="border-none shadow-xl bg-white rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5"/> Movimientos Globales Recientes</CardTitle>
                        <CardDescription>Últimos registros de entrada y salida de todo el personal.</CardDescription>
                    </div>
                    <Button size="sm" onClick={createTestData} disabled={isActionLoading === 'test-data'}>
                        {isActionLoading === 'test-data' ? <Loader2 className="h-4 w-4 animate-spin"/> : "Crear Dato de Prueba"}
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader><TableRow><TableHead>DOCENTE</TableHead><TableHead>JORNADA</TableHead><TableHead>MARCAJE</TableHead><TableHead className="text-right">ESTADO</TableHead></TableRow></TableHeader>
                    <TableBody>
                       {isGlobalLoading ? (
                           <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300"/></TableCell></TableRow>
                       ) : (globalRecords || []).length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No hay movimientos recientes.</TableCell></TableRow>
                       ) : (globalRecords || []).map(record => {
                           const shift = shifts?.find(s => s.id === record.shiftId);
                           return (
                               <TableRow key={record.id}>
                                   <TableCell className="font-medium">
                                        <div className="font-bold text-sm">{record.teacherName || 'Desconocido'}</div>
                                        <div className="text-xs text-muted-foreground">{record.teacherEmail}</div>
                                   </TableCell>
                                   <TableCell>
                                        <div>{shift?.name || "Jornada no especificada"}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{record.date ? format(parseISO(record.date), 'dd/MM/yyyy') : ''}</div>
                                   </TableCell>
                                   <TableCell className="font-mono text-sm">
                                       {record.entryDateTime && <div>E: {format(parseISO(record.entryDateTime), 'HH:mm:ss')}</div>}
                                       {record.exitDateTime && <div>S: {format(parseISO(record.exitDateTime), 'HH:mm:ss')}</div>}
                                   </TableCell>
                                   <TableCell className="text-right">{renderStatusBadge(record)}</TableCell>
                               </TableRow>
                           );
                       })}
                    </TableBody>
                 </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          // TEACHER VIEW
          <>
            <AttendanceStats records={personalAttendance || []} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              <div className="lg:col-span-4 space-y-6">
                  <Tabs defaultValue="marking" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm h-12 rounded-xl">
                        <TabsTrigger value="marking" className="font-bold rounded-lg flex gap-2 text-xs md:text-sm"><Clock className="h-4 w-4" /> Marcaje</TabsTrigger>
                        <TabsTrigger value="id" className="font-bold rounded-lg flex gap-2 text-xs md:text-sm"><Smartphone className="h-4 w-4" /> Carnet</TabsTrigger>
                    </TabsList>
                    <TabsContent value="marking" className="space-y-6 mt-6">
                        {(profile?.shiftIds || []).map((sid: string) => {
                            const shift = shifts?.find(s => s.id === sid);
                            if (!shift || !shift.days?.includes(currentDayOfWeek)) return null;
                            const record = personalAttendance?.find(r => r.shiftId === shift.id && isRecordForToday(r));
                            const hasCompleted = record?.entryDateTime && record?.exitDateTime;
                            const hasStarted = record?.entryDateTime && !record?.exitDateTime;
                            const nextAction = hasStarted ? 'exit' : 'entry';
                            return (
                            <Card key={shift.id} className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
                                <CardHeader className="bg-slate-50/50 pb-4"><CardTitle className="text-sm font-bold flex justify-between items-center"><span>{shift.name}</span><span className="font-mono text-xs text-slate-500">{shift.startTime} - {shift.endTime}</span></CardTitle></CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    {hasCompleted ? (
                                        <div className="flex flex-col items-center justify-center text-center p-4 bg-green-50 rounded-xl border border-green-200"><CheckCircle2 className="h-8 w-8 text-green-500 mb-2" /><p className="font-bold text-sm text-green-800">Jornada Cumplida</p></div>
                                    ) : (
                                        <Button onClick={() => handleMarkAttendance(shift.id, nextAction)} disabled={!!isActionLoading} className={`w-full h-14 font-black rounded-xl flex items-center gap-3 text-base shadow-lg transition-all duration-300 ${hasStarted ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 'bg-gradient-to-br from-green-400 to-green-600 text-white'}`}>
                                            {isActionLoading === `${shift.id}-${nextAction}` ? <Loader2 className="h-6 w-6 animate-spin"/> : (hasStarted ? <LogOut className="h-6 w-6"/> : <LogIn className="h-6 w-6"/>)}
                                            {hasStarted ? 'Marcar Salida' : 'Marcar Entrada'}
                                        </Button>
                                    )}
                                    <Button onClick={() => handleFullShiftMark(shift.id)} disabled={!!isActionLoading || hasCompleted} variant="outline" className="w-full h-10 bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 flex items-center justify-center gap-2 font-bold rounded-xl text-[10px]"><Sparkles className="h-3 w-3" /><span>CUMPLIMIENTO TOTAL</span></Button>
                                </CardContent>
                            </Card>
                            );
                        })}
                        <QRMarker onMark={() => {}} />
                    </TabsContent>
                    <TabsContent value="id" className="mt-6"><TeacherCardQR teacher={profile} shifts={shifts || []} /></TabsContent>
                  </Tabs>
              </div>
              <div className="lg:col-span-8">
                <Card className="border-none shadow-xl bg-white rounded-2xl">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5"/> Historial de Movimientos</CardTitle>
                                <CardDescription>Tus últimos registros de asistencia.</CardDescription>
                            </div>
                             <Link href="/dashboard/my-records"><Button variant="outline" size="sm">Ver Todos</Button></Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[180px]">FECHA / JORNADA</TableHead><TableHead>MARCAJES</TableHead><TableHead>MÉTODO</TableHead><TableHead className="text-right">ESTADO</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isPersonalLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300"/></TableCell></TableRow>
                                ) : (personalAttendance || []).map(record => {
                                    const shift = shifts?.find(s => s.id === record.shiftId);
                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                <div className="capitalize font-bold text-sm">{record.date ? format(parseISO(record.date), 'EEEE dd/MM', { locale: es }) : ''}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{shift?.name || 'Jornada no especificada'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm"><b>E:</b><span className="font-mono">{record.entryDateTime ? format(parseISO(record.entryDateTime), 'HH:mm') : '--:--'}</span></div>
                                                <div className="flex items-center gap-2 text-sm"><b>S:</b><span className="font-mono">{record.exitDateTime ? format(parseISO(record.exitDateTime), 'HH:mm') : '--:--'}</span></div>
                                            </TableCell>
                                            <TableCell className="text-xs uppercase">
                                                <Badge variant="outline" className="font-mono text-[9px]">{record.entryMethod || 'N/A'}</Badge>
                                                {record.exitMethod && <Badge variant="outline" className="font-mono text-[9px] mt-1">{record.exitMethod}</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">{renderStatusBadge(record)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
