'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, History, ShieldCheck, Users, Clock } from 'lucide-react';
import { useUser } from '@/firebase';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  // We use the provided user prop, but we can also use the hook if needed for robustness
  const { isUserLoading } = useUser();

  return (
    <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative h-10 w-32 md:h-12 md:w-44">
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

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto no-scrollbar ml-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold h-9"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline text-xs md:text-sm">Dashboard</span>
              </Button>
            </Link>

            {user?.role === 'teacher' && (
              <Link href="/dashboard/records">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold h-9"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden lg:inline text-xs md:text-sm">Mis Registros</span>
                </Button>
              </Link>
            )}

            {(user?.role === 'admin' || user?.role === 'coordinator') && (
              <>
                <Link href="/dashboard/admin/teachers">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold h-9"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden lg:inline text-xs md:text-sm">Docentes</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/shifts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold h-9"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden lg:inline text-xs md:text-sm">Jornadas</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/reports">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 md:gap-2 hover:text-primary px-2 md:px-4 font-bold h-9"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden lg:inline text-xs md:text-sm">Reportes</span>
                  </Button>
                </Link>
              </>
            )}

            <div className="h-6 w-[1px] bg-slate-200 mx-1 md:mx-2 shrink-0" />

            {/* Profile / Logout Section */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] md:text-sm font-black leading-none truncate max-w-[80px] md:max-w-[150px] text-slate-800 uppercase">
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
              ) : isUserLoading ? (
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-slate-100 animate-pulse" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
