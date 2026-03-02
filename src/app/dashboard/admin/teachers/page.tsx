
"use client";

import { useFirebase, useCollection } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Search, Loader2, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoFirebase } from "@/firebase/provider";
import Link from "next/link";

export default function TeachersAdminPage() {
  const { user, logout, firestore } = useFirebase();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Fetch all user profiles that are teachers
  const teachersQuery = useMemoFirebase(() => 
    query(collection(firestore, 'userProfiles'), where('role', '==', 'teacher')),
  [firestore]);
  
  const { data: teachers, isLoading } = useCollection(teachersQuery);

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers.filter(t => 
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [teachers, search]);

  const handleManualMark = (teacher: any) => {
    const recordsRef = collection(firestore, 'userProfiles', teacher.id, 'attendanceRecords');
    const attendanceData = {
      userId: teacher.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      entryDateTime: new Date().toISOString(),
      entryMethod: 'manual',
      entryLocationLatitude: 0,
      entryLocationLongitude: 0,
      markedByCoordinatorId: user?.uid,
      isManualOverride: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDoc(recordsRef, attendanceData)
      .then(() => {
        toast({
          title: "Marcaje Manual Exitoso",
          description: `Jornada marcada para ${teacher.firstName} ${teacher.lastName}`
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: recordsRef.path,
          operation: 'create',
          requestResourceData: attendanceData,
        }));
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio de Docentes</h1>
            <p className="text-muted-foreground">Supervisión y marcaje manual de asistencia</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar docente..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Listado de Personal</CardTitle>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Marcar Jornada (Hoy)</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          {teacher.firstName} {teacher.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          onCheckedChange={(checked) => checked && handleManualMark(teacher)}
                          className="h-5 w-5"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/records?userId=${teacher.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <History className="h-4 w-4" />
                            Ver Historial
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No se encontraron docentes registrados.
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
