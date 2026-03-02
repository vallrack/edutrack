
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { QrCode, UserCog, Loader2, ArrowLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { Suspense } from "react";

function RecordsContent() {
  const { user, firestore, auth } = useFirebase();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // If an admin is viewing a specific user's history
  const targetUserId = searchParams.get('userId') || user?.uid;

  // Fetch current user profile for Navbar
  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const targetProfileRef = useMemoFirebase(() => 
    targetUserId ? doc(firestore, 'userProfiles', targetUserId) : null,
  [firestore, targetUserId]);
  const { data: targetProfile } = useDoc(targetProfileRef);

  const attendanceQuery = useMemoFirebase(() => 
    targetUserId ? collection(firestore, 'userProfiles', targetUserId, 'attendanceRecords') : null,
  [firestore, targetUserId]);
  const { data: attendance, isLoading } = useCollection(attendanceQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={profile ? { 
        id: profile.id, 
        name: `${profile.firstName} ${profile.lastName}`, 
        role: profile.role,
        email: profile.email
      } : null} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Historial de Asistencia
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {targetProfile ? `Registros para ${targetProfile.firstName} ${targetProfile.lastName}` : "Cargando perfil..."}
            </p>
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle>Todos los Registros</CardTitle>
            <CardDescription>Detalle cronológico de entradas y salidas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px]">Fecha</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px]">Hora Entrada</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px]">Hora Salida</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px]">Método</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50 border-slate-50">
                      <TableCell className="py-4 px-6 font-semibold text-slate-700">
                        {format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {record.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : '---'}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {record.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : <span className="text-orange-500 font-medium">Pendiente</span>}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {record.entryMethod === 'qr' ? <QrCode className="h-3 w-3 text-primary" /> : <UserCog className="h-3 w-3 text-orange-500" />}
                          {record.entryMethod === 'qr' ? 'QR Dinámico' : 'Manual'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        {record.isManualOverride ? (
                          <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-orange-100 font-bold px-3">
                            OVERRIDE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-100 bg-green-50/30 font-bold px-3">
                            ESTÁNDAR
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!attendance || attendance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                        No se encontraron registros de asistencia.
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

export default function RecordsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F1F3F6]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <RecordsContent />
    </Suspense>
  );
}
