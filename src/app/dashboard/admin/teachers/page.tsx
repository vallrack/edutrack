
"use client";

import { useFirebase, useCollection, useDoc } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Search, Loader2, History, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoFirebase } from "@/firebase/provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export default function TeachersAdminPage() {
  const { user, firestore, auth } = useFirebase();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Fetch current user profile for Navbar
  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

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

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio de Docentes</h1>
            <p className="text-muted-foreground">Supervisión y registro de personal docente.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Buscar docente..." 
                  className="pl-9 bg-white border-none shadow-sm h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/dashboard/admin/teachers/add">
              <Button className="h-11 gap-2 font-bold shadow-lg">
                <UserPlus className="h-4 w-4" />
                Nuevo Docente
              </Button>
            </Link>
          </div>
        </header>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-xl font-bold">Listado de Personal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Nombre</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Email</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Marcar Jornada (Hoy)</TableHead>
                    <TableHead className="py-4 px-6 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <span className="font-semibold text-slate-700">{teacher.firstName} {teacher.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-muted-foreground">{teacher.email}</TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        <Checkbox 
                          onCheckedChange={(checked) => checked && handleManualMark(teacher)}
                          className="h-6 w-6 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <Link href={`/dashboard/records?userId=${teacher.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-primary hover:bg-primary/5">
                            <History className="h-4 w-4" />
                            Ver Historial
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-24 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                           <GraduationCap className="h-12 w-12 opacity-10" />
                           <p>No se encontraron docentes registrados.</p>
                        </div>
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
