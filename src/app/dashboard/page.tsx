
"use client";

import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceStats } from "@/components/dashboard/AttendanceStats";
import { QRMarker } from "@/components/attendance/QRMarker";
import { TeacherCardQR } from "@/components/attendance/TeacherCardQR";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { QrCode, UserCog, Loader2, Sparkles, Clock, Calendar, Smartphone } from "lucide-react";
import { collection, doc, addDoc, serverTimestamp, query, orderBy, limit, setDoc, getDocs, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, isUserLoading, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const shiftsQuery = useMemoFirebase(() => collection(firestore, 'shifts'), [firestore]);
  const { data: shifts } = useCollection(shiftsQuery);

  const attendanceQuery = useMemoFirebase(() => 
    user ? query(
      collection(firestore, 'userProfiles', user.uid, 'attendanceRecords'),
      orderBy('date', 'desc'),
      limit(20)
    ) : null,
  [firestore, user]);
  const { data: attendance, isLoading: isAttendanceLoading } = useCollection(attendanceQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleFullShiftMark = async (shiftId: string) => {
    if (!user || !shifts) return;
    
    setIsActionLoading(shiftId);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const shift = shifts.find(s => s.id === shiftId);
    
    if (!shift) {
      toast({ variant: "destructive", title: "Error", description: "No se encontró la jornada seleccionada." });
      setIsActionLoading(null);
      return;
    }

    const recordsRef = collection(firestore, 'userProfiles', user.uid, 'attendanceRecords');
    const todayQuery = query(recordsRef, where('date', '==', todayStr), where('shiftId', '==', shiftId), limit(1));
    const querySnapshot = await getDocs(todayQuery);

    const entryDateTime = `${todayStr}T${shift.startTime}:00`;
    const exitDateTime = `${todayStr}T${shift.endTime}:00`;

    const attendanceData = {
      userId: user.uid,
      shiftId: shiftId,
      date: todayStr,
      entryDateTime,
      exitDateTime,
      entryMethod: 'manual',
      exitMethod: 'manual',
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
        title: "Jornada Completa", 
        description: `Se registró el horario (${shift.startTime} - ${shift.endTime}) para ${shift.name}.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo realizar el registro." });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleMarkAttendance = async (shiftId: string, type: 'entry' | 'exit', method: 'qr' | 'manual', location?: { latitude: number, longitude: number }) => {
    if (!user) return;
    
    setIsActionLoading(`${shiftId}-${type}`);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const recordsRef = collection(firestore, 'userProfiles', user.uid, 'attendanceRecords');
    
    const todayQuery = query(recordsRef, where('date', '==', todayStr), where('shiftId', '==', shiftId), limit(1));
    const querySnapshot = await getDocs(todayQuery);
    
    const attendanceData: any = {
      userId: user.uid,
      shiftId: shiftId,
      date: todayStr,
      updatedAt: serverTimestamp()
    };

    if (type === 'entry') {
      attendanceData.entryDateTime = new Date().toISOString();
      attendanceData.entryMethod = method;
      attendanceData.entryLocationLatitude = location?.latitude || 0;
      attendanceData.entryLocationLongitude = location?.longitude || 0;
    } else {
      attendanceData.exitDateTime = new Date().toISOString();
      attendanceData.exitMethod = method;
      attendanceData.exitLocationLatitude = location?.latitude || 0;
      attendanceData.exitLocationLongitude = location?.longitude || 0;
    }

    try {
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await setDoc(doc(recordsRef, docId), attendanceData, { merge: true });
      } else {
        if (type === 'entry') attendanceData.createdAt = serverTimestamp();
        await addDoc(recordsRef, attendanceData);
      }
      toast({ 
        title: "Registro Exitoso", 
        description: `Se ha marcado tu ${type === 'entry' ? 'entrada' : 'salida'} correctamente.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la asistencia." });
    } finally {
      setIsActionLoading(null);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecords = attendance?.filter(r => r.date === todayStr) || [];
  const currentDayOfWeek = new Date().getDay();

  const todayShifts = profile?.shiftIds?.map((sid: string) => shifts?.find(s => s.id === sid)).filter(s => s && s.days?.includes(currentDayOfWeek)) || [];

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
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Panel de <span className="text-primary">{profile?.role === 'teacher' ? 'Docente' : 'Control'}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Bienvenido, {profile?.firstName}. Hoy es {format(new Date(), 'eeee, dd MMMM')}</p>
          </div>
          <Badge variant="secondary" className="w-fit h-fit px-4 py-1 text-xs md:text-sm bg-white shadow-sm text-green-600 border-green-100 font-bold">
            {profile?.campus || 'Sede Central'}
          </Badge>
        </header>

        <AttendanceStats records={attendance || []} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Tabs defaultValue="marking" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm h-12 rounded-xl">
                <TabsTrigger value="marking" className="font-bold rounded-lg flex gap-2 text-xs md:text-sm">
                  <Clock className="h-4 w-4" /> Marcaje
                </TabsTrigger>
                <TabsTrigger value="id" className="font-bold rounded-lg flex gap-2 text-xs md:text-sm">
                  <Smartphone className="h-4 w-4" /> Carnet
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="marking" className="space-y-6 mt-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Jornadas Hoy</h2>
                {todayShifts.map((shift: any) => {
                  const record = todayRecords.find(r => r.shiftId === shift.id);
                  return (
                    <Card key={shift.id} className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
                      <CardHeader className="bg-slate-50/50 pb-4">
                        <CardTitle className="text-sm md:text-md flex items-center justify-between">
                          <div className="flex items-center gap-2 font-black">
                            <Clock className="h-4 w-4 text-primary" />
                            {shift.name}
                          </div>
                          <Badge variant="outline" className="text-[9px] md:text-[10px] font-bold">
                            {shift.startTime} - {shift.endTime}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <Button 
                          onClick={() => handleFullShiftMark(shift.id)}
                          disabled={!!isActionLoading || (!!record?.entryDateTime && !!record?.exitDateTime)}
                          className="w-full h-12 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border flex items-center justify-between px-4 font-black rounded-xl text-[10px] md:text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <span>CUMPLIMIENTO TOTAL</span>
                          </div>
                          {isActionLoading === shift.id && <Loader2 className="h-3 w-3 animate-spin" />}
                        </Button>

                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <Checkbox 
                            id={`entry-${shift.id}`} 
                            disabled={!!record?.entryDateTime || !!isActionLoading}
                            checked={!!record?.entryDateTime}
                            onCheckedChange={(checked) => checked && handleMarkAttendance(shift.id, 'entry', 'manual')}
                          />
                          <Label htmlFor={`entry-${shift.id}`} className="flex-1 cursor-pointer">
                            <p className="font-bold text-slate-800 text-sm">Entrada Manual</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              {record?.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : 'Pendiente'}
                            </p>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <Checkbox 
                            id={`exit-${shift.id}`} 
                            disabled={!record?.entryDateTime || !!record?.exitDateTime || !!isActionLoading}
                            checked={!!record?.exitDateTime}
                            onCheckedChange={(checked) => checked && handleMarkAttendance(shift.id, 'exit', 'manual')}
                          />
                          <Label htmlFor={`exit-${shift.id}`} className="flex-1 cursor-pointer">
                            <p className="font-bold text-slate-800 text-sm">Salida Manual</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              {record?.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : 'Pendiente'}
                            </p>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {todayShifts.length === 0 && (
                  <Card className="border-dashed border-2 bg-transparent text-center p-8 md:p-12">
                    <Calendar className="h-8 w-8 md:h-10 md:w-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-xs md:text-sm font-medium text-slate-500">No hay jornadas programadas para hoy.</p>
                  </Card>
                )}
                <QRMarker onMark={(type, loc) => {
                  if (todayShifts.length === 1) {
                    handleMarkAttendance(todayShifts[0].id, type, 'qr', loc);
                  } else {
                    toast({ title: "Selección requerida", description: "Use los controles manuales hoy para seleccionar la jornada." });
                  }
                }} />
              </TabsContent>

              <TabsContent value="id" className="mt-6">
                 <TeacherCardQR teacher={profile} shifts={shifts || []} />
                 <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium leading-relaxed px-4">
                   Este carnet es personal e intransferible. <br className="hidden md:block" /> Úselo para validar su ingreso en los puntos de control.
                 </p>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl h-full rounded-3xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between py-6 px-6 md:py-8 md:px-8 gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl font-black">Historial de Movimientos</CardTitle>
                  <CardDescription className="text-xs">Seguimiento detallado por fecha</CardDescription>
                </div>
                <Badge variant="outline" className="font-black border-primary/20 text-primary rounded-lg px-4 py-1 text-[10px]">
                  {attendance?.length || 0} Registros
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="px-6 md:px-8 py-4 uppercase text-[9px] md:text-[10px] font-black text-slate-400">Fecha / Jornada</TableHead>
                        <TableHead className="py-4 uppercase text-[9px] md:text-[10px] font-black text-slate-400">Marcajes</TableHead>
                        <TableHead className="py-4 uppercase text-[9px] md:text-[10px] font-black text-slate-400">Método</TableHead>
                        <TableHead className="text-right px-6 md:px-8 py-4 uppercase text-[9px] md:text-[10px] font-black text-slate-400">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance?.map((record) => {
                        const shift = shifts?.find(s => s.id === record.shiftId);
                        return (
                          <TableRow key={record.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                            <TableCell className="px-6 md:px-8 py-4 md:py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs md:text-sm">
                                  {format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}
                                </span>
                                <span className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-tight">
                                  {shift?.name || '---'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 md:py-5">
                              <div className="flex flex-col gap-1">
                                <div className="text-[10px] md:text-xs font-black text-green-600 flex items-center gap-2">
                                  <span className="w-4 h-4 rounded bg-green-50 flex items-center justify-center text-[8px] border border-green-100">E</span>
                                  {record.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : '--:--'}
                                </div>
                                <div className="text-[10px] md:text-xs font-black text-orange-600 flex items-center gap-2">
                                  <span className="w-4 h-4 rounded bg-orange-50 flex items-center justify-center text-[8px] border border-orange-100">S</span>
                                  {record.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : '--:--'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 md:py-5">
                              <Badge variant="secondary" className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter bg-white border">
                                {record.entryMethod === 'qr' ? 'QR SCAN' : 'MANUAL'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-6 md:px-8 py-4 md:py-5">
                               {record.exitDateTime ? (
                                 <Badge className="bg-green-500 hover:bg-green-600 text-[8px] md:text-[10px] font-bold rounded-lg px-2 md:px-3">CUMPLIDO</Badge>
                               ) : (
                                 <Badge variant="secondary" className="text-[8px] md:text-[10px] font-bold rounded-lg px-2 md:px-3">PROCESO</Badge>
                               )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!attendance || attendance.length === 0) && !isAttendanceLoading && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20 md:py-24 text-muted-foreground text-xs italic">
                            No hay actividad registrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
