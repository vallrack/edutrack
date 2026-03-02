
"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, History, ShieldCheck, Users, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const router = useRouter();

  if (!user) return null;

  return (
    <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative h-12 w-44">
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

          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2 hover:text-primary">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>

            {user.role === 'teacher' && (
              <Link href="/dashboard/records">
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary">
                  <History className="h-4 w-4" />
                  <span className="hidden md:inline">Mis Registros</span>
                </Button>
              </Link>
            )}

            {(user.role === 'admin' || user.role === 'coordinator') && (
              <>
                <Link href="/dashboard/admin/teachers">
                  <Button variant="ghost" className="flex items-center gap-2 hover:text-primary">
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Docentes</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/shifts">
                  <Button variant="ghost" className="flex items-center gap-2 hover:text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="hidden md:inline">Jornadas</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/reports">
                  <Button variant="ghost" className="flex items-center gap-2 hover:text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden md:inline">Reportes</span>
                  </Button>
                </Link>
              </>
            )}

            <div className="h-8 w-[1px] bg-border mx-2" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black mt-1">{user.role}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onLogout}
                className="rounded-full border-primary/20 text-primary hover:bg-primary/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
