
"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Hash, DoorOpen } from "lucide-react";

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
      <CardHeader className="bg-primary text-white p-6 pb-12 text-center relative">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white p-2 rounded-2xl shadow-lg border-4 border-white">
          <QRCodeSVG value={qrData} size={100} level="H" />
        </div>
        <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Ciudad Don Bosco
        </CardTitle>
        <div className="text-primary-foreground/80 text-[9px] font-black uppercase mt-1 tracking-widest">Carnet de Docente</div>
      </CardHeader>
      
      <CardContent className="pt-16 pb-8 px-8 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-800 uppercase leading-none tracking-tight">
            {teacher.firstName} {teacher.lastName}
          </h3>
          <div className="text-primary font-bold text-[10px] uppercase tracking-[0.15em]">{teacher.specialty || 'Docente de Planta'}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
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
             <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end">
               Estado <Badge className="bg-green-500 hover:bg-green-500 h-4 text-[8px] px-1.5 font-black uppercase rounded-sm">Activo</Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50">
          <div className="text-[8px] font-black text-slate-300 uppercase mb-2 tracking-widest">Horarios Institucionales</div>
          <div className="flex flex-wrap gap-1">
            {teacherShifts?.map((s: any) => (
              <Badge key={s.id} variant="secondary" className="text-[8px] font-bold bg-slate-50 text-slate-500 uppercase rounded-sm border-none">
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <div className="bg-slate-50 py-3 text-center border-t border-slate-100">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Asistencia Digital EduTrack</p>
      </div>
    </Card>
  );
}
