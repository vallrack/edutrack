
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
import { QrCode, UserCog, Loader2, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { AdminAttendanceSummary } from "@/components/admin/AdminAttendanceSummary";
import { collection, doc, addDoc, serverTimestamp, query, orderBy, limit, setDoc, getDocs, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, isUserLoading, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

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
      limit(10)
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

  const handleFullShiftMark = async () => {
    if (!user || !profile?.shiftIds?.[0] || !shifts) return;
    
    setIsActionLoading(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const shift = shifts.find(s => s.id === profile.shiftIds[0]);
    
    if (!shift) {
      toast({ variant: "destructive", title: "Error", description: "No se encontró tu jornada asignada." });
      setIsActionLoading(false);
      return;
    }

    const recordsRef = collection(firestore, 'userProfiles', user.uid, 'attendanceRecords');
    const todayQuery = query(recordsRef, where('date', '==', todayStr), limit(1));
    const querySnapshot = await getDocs(todayQuery);

    const entryDateTime = `${todayStr}T${shift.startTime}:00`;
    const exitDateTime = `${todayStr}T${shift.endTime}:00`;

    const attendanceData = {
      userId: user.uid,
      date: todayStr,
      entryDateTime,
      exitDateTime,
      entryMethod: 'manual',
      exitMethod: 'manual',
      entryLocationLatitude: 0,
      entryLocationLongitude: 0,
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
        description: `Se ha registrado tu horario de ${shift.startTime} a ${shift.endTime} para hoy.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo realizar el registro." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkAttendance = async (type: 'entry' | 'exit', method: 'qr' | 'manual', location?: { latitude: number, longitude: number }) => {
    if (!user) return;
    
    setIsActionLoading(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const recordsRef = collection(firestore, 'userProfiles', user.uid, 'attendanceRecords');
    
    const todayQuery = query(recordsRef, where('date', '==', todayStr), limit(1));
    const querySnapshot = await getDocs(todayQuery);
    
    const attendanceData: any = {
      userId: user.uid,
      date: todayStr,
      updatedAt: serverTimestamp()
    };

    if (type === 'entry') {
      attendanceData.entryDateTime = new Date().toISOString();
      attendanceData.entryMethod = method;
      attendanceData.entryLocationLatitude = location?.latitude || 0;
      attendanceData.entryLocationLongitude = location?.longitude || 0;
      attendanceData.isManualOverride = method === 'manual';
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
        description: `Se ha marcado tu ${type === 'entry' ? 'entrada' : 'salida'} correctamente via ${method.toUpperCase()}.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la asistencia." });
    } finally {
      setIsActionLoading(false);
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
  const todayRecord = attendance?.find(r => r.date === format(new Date(), 'yyyy-MM-dd'));

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

        <AttendanceStats records={attendance} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Registro de Jornada
                </CardTitle>
                <CardDescription>Opciones de cumplimiento rápido</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <Button 
                  onClick={handleFullShiftMark}
                  disabled={isActionLoading || !!(todayRecord?.entryDateTime && todayRecord?.exitDateTime)}
                  className="w-full h-14 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border flex items-center justify-between px-6 font-black rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5" />
                    <span>MARCAR JORNADA COMPLETA</span>
                  </div>
                  {isActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-300 bg-white px-2">O marcaje parcial</div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Checkbox 
                    id="manual-entry" 
                    disabled={!!todayRecord?.entryDateTime || isActionLoading}
                    checked={!!todayRecord?.entryDateTime}
                    onCheckedChange={(checked) => checked && handleMarkAttendance('entry', 'manual')}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="manual-entry" className="flex-1 cursor-pointer">
                    <p className="font-bold text-slate-800">Entrada Manual</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      {todayRecord?.entryDateTime ? `Hora: ${format(new Date(todayRecord.entryDateTime), 'HH:mm')}` : 'Pendiente'}
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Checkbox 
                    id="manual-exit" 
                    disabled={!todayRecord?.entryDateTime || !!todayRecord?.exitDateTime || isActionLoading}
                    checked={!!todayRecord?.exitDateTime}
                    onCheckedChange={(checked) => checked && handleMarkAttendance('exit', 'manual')}
                    className="h-6 w-6"
                  />
                  <Label htmlFor="manual-exit" className="flex-1 cursor-pointer">
                    <p className="font-bold text-slate-800">Salida Manual</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      {todayRecord?.exitDateTime ? `Hora: ${format(new Date(todayRecord.exitDateTime), 'HH:mm')}` : 'Pendiente'}
                    </p>
                  </Label>
                </div>
              </CardContent>
            </Card>

            <QRMarker onMark={(type, loc) => handleMarkAttendance(type, 'qr', loc)} />

            {isAdmin && attendance && attendance.length > 0 && (
              <AdminAttendanceSummary attendance={attendance.map(a => ({
                id: a.id,
                userId: user.uid,
                userName: profile ? `${profile.firstName} ${profile.lastName}` : "Usuario",
                date: a.date,
                time: a.entryDateTime ? format(new Date(a.entryDateTime), 'HH:mm') : '---',
                type: 'entry',
                method: a.entryMethod,
                location: { latitude: a.entryLocationLatitude, longitude: a.entryLocationLongitude }
              }))} />
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl h-full rounded-2xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historial Reciente</CardTitle>
                  <CardDescription>Listado de tus últimos movimientos</CardDescription>
                </div>
                <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                  {attendance?.length || 0} Registros
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="px-6">Fecha</TableHead>
                      <TableHead>Entrada / Salida</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right px-6">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance?.map((record) => (
                      <TableRow key={record.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                        <TableCell className="px-6 font-semibold text-slate-700">
                          {format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}
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
                    ))}
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
