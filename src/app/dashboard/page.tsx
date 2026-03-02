
"use client";

import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceStats } from "@/components/dashboard/AttendanceStats";
import { QRMarker } from "@/components/attendance/QRMarker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { QrCode, UserCog, Loader2, CheckCircle2, MapPin, Sparkles, Clock } from "lucide-react";
import { AdminAttendanceSummary } from "@/components/admin/AdminAttendanceSummary";
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

  const isAdmin = profile?.role === 'admin' || profile?.role === 'coordinator';
  const todayRecords = attendance?.filter(r => r.date === format(new Date(), 'yyyy-MM-dd')) || [];

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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Panel de <span className="text-primary">{profile?.role === 'teacher' ? 'Docente' : 'Control'}</span>
            </h1>
            <p className="text-muted-foreground">Bienvenido, {profile?.firstName}. Hoy es {format(new Date(), 'eeee, dd MMMM')}</p>
          </div>
          <Badge variant="secondary" className="w-fit h-fit px-4 py-1 text-sm bg-white shadow-sm text-green-600 border-green-100 font-bold">
            Sistema en Línea
          </Badge>
        </header>

        <AttendanceStats records={attendance || []} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Mis Jornadas de Hoy</h2>
            
            {profile?.shiftIds?.map((shiftId: string) => {
              const shift = shifts?.find(s => s.id === shiftId);
              const record = todayRecords.find(r => r.shiftId === shiftId);
              if (!shift) return null;

              return (
                <Card key={shiftId} className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-50/50 pb-4">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {shift.name}
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {shift.startTime} - {shift.endTime}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">
                      Tolerancia: {shift.tolerance} min
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <Button 
                      onClick={() => handleFullShiftMark(shiftId)}
                      disabled={!!isActionLoading || (!!record?.entryDateTime && !!record?.exitDateTime)}
                      className="w-full h-12 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border flex items-center justify-between px-4 font-black rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>JORNADA COMPLETA</span>
                      </div>
                      {isActionLoading === shiftId && <Loader2 className="h-3 w-3 animate-spin" />}
                    </Button>

                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Checkbox 
                        id={`entry-${shiftId}`} 
                        disabled={!!record?.entryDateTime || !!isActionLoading}
                        checked={!!record?.entryDateTime}
                        onCheckedChange={(checked) => checked && handleMarkAttendance(shiftId, 'entry', 'manual')}
                      />
                      <Label htmlFor={`entry-${shiftId}`} className="flex-1 cursor-pointer">
                        <p className="font-bold text-slate-800 text-sm">Entrada</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {record?.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : 'Pendiente'}
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Checkbox 
                        id={`exit-${shiftId}`} 
                        disabled={!record?.entryDateTime || !!record?.exitDateTime || !!isActionLoading}
                        checked={!!record?.exitDateTime}
                        onCheckedChange={(checked) => checked && handleMarkAttendance(shiftId, 'exit', 'manual')}
                      />
                      <Label htmlFor={`exit-${shiftId}`} className="flex-1 cursor-pointer">
                        <p className="font-bold text-slate-800 text-sm">Salida</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {record?.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : 'Pendiente'}
                        </p>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {(!profile?.shiftIds || profile.shiftIds.length === 0) && (
              <Card className="border-dashed border-2 bg-transparent text-center p-8">
                <p className="text-sm text-muted-foreground">No tienes jornadas asignadas para hoy.</p>
              </Card>
            )}

            <QRMarker onMark={(type, loc) => {
              // Si tiene una sola jornada, marcar esa. Si no, notificar.
              if (profile?.shiftIds?.length === 1) {
                handleMarkAttendance(profile.shiftIds[0], type, 'qr', loc);
              } else {
                toast({ title: "Selección requerida", description: "Por favor usa el marcaje manual para elegir la jornada específica." });
              }
            }} />

            {isAdmin && attendance && attendance.length > 0 && (
              <AdminAttendanceSummary attendance={attendance.map(a => ({
                id: a.id,
                userId: user.uid,
                userName: profile ? `${profile.firstName} ${profile.lastName}` : "Usuario",
                date: a.date,
                time: a.entryDateTime ? format(new Date(a.entryDateTime), 'HH:mm') : '---',
                type: 'entry',
                method: a.entryMethod || 'manual',
                location: { latitude: a.entryLocationLatitude || 0, longitude: a.entryLocationLongitude || 0 }
              }))} />
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl h-full rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historial de Movimientos</CardTitle>
                  <CardDescription>Detalle por jornada y fecha</CardDescription>
                </div>
                <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                  {attendance?.length || 0} Registros
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="px-6">Fecha / Jornada</TableHead>
                      <TableHead>Entrada / Salida</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right px-6">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance?.map((record) => {
                      const shift = shifts?.find(s => s.id === record.shiftId);
                      return (
                        <TableRow key={record.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                          <TableCell className="px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">
                                {format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}
                              </span>
                              <span className="text-[10px] text-primary font-bold uppercase">
                                {shift?.name || 'Desconocida'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="text-xs font-bold text-green-600 flex items-center gap-1">
                                <span className="w-4 h-4 rounded bg-green-50 flex items-center justify-center text-[8px]">E</span>
                                {record.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : '--:--'}
                              </div>
                              <div className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                <span className="w-4 h-4 rounded bg-orange-50 flex items-center justify-center text-[8px]">S</span>
                                {record.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : '--:--'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">
                              {record.entryMethod === 'qr' ? <QrCode className="h-2 w-2 mr-1" /> : <UserCog className="h-2 w-2 mr-1" />}
                              {record.entryMethod === 'qr' ? 'QR SCAN' : 'MANUAL'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6">
                             {record.exitDateTime ? (
                               <Badge className="bg-green-500 hover:bg-green-600 text-[10px] font-bold">CUMPLIDO</Badge>
                             ) : (
                               <Badge variant="secondary" className="text-[10px] font-bold">PROCESO</Badge>
                             )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!attendance || attendance.length === 0) && !isAttendanceLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">
                          No hay actividad registrada en este periodo.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
