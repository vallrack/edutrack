
"use client";

import { useAppStore } from "@/lib/store";
import { MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GraduationCap, LogIn, ShieldAlert, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, login, hydrated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user) {
      router.push("/dashboard");
    }
  }, [user, hydrated, router]);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary p-4 rounded-2xl shadow-xl shadow-primary/20 mb-4 animate-in zoom-in-50 duration-500">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-black text-primary tracking-tight">EduTrack</h1>
          <p className="text-muted-foreground mt-2">Gestión de Asistencia Académica</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>Seleccione un perfil para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {MOCK_USERS.map((u) => (
              <Button
                key={u.id}
                variant="outline"
                className="h-16 justify-between hover:bg-primary/5 hover:border-primary transition-all group"
                onClick={() => login(u)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                    {u.role === 'admin' ? <ShieldAlert className="h-5 w-5 text-primary" /> : <UserCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                  </div>
                </div>
                <LogIn className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </Button>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          EduTrack v2.5 • Conectado a Firebase Auth & Firestore (Mock)
        </p>
      </div>
    </div>
  );
}
