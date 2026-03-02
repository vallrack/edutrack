
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, History, ShieldCheck, Users, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative h-10 w-36 md:h-12 md:w-44">
                <Image
                  src="https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png"
                  alt="Ciudad Don Bosco"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-2 overflow-x-auto no-scrollbar">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline">Dashboard</span>
              </Button>
            </Link>

            {user?.role === 'teacher' && (
              <Link href="/dashboard/records">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden lg:inline">Mis Registros</span>
                </Button>
              </Link>
            )}

            {(user?.role === 'admin' || user?.role === 'coordinator') && (
              <>
                <Link href="/dashboard/admin/teachers">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden lg:inline">Docentes</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/shifts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden lg:inline">Jornadas</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/reports">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden lg:inline">Reportes</span>
                  </Button>
                </Link>
              </>
            )}

            <div className="h-6 w-[1px] bg-border mx-1 md:mx-2 shrink-0" />

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] md:text-sm font-black leading-none truncate max-w-[100px] md:max-w-none text-slate-800">
                      {user.name}
                    </p>
                    <p className="text-[8px] md:text-[10px] text-primary uppercase font-black mt-1">
                      {user.role}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onLogout}
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </>
              ) : (
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-slate-100 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
