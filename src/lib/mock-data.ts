
import { User, AttendanceRecord } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Sarah Wilson', email: 'sarah.w@edutrack.com', role: 'teacher', avatarUrl: 'https://picsum.photos/seed/s1/200/200' },
  { id: 'u2', name: 'Prof. James Miller', email: 'james.m@edutrack.com', role: 'teacher', avatarUrl: 'https://picsum.photos/seed/s2/200/200' },
  { id: 'u3', name: 'Elena Rodriguez', email: 'elena.r@edutrack.com', role: 'coordinator', avatarUrl: 'https://picsum.photos/seed/s3/200/200' },
  { id: 'u4', name: 'Admin User', email: 'admin@edutrack.com', role: 'admin', avatarUrl: 'https://picsum.photos/seed/s4/200/200' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    userId: 'u1',
    userName: 'Dr. Sarah Wilson',
    date: '2024-05-15',
    time: '08:05',
    type: 'entry',
    method: 'qr',
    location: { latitude: 19.4326, longitude: -99.1332 }
  },
  {
    id: 'a2',
    userId: 'u1',
    userName: 'Dr. Sarah Wilson',
    date: '2024-05-15',
    time: '16:15',
    type: 'exit',
    method: 'qr',
    location: { latitude: 19.4328, longitude: -99.1334 }
  },
  {
    id: 'a3',
    userId: 'u2',
    userName: 'Prof. James Miller',
    date: '2024-05-15',
    time: '09:00',
    type: 'entry',
    method: 'manual',
    location: { latitude: 19.4326, longitude: -99.1332 }
  },
];
