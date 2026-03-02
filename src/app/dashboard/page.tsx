"use client";

import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceStats } from "@/components/dashboard/AttendanceStats";
import { QRMarker } from "@/components/attendance/QRMarker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MapPin, QrCode, UserCog } from "lucide-react";
import { AdminAttendanceSummary } from "@/components/admin/AdminAttendanceSummary";

export default function DashboardPage() {
  const { user, attendance, logout, addRecord, hydrated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/");
    }
  }, [user, hydrated, router]);

  if (!hydrated || !user) return null;

  const userRecords = attendance.filter(a => a.userId === user.id);
  const recentRecords = user.role === 'teacher' ? userRecords : attendance;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Hola, <span className="text-primary">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground">Resumen de actividad para hoy, {format(new Date(), 'dd MMMM yyyy')}</p>
          </div>
          <Badge variant="secondary" className="w-fit h-fit px-4 py-1 text-sm">
            Estado: <span className="ml-1 text-green-600 font-bold">Activo</span>
          </Badge>
        </header>

        <AttendanceStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Action Area */}
          <div className="lg:col-span-4 space-y-6">
            {user.role === 'teacher' ? (
              <QRMarker onMark={(type, location) => {
                addRecord({
                  userId: user.id,
                  userName: user.name,
                  date: format(new Date(), 'yyyy-MM-dd'),
                  time: format(new Date(), 'HH:mm'),
                  type,
                  method: 'qr',
                  location
                });
              }} />
            ) : (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    Panel de Gestión
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Como {user.role}, puedes supervisar todos los registros y generar reportes administrativos.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-4 bg-muted rounded-xl text-center">
                        <p className="text-2xl font-bold">{attendance.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length}</p>
                        <p className="text-[10px] uppercase text-muted-foreground">Hoy</p>
                     </div>
                     <div className="p-4 bg-muted rounded-xl text-center">
                        <p className="text-2xl font-bold">{new Set(attendance.map(a => a.userId)).size}</p>
                        <p className="text-[10px] uppercase text-muted-foreground">Usuarios</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(user.role === 'admin' || user.role === 'coordinator') && (
              <AdminAttendanceSummary attendance={attendance} />
            )}
          </div>

          {/* History / List Area */}
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
                      {user.role !== 'teacher' && <TableHead>Docente</TableHead>}
                      <TableHead>Tipo</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.slice(0, 8).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{record.date}</span>
                            <span className="text-xs text-muted-foreground">{record.time}</span>
                          </div>
                        </TableCell>
                        {user.role !== 'teacher' && <TableCell>{record.userName}</TableCell>}
                        <TableCell>
                          <Badge variant={record.type === 'entry' ? 'default' : 'outline'} className={record.type === 'entry' ? "bg-green-500 hover:bg-green-600" : ""}>
                            {record.type === 'entry' ? 'Entrada' : 'Salida'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            {record.method === 'qr' ? <QrCode className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
                            {record.method === 'qr' ? 'QR' : 'Manual'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {record.location && (
                            <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-2 w-2" />
                              GPS OK
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay registros encontrados.
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
