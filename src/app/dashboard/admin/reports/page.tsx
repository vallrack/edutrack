
"use client"

import { useState } from "react";
import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { collection, query, where, getDocs, orderBy, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileDown, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";

interface ReportRecord extends Record<string, any> {
  id: string;
  userName: string;
  shiftName: string;
}

export default function ReportsPage() {
  const { firestore, user, auth, isUserLoading } = useFirebase();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'userProfiles', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const teachersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, "userProfiles"), where("role", "==", "teacher")) : null,
    [firestore]
  );
  const { data: teachers, isLoading: teachersLoading } = useCollection(teachersQuery);
  
  const shiftsQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, "shifts") : null,
    [firestore]
  );
  const { data: shifts, isLoading: shiftsLoading } = useCollection(shiftsQuery);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleGenerateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert("Por favor, selecciona un rango de fechas.");
      return;
    }
    setIsLoading(true);
    setReportData([]);

    let q = query(
      collection(firestore, "globalAttendanceRecords"),
      where("date", ">=", format(dateRange.from, "yyyy-MM-dd")),
      where("date", "<=", format(dateRange.to, "yyyy-MM-dd")),
      orderBy("date", "desc")
    );

    if (selectedTeacher !== "all") {
      q = query(q, where("userId", "==", selectedTeacher));
    }

    try {
      const querySnapshot = await getDocs(q);
      const data: ReportRecord[] = querySnapshot.docs.map(doc => {
        const record = doc.data();
        const teacher = teachers?.find(t => t.id === record.userId);
        const shift = shifts?.find(s => s.id === record.shiftId);
        return {
          id: doc.id,
          date: record.date,
          entryDateTime: record.entryDateTime,
          exitDateTime: record.exitDateTime,
          isManualOverride: record.isManualOverride,
          userName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Desconocido",
          shiftName: shift ? shift.name : "Jornada Única",
        };
      });
      setReportData(data);
    } catch (error) {
      console.error("Error generating report: ", error);
      alert("Ocurrió un error al generar el informe.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = (record: any) => {
    if (record.isManualOverride) return <Badge className="bg-sky-100 text-sky-800">COMPLETO</Badge>;
    if (record.exitDateTime) return <Badge className="bg-green-100 text-green-800">CUMPLIDO</Badge>;
    if (record.entryDateTime) return <Badge className="bg-amber-100 text-amber-800">EN PROCESO</Badge>;
    return <Badge variant="secondary">PENDIENTE</Badge>;
  };

  if (isUserLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={{ id: user.uid, name: `${profile.firstName} ${profile.lastName}`, role: profile.role, email: profile.email }} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white rounded-2xl">
                <CardHeader>
                <CardTitle>Generador de Informes de Asistencia</CardTitle>
                <CardDescription>Filtra y genera informes de asistencia por fecha y docente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={teachersLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar docente..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los docentes</SelectItem>
                        {teachers?.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateReport} disabled={isLoading} className="h-12 md:h-auto font-bold text-lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generar Informe
                    </Button>
                </div>
                </CardContent>
            </Card>

            {reportData.length > 0 && (
                <Card className="border-none shadow-lg bg-white rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Resultados del Informe</CardTitle>
                            <CardDescription>Se encontraron {reportData.length} registros.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline"><FileText className="mr-2 h-4 w-4"/> Exportar a PDF</Button>
                            <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/> Exportar a Excel</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Docente</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Jornada</TableHead>
                                <TableHead>Entrada</TableHead>
                                <TableHead>Salida</TableHead>
                                <TableHead className="text-right">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{record.userName}</TableCell>
                                    <TableCell>{format(parseISO(record.date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>{record.shiftName}</TableCell>
                                    <TableCell>{record.entryDateTime ? format(parseISO(record.entryDateTime), "HH:mm:ss") : "--:--"}</TableCell>
                                    <TableCell>{record.exitDateTime ? format(parseISO(record.exitDateTime), "HH:mm:ss") : "--:--"}</TableCell>
                                    <TableCell className="text-right">{renderStatusBadge(record)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
            { !isLoading && reportData.length === 0 &&
                <div className="text-center py-10"><p className="text-muted-foreground">No se encontraron registros para los filtros seleccionados.</p></div>
            }
        </div>
      </main>
    </div>
  );
}
