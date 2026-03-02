
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin, QrCode, UserCog, Loader2, ArrowLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";

export default function RecordsPage() {
  const { user, firestore, logout } = useFirebase();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // If an admin is viewing a specific user's history
  const targetUserId = searchParams.get('userId') || user?.uid;

  const targetProfileRef = useMemoFirebase(() => 
    targetUserId ? doc(firestore, 'userProfiles', targetUserId) : null,
  [firestore, targetUserId]);
  const { data: profile } = useDoc(targetProfileRef);

  const attendanceQuery = useMemoFirebase(() => 
    targetUserId ? collection(firestore, 'userProfiles', targetUserId, 'attendanceRecords') : null,
  [firestore, targetUserId]);
  const { data: attendance, isLoading } = useCollection(attendanceQuery);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Historial de Asistencia
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile ? `Registros para ${profile.firstName} ${profile.lastName}` : "Cargando perfil..."}
            </p>
          </div>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Todos los Registros</CardTitle>
            <CardDescription>Detalle cronológico de entradas y salidas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora Entrada</TableHead>
                    <TableHead>Hora Salida</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date + 'T00:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {record.entryDateTime ? format(new Date(record.entryDateTime), 'HH:mm') : '---'}
                      </TableCell>
                      <TableCell>
                        {record.exitDateTime ? format(new Date(record.exitDateTime), 'HH:mm') : 'Pendiente'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          {record.entryMethod === 'qr' ? <QrCode className="h-3 w-3 text-primary" /> : <UserCog className="h-3 w-3 text-orange-500" />}
                          {record.entryMethod === 'qr' ? 'QR Dinámico' : 'Manual'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.isManualOverride ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                            Override
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Estándar
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!attendance || attendance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
