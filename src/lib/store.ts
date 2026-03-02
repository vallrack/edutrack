
"use client";

import { useState, useEffect } from 'react';
import { User, AttendanceRecord } from './types';
import { MOCK_USERS, MOCK_ATTENDANCE } from './mock-data';

export function useAppStore() {
  const [user, setUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Load from local storage or set initial mock data
    const savedUser = localStorage.getItem('edutrack_user');
    const savedAttendance = localStorage.getItem('edutrack_attendance');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    if (savedAttendance) {
      setAttendance(JSON.parse(savedAttendance));
    } else {
      setAttendance(MOCK_ATTENDANCE);
    }
    setHydrated(true);
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('edutrack_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edutrack_user');
  };

  const addRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord = { ...record, id: `a${Date.now()}` };
    const updated = [newRecord, ...attendance];
    setAttendance(updated);
    localStorage.setItem('edutrack_attendance', JSON.stringify(updated));
    return newRecord;
  };

  return { user, attendance, login, logout, addRecord, hydrated };
}
