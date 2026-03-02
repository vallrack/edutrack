
"use client";

import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Hash, DoorOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherCardQRProps {
  teacher: any;
  shifts: any[];
}

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function TeacherCardQR({ teacher, shifts }: TeacherCardQRProps) {
  if (!teacher) return null;

  const teacherShifts = teacher.shiftIds
    ?.map((id: string) => shifts.find((s) => s.id === id))
    .filter(Boolean);

  const qrData = JSON.stringify({
    id: teacher.id,
    nombre: `${teacher.firstName} ${teacher.lastName}`,
    cedula: teacher.cedula,
    salon: teacher.assignedRoom,
    sede: teacher.campus
  });

  return (
    <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden max-w-sm mx-auto">
      <CardHeader className="bg-primary text-white p-8 pb-20 text-center relative">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white p-2.5 rounded-2xl shadow-xl border-4 border-white z-10">
          <QRCodeSVG value={qrData} size={110} level="H" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-56">
            <Image 
              src="https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png" 
              alt="Ciudad Don Bosco" 
              fill
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
          <div className="text-primary-foreground/90 text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-4">
            Identificación Institucional
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-20 pb-8 px-8 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-800 uppercase leading-tight tracking-tight px-4">
            {teacher.firstName} {teacher.lastName}
          </h3>
          <div className="text-primary font-bold text-[10px] uppercase tracking-[0.15em]">
            {teacher.specialty || 'Personal Institucional'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-1">
            <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Hash className="h-2.5 w-2.5" /> Cédula
            </div>
            <div className="text-xs font-bold text-slate-700">{teacher.cedula || '---'}</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end">
               Sede <MapPin className="h-2.5 w-2.5" />
            </div>
            <div className="text-xs font-bold text-slate-700">{teacher.campus || 'Principal'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
              <DoorOpen className="h-2.5 w-2.5" /> Salón
            </div>
            <div className="text-xs font-bold text-slate-700">{teacher.assignedRoom || '---'}</div>
          </div>
          <div className="space-y-1 text-right">
             <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end mb-1">
               Estado
            </div>
            <div className="flex justify-end">
              <Badge className="bg-green-500 hover:bg-green-500 h-5 text-[9px] px-2 font-black uppercase rounded-full">Activo</Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50">
          <div className="text-[8px] font-black text-slate-300 uppercase mb-3 tracking-widest text-center">Horarios Asignados</div>
          <div className="grid grid-cols-1 gap-2">
            {teacherShifts?.map((s: any) => (
              <div key={s.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{s.name}</span>
                    <div className="flex items-center gap-1 text-[9px] text-primary font-bold">
                      <Clock className="h-2.5 w-2.5" />
                      {s.startTime} - {s.endTime}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[7px] h-4 border-primary/20 text-primary font-bold">
                    {s.tolerance}m TOL.
                  </Badge>
                </div>
                <div className="flex gap-1 justify-center">
                  {DAY_LABELS.map((label, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-md border transition-all",
                        s.days?.includes(i) 
                          ? "bg-primary text-white border-primary shadow-sm scale-110" 
                          : "bg-white text-slate-200 border-slate-100"
                      )}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">EduTrack • Ciudad Don Bosco</p>
      </div>
    </Card>
  );
}
