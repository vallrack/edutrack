
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useFirebase, useUser } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, QrCode, UserPlus } from "lucide-react";
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
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <div className="max-w-md w-full space-y-6 md:space-y-8 text-center z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-16 w-60 md:h-20 md:w-72">
            <Image 
              src="https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png" 
              alt="Ciudad Don Bosco" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Control de Asistencia</h1>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Plataforma Institucional</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-6 md:pb-8">
            <CardTitle className="text-lg md:text-xl font-bold">Ingreso al Sistema</CardTitle>
            <CardDescription className="text-[10px] md:text-xs">Acceda con su cuenta oficial institucional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 text-left pt-6 md:pt-8">
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
              <Button type="submit" className="w-full gap-2 h-14 bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest shadow-xl rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                Iniciar Sesión
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white px-2 text-slate-300 tracking-widest">O</span></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link href="/public-scan">
                <Button className="w-full gap-2 h-14 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border font-black uppercase tracking-widest rounded-xl">
                  <QrCode className="h-5 w-5" />
                  Escanear mi Carnet
                </Button>
              </Link>

              <Link href="/register">
                <Button variant="outline" className="w-full gap-2 h-12 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl" disabled={loading}>
                  <UserPlus className="h-4 w-4" />
                  Registrarme como Docente
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] pb-4">
          EduTrack &copy; Ciudad Don Bosco 2024
        </p>
      </div>
    </div>
  );
}
