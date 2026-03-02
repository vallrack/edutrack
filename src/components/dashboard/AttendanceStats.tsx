
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, CalendarCheck, MapPin, QrCode } from "lucide-react";

export function AttendanceStats() {
  const stats = [
    { label: "Hoy", value: "Presente", sub: "Entrada 08:05 AM", icon: Clock, color: "text-green-500" },
    { label: "Puntualidad", value: "94%", sub: "+2% este mes", icon: CalendarCheck, color: "text-primary" },
    { label: "Método Principal", value: "QR Dinámico", sub: "Seguro & Validado", icon: QrCode, color: "text-accent" },
    { label: "Ubicación", value: "Campus A", sub: "GPS Verificado", icon: MapPin, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="overflow-hidden border-none shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-background border ${stat.color}`}>
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
