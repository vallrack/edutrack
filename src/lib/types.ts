
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
  date: string;
  time: string;
  type: 'entry' | 'exit';
  method: 'qr' | 'manual';
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
