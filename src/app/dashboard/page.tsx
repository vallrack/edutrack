
"use client";

import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceStats } from "@/components/dashboard/AttendanceStats";
import { QRMarker } from "@/components/attendance/QRMarker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { format, isToday } from "date-fns";
import { QrCode, UserCog, Loader2 } from "lucide-react";
import { AdminAttendanceSummary } from "@/components/admin/AdminAttendanceSummary";
import { collection, doc, addDoc, serverTimestamp, query, orderBy, limit, setDoc, getDocs, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function DashboardPage() {
  const { user, isUserLoading, firestore, auth } = useFirebase();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const attendanceQuery = useMemoFirebase(() => 
    user ? query(
      collection(firestore, 'userProfiles', user.uid, 'attendanceRecords'),
      orderBy('createdAt', 'desc'),
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

  const handleMarkAttendance = async (type: 'entry' | 'exit', location?: { latitude: number, longitude: number }) => {
    if (!user) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const recordsRef = collection(firestore, 'userProfiles', user.uid, 'attendanceRecords');
    
    // Check if there is already a record for today to decide between new doc or update
    const todayQuery = query(recordsRef, where('date', '==', todayStr), limit(1));
    const querySnapshot = await getDocs(todayQuery);
    
    const attendanceData: any = {
      userId: user.uid,
      date: todayStr,
      updatedAt: serverTimestamp()
    };

    if (type === 'entry') {
      attendanceData.entryDateTime = new Date().toISOString();
      attendanceData.entryMethod = 'qr';
      attendanceData.entryLocationLatitude = location?.latitude || 0;
      attendanceData.entryLocationLongitude = location?.longitude || 0;
      attendanceData.isManualOverride = false;
      attendanceData.createdAt = serverTimestamp();
    } else {
      attendanceData.exitDateTime = new Date().toISOString();
      attendanceData.exitMethod = 'qr';
      attendanceData.exitLocationLatitude = location?.latitude || 0;
      attendanceData.exitLocationLongitude = location?.longitude || 0;
    }

    if (!querySnapshot.empty) {
      // Update existing record for today
      const docId = querySnapshot.docs[0].id;
      setDoc(doc(recordsRef, docId), attendanceData, { merge: true }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `${recordsRef.path}/${docId}`,
          operation: 'update',
          requestResourceData: attendanceData,
        }));
      });
    } else {
      // Create new record
      addDoc(recordsRef, attendanceData).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: recordsRef.path,
          operation: 'create',
          requestResourceData: attendanceData,
        }));
      });
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
              Hola, <span className="text-primary">{profile?.firstName || "Docente"}</span>
            </h1>
            <p className="text-muted-foreground">Resumen de actividad para hoy, {format(new Date(), 'dd MMMM yyyy')}</p>
          </div>
          <Badge variant="secondary" className="w-fit h-fit px-4 py-1 text-sm bg-white shadow-sm text-green-600 border-green-100 font-bold">
            Estado: En Línea
          </Badge>
        </header>

        <AttendanceStats records={attendance} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {!isAdmin ? (
              <QRMarker onMark={handleMarkAttendance} />
            ) : (
              <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCog className="h-5 w-5 text-primary" />
                    Panel Administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Como {profile?.role}, puedes supervisar los registros globales desde el menú de Docentes.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <p className="text-2xl font-bold text-primary">{attendance?.length || 0}</p>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Tus Marcajes</p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <p className="text-2xl font-bold text-primary">1</p>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Campus</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
              <CardHeader className="border-b border-slate-50">
                <div>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Tus últimos movimientos registrados en el sistema</CardDescription>
                </div>
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
                            <div className="text-xs font-bold text-green-600">
                              E: {record.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : '--:--'}
                            </div>
                            <div className="text-xs font-bold text-orange-600">
                              S: {record.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : '--:--'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                            {record.entryMethod === 'qr' ? <QrCode className="h-3 w-3 text-primary" /> : <UserCog className="h-3 w-3" />}
                            {record.entryMethod === 'qr' ? 'QR' : 'Manual'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                           <Badge variant={record.isManualOverride ? 'secondary' : 'outline'} className="text-[10px] font-bold">
                            {record.isManualOverride ? 'MODIFICADO' : 'VALIDADO'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!attendance || attendance.length === 0) && !isAttendanceLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                          No tienes registros de asistencia todavía.
                        </TableCell>
                      </TableRow>
                    )}
                    {isAttendanceLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
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
