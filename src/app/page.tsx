
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useFirebase, useUser } from "@/firebase";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ShieldAlert, Loader2, Settings, UserPlus } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <div className="max-w-md w-full space-y-8 text-center z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-20 w-72">
            <Image 
              src="https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png" 
              alt="Ciudad Don Bosco" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Control de Asistencia</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Plataforma Institucional</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-8">
            <CardTitle className="text-xl font-bold">Ingreso al Sistema</CardTitle>
            <CardDescription className="text-xs">Acceda con su cuenta oficial institucional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-left pt-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400">Correo Institucional</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="ejemplo@ciudaddonbosco.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-slate-50 border-none shadow-inner rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="Contraseña" className="text-[10px] font-black uppercase text-slate-400">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-slate-50 border-none shadow-inner rounded-xl"
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2 h-14 font-black uppercase tracking-widest shadow-xl rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                Iniciar Sesión
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white px-2 text-slate-300 tracking-widest">O</span></div>
            </div>

            <Link href="/register">
              <Button variant="outline" className="w-full gap-2 h-12 border-primary/20 text-primary hover:bg-primary/5 font-bold rounded-xl" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                Registrarme como Docente
              </Button>
            </Link>

            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="w-full gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider h-10" onClick={handleGuestLogin} disabled={loading}>
                <ShieldAlert className="h-3 w-3" />
                Acceso Rápido Temporal
              </Button>

              <Link href="/setup-admin">
                <Button variant="link" className="w-full gap-2 text-[9px] text-slate-400 hover:text-primary uppercase font-bold">
                  <Settings className="h-3 w-3" />
                  Panel de Administración
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
          EduTrack &copy; Ciudad Don Bosco 2024
        </p>
      </div>
    </div>
  );
}
