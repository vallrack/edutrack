
"use client";

import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Table as TableIcon, Download, Filter } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsAdminPage() {
  const { user, logout, hydrated } = useAppStore();
  const { toast } = useToast();

  if (!hydrated || !user) return null;

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
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={logout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generador de Reportes</h1>
          <p className="text-muted-foreground">Exportación de datos de nómina y cumplimiento</p>
        </header>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Configuración del Reporte</CardTitle>
            <CardDescription>Filtre los datos para generar el acumulado de horas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Periodo</label>
                <Select defaultValue="monthly">
                  <SelectTrigger>
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
                <label className="text-xs font-bold uppercase text-muted-foreground">Desde</label>
                <div className="h-10 px-3 border rounded-md flex items-center bg-muted/30 text-sm">
                  {format(subDays(new Date(), 30), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <p className="text-sm font-medium">Formatos de Salida</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleExport('PDF')}
                  className="h-24 flex-col gap-2 bg-white text-slate-900 border hover:bg-slate-50 shadow-md"
                >
                  <FileText className="h-8 w-8 text-red-500" />
                  <span>Reporte PDF (Visualización)</span>
                </Button>
                <Button 
                  onClick={() => handleExport('Excel')}
                  className="h-24 flex-col gap-2 bg-white text-slate-900 border hover:bg-slate-50 shadow-md"
                >
                  <TableIcon className="h-8 w-8 text-green-500" />
                  <span>Excel / CSV (Nómina)</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Cálculo Automático de Horas</p>
              <p className="text-xs text-muted-foreground mt-1">
                El sistema utiliza Cloud Functions para procesar miles de registros y calcular la diferencia exacta entre entradas y salidas, considerando las reglas de la institución.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
