
"use client";

import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Table as TableIcon, Download, Filter } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export default function ReportsAdminPage() {
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  // Fetch current user profile for Navbar
  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null, 
  [firestore, user]);
  const { data: profile } = useDoc(profileRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleExport = (formatType: string) => {
    toast({
      title: `Generando Reporte ${formatType}`,
      description: "Calculando horas laboradas y procesando archivo..."
    });
    
    // Simulate export logic
    setTimeout(() => {
      toast({
        title: "Descarga Exitosa",
        description: `El archivo edutrack_report_${format(new Date(), 'yyyyMMdd')}.${formatType.toLowerCase()} ha sido generado.`
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <Navbar user={profile ? { 
        id: profile.id, 
        name: `${profile.firstName} ${profile.lastName}`, 
        role: profile.role,
        email: profile.email
      } : null} onLogout={handleLogout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generador de Reportes</h1>
          <p className="text-muted-foreground">Exportación de datos de nómina y cumplimiento</p>
        </header>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white">
            <CardTitle>Configuración del Reporte</CardTitle>
            <CardDescription>Filtre los datos para generar el acumulado de horas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 bg-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Periodo</label>
                <Select defaultValue="monthly">
                  <SelectTrigger className="h-11 bg-slate-50 border-none shadow-inner">
                    <SelectValue placeholder="Seleccione periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Desde</label>
                <div className="h-11 px-3 border-none rounded-md flex items-center bg-slate-50 shadow-inner text-sm font-medium">
                  {format(subDays(new Date(), 30), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <p className="text-sm font-bold text-slate-700">Formatos de Salida</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleExport('PDF')}
                  className="h-28 flex-col gap-2 bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all"
                >
                  <FileText className="h-10 w-10 text-red-500" />
                  <span className="font-bold">Reporte PDF</span>
                  <span className="text-[10px] text-muted-foreground">Visualización y archivo</span>
                </Button>
                <Button 
                  onClick={() => handleExport('Excel')}
                  className="h-28 flex-col gap-2 bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all"
                >
                  <TableIcon className="h-10 w-10 text-green-500" />
                  <span className="font-bold">Excel / CSV</span>
                  <span className="text-[10px] text-muted-foreground">Integración con Nómina</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-primary/5 rounded-2xl">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Cálculo Automático de Horas</p>
              <p className="text-sm text-muted-foreground mt-1">
                El sistema utiliza Cloud Functions para procesar miles de registros y calcular la diferencia exacta entre entradas y salidas, considerando las reglas de la institución.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
