
"use client";

import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Hash, DoorOpen } from "lucide-react";

interface TeacherCardQRProps {
  teacher: any;
  shifts: any[];
}

export function TeacherCardQR({ teacher, shifts }: TeacherCardQRProps) {
  if (!teacher) return null;

  const teacherShifts = teacher.shiftIds
    ?.map((id: string) => shifts.find((s) => s.id === id))
    .filter(Boolean);

  const qrData = JSON.stringify({
    id: teacher.id,
    nombre: `${teacher.firstName} ${teacher.lastName}`,
    cedula: teacher.cedula,
    especialidad: teacher.specialty,
    salon: teacher.assignedRoom,
    sede: teacher.campus,
    jornadas: teacherShifts?.map((s: any) => `${s.name} (${s.startTime}-${s.endTime})`)
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
          <div className="flex flex-wrap justify-center gap-1.5">
            {teacherShifts?.map((s: any) => (
              <Badge key={s.id} variant="secondary" className="text-[8px] font-bold bg-slate-50 text-slate-500 uppercase rounded-md border-none px-2 py-1">
                {s.name}
              </Badge>
            ))}
            {(!teacherShifts || teacherShifts.length === 0) && (
              <span className="text-[8px] text-slate-300 italic">No hay jornadas registradas</span>
            )}
          </div>
        </div>
      </CardContent>
      <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">EduTrack • Sistema de Control</p>
      </div>
    </Card>
  );
}
