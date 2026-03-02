
"use client";

import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceStats } from "@/components/dashboard/AttendanceStats";
import { QRMarker } from "@/components/attendance/QRMarker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { format } from "date-fns";
import { MapPin, QrCode, UserCog, Loader2 } from "lucide-react";
import { AdminAttendanceSummary } from "@/components/admin/AdminAttendanceSummary";
import { collection, doc, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function DashboardPage() {
  const { user, isUserLoading, firestore, auth } = useFirebase();
  const router = useRouter();

  // Profile data from Firestore
  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  // Attendance records (User's own, limited to recent)
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

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleMarkAttendance = (type: 'entry' | 'exit', location?: { latitude: number, longitude: number }) => {
    if (!user) return;
    const recordsRef = collection(firestore, 'userProfiles', user.uid, 'attendanceRecords');
    
    const attendanceData = {
      userId: user.uid,
      date: format(new Date(), 'yyyy-MM-dd'),
      [type === 'entry' ? 'entryDateTime' : 'exitDateTime']: new Date().toISOString(),
      [type === 'entry' ? 'entryMethod' : 'exitMethod']: 'qr',
      [type === 'entry' ? 'entryLocationLatitude' : 'exitLocationLatitude']: location?.latitude || 0,
      [type === 'entry' ? 'entryLocationLongitude' : 'exitLocationLongitude']: location?.longitude || 0,
      isManualOverride: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDoc(recordsRef, attendanceData).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recordsRef.path,
        operation: 'create',
        requestResourceData: attendanceData,
      }));
    });
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'coordinator';

  return (
    <div className="min-h-screen bg-background">
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
          <Badge variant="secondary" className="w-fit h-fit px-4 py-1 text-sm">
            Estado: <span className="ml-1 text-green-600 font-bold">Conectado</span>
          </Badge>
        </header>

        <AttendanceStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {!isAdmin ? (
              <QRMarker onMark={handleMarkAttendance} />
            ) : (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCog className="h-5 w-5 text-primary" />
                    Panel de Gestión
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Como {profile?.role}, tienes visibilidad de todos los registros del campus.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-4 bg-muted rounded-xl text-center">
                        <p className="text-2xl font-bold">{attendance?.length || 0}</p>
                        <p className="text-[10px] uppercase text-muted-foreground">Tus Registros</p>
                     </div>
                     <div className="p-4 bg-muted rounded-xl text-center">
                        <p className="text-2xl font-bold">1</p>
                        <p className="text-[10px] uppercase text-muted-foreground">Sedes</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAdmin && attendance && (
              <AdminAttendanceSummary attendance={attendance.map(a => ({
                id: a.id,
                userId: a.userId,
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
            <Card className="border-none shadow-xl h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Registros Recientes</CardTitle>
                  <CardDescription>Visualización de los últimos movimientos</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha / Hora</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                            <span className="text-xs text-muted-foreground">
                              {record.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : '---'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            {record.entryMethod === 'qr' ? <QrCode className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
                            {record.entryMethod === 'qr' ? 'QR' : 'Manual'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <Badge variant={record.isManualOverride ? 'secondary' : 'outline'} className="text-[10px]">
                            {record.isManualOverride ? 'Override' : 'Validado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!attendance || attendance.length === 0) && !isAttendanceLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                          No hay registros de asistencia en la base de datos.
                        </TableCell>
                      </TableRow>
                    )}
                    {isAttendanceLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
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
