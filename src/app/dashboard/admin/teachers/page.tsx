
"use client";

import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/layout/Navbar";
import { MOCK_USERS } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TeachersAdminPage() {
  const { user, logout, addRecord, hydrated } = useAppStore();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  if (!hydrated || !user) return null;

  const teachers = MOCK_USERS.filter(u => u.role === 'teacher' && u.name.toLowerCase().includes(search.toLowerCase()));

  const handleManualMark = (teacher: any) => {
    addRecord({
      userId: teacher.id,
      userName: teacher.name,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      type: 'entry',
      method: 'manual',
      location: { latitude: 0, longitude: 0 } // Marked by admin usually means at premises
    });
    toast({
        title: "Marcaje Manual",
        description: `Jornada marcada para ${teacher.name}`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={logout} />
      
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Avatar</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Cumplió Jornada (Hoy)</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border">
                        {teacher.avatarUrl ? <img src={teacher.avatarUrl} alt={teacher.name} /> : <GraduationCap className="h-5 w-5" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox 
                        onCheckedChange={(checked) => checked && handleManualMark(teacher)}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Historial</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
