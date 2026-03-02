
"use client";

import { useState, useEffect } from "react";
import { useFirebase, useUser } from "@/firebase";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, LogIn, ShieldAlert, Loader2, Settings, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function LoginPage() {
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Bienvenido", description: "Acceso concedido." });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error de autenticación", 
        description: "Credenciales inválidas o error de conexión." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Acceso Invitado", description: "Entrando como docente temporal." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo iniciar sesión anónima." });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary p-4 rounded-2xl shadow-xl shadow-primary/20 mb-4">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight">EduTrack</h1>
          <p className="text-muted-foreground mt-2">Sistema de Control Institucional</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Ingrese sus credenciales registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nombre@colegio.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2 h-11 font-bold shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Entrar al Sistema
              </Button>
            </form>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 px-2 text-muted-foreground">O</span></div>
            </div>

            <Link href="/register">
              <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 font-bold" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                Registrarme como Docente
              </Button>
            </Link>

            <Button variant="ghost" className="w-full gap-2 text-xs text-muted-foreground" onClick={handleGuestLogin} disabled={loading}>
              <ShieldAlert className="h-3 w-3" />
              Acceso Rápido Invitado
            </Button>

            <Link href="/setup-admin" className="block mt-4">
              <Button variant="link" className="w-full gap-2 text-[10px] text-muted-foreground/60 hover:text-primary">
                <Settings className="h-3 w-3" />
                Configuración Inicial Administrador
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          EduTrack • schedulecontrol-f8b77
        </p>
      </div>
    </div>
  );
}
