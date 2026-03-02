
"use client";

import Link from "next/link";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, LayoutDashboard, History, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const router = useRouter();

  if (!user) return null;

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="text-white h-6 w-6" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight text-primary hidden sm:block">
              EduTrack
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>

            {user.role === 'teacher' && (
              <Link href="/dashboard/records">
                <Button variant="ghost" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="hidden md:inline">Mis Registros</span>
                </Button>
              </Link>
            )}

            {(user.role === 'admin' || user.role === 'coordinator') && (
              <>
                <Link href="/dashboard/admin/teachers">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Docentes</span>
                  </Button>
                </Link>
                <Link href="/dashboard/admin/reports">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden md:inline">Reportes</span>
                  </Button>
                </Link>
              </>
            )}

            <div className="h-8 w-[1px] bg-border mx-2" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={onLogout}
                className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
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
