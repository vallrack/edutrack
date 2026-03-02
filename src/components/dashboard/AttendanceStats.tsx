
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, CalendarCheck, MapPin, QrCode } from "lucide-react";
import { format, isToday } from "date-fns";
import { AttendanceRecord } from "@/lib/types";

interface AttendanceStatsProps {
  records: any[] | null;
}

export function AttendanceStats({ records }: AttendanceStatsProps) {
  // Logic for "Today"
  const todayRecord = records?.find(r => isToday(new Date(r.date + 'T00:00:00')));
  const todayStatus = todayRecord ? "Presente" : "Ausente";
  const todaySub = todayRecord?.entryDateTime 
    ? `Entrada ${format(new Date(todayRecord.entryDateTime), 'hh:mm a')}` 
    : "Sin registro hoy";

  // Logic for "Method"
  const methods = records?.map(r => r.entryMethod) || [];
  const mainMethod = methods.length > 0 
    ? (methods.filter(m => m === 'qr').length >= methods.filter(m => m === 'manual').length ? "QR Dinámico" : "Manual")
    : "---";

  // Logic for "Location"
  const lastLocation = records?.[0]?.entryLocationLatitude 
    ? `${records[0].entryLocationLatitude.toFixed(2)}, ${records[0].entryLocationLongitude.toFixed(2)}`
    : "No disponible";

  const stats = [
    { 
      label: "Hoy", 
      value: todayStatus, 
      sub: todaySub, 
      icon: Clock, 
      color: todayRecord ? "text-green-500" : "text-slate-400" 
    },
    { 
      label: "Registros", 
      value: records?.length || 0, 
      sub: "Total acumulado", 
      icon: CalendarCheck, 
      color: "text-primary" 
    },
    { 
      label: "Método Principal", 
      value: mainMethod, 
      sub: "Validado por sistema", 
      icon: QrCode, 
      color: "text-blue-500" 
    },
    { 
      label: "Última Ubicación", 
      value: lastLocation, 
      sub: "Coordenadas GPS", 
      icon: MapPin, 
      color: "text-orange-500" 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-slate-50 border ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-lg font-bold">{stat.value}</h3>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
