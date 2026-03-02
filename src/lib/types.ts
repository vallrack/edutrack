
export type UserRole = 'teacher' | 'coordinator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  shiftId?: string; // ID de la jornada específica
  date: string;
  time: string;
  entryDateTime?: string;
  exitDateTime?: string;
  type: 'entry' | 'exit';
  method: 'qr' | 'manual';
  entryMethod?: 'qr' | 'manual';
  exitMethod?: 'qr' | 'manual';
  isManualOverride?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TeacherStats {
  teacherId: string;
  teacherName: string;
  totalHours: number;
  records: AttendanceRecord[];
}
