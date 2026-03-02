
"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, MapPin, Hash, BookOpen, DoorOpen } from "lucide-react";

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
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white p-2 rounded-2xl shadow-lg">
          <QRCodeSVG value={qrData} size={100} level="H" />
        </div>
        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
          < GraduationCap className="h-6 w-6" />
          Carnet Docente
        </CardTitle>
        <p className="text-primary-foreground/70 text-[10px] font-bold uppercase mt-1">Identificación Institucional</p>
      </CardHeader>
      
      <CardContent className="pt-16 pb-6 px-6 space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-800 uppercase leading-none">
            {teacher.firstName} {teacher.lastName}
          </h3>
          <p className="text-primary font-bold text-xs uppercase tracking-widest">{teacher.specialty || 'Docente de Planta'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Hash className="h-2.5 w-2.5" /> Cédula
            </p>
            <p className="text-xs font-bold text-slate-700">{teacher.cedula || '---'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end">
               Sede <MapPin className="h-2.5 w-2.5" />
            </p>
            <p className="text-xs font-bold text-slate-700">{teacher.campus || 'Principal'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
              <DoorOpen className="h-2.5 w-2.5" /> Salón
            </p>
            <p className="text-xs font-bold text-slate-700">{teacher.assignedRoom || 'Por asignar'}</p>
          </div>
          <div className="space-y-1 text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end">
               Estado <Badge className="bg-green-500 h-3 text-[8px] px-1 font-bold">ACTIVO</Badge>
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Jornadas Asignadas</p>
          <div className="flex flex-wrap gap-1">
            {teacherShifts?.map((s: any) => (
              <Badge key={s.id} variant="secondary" className="text-[8px] font-bold bg-slate-50">
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
