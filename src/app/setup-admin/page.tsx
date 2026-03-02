
"use client";

import { useState } from "react";
import { useAuth, useFirestore, useFirebase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SetupAdminPage() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Por favor llene todos los campos." });
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Create Profile in userProfiles
      const profileRef = doc(firestore, "userProfiles", uid);
      const profileData = {
        id: uid,
        firebaseAuthUid: uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setDoc(profileRef, profileData).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: profileRef.path,
          operation: 'write',
          requestResourceData: profileData,
        }));
      });

      // 3. Create entry in roles_admins for Security Rules
      const adminRoleRef = doc(firestore, "roles_admins", uid);
      setDoc(adminRoleRef, profileData).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: adminRoleRef.path,
          operation: 'write',
          requestResourceData: profileData,
        }));
      });

      toast({ 
        title: "Super Admin Creado", 
        description: "La cuenta ha sido configurada con privilegios totales." 
      });
      
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Error de configuración", 
        description: error.message || "No se pudo crear la cuenta de administrador." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-primary rounded-xl mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración Inicial</h1>
          <p className="text-muted-foreground text-sm">Registre el Administrador Principal del Sistema</p>
        </div>

        <Card className="border-none shadow-xl">
          <form onSubmit={handleSetup}>
            <CardHeader>
              <CardTitle className="text-lg">Credenciales Maestras</CardTitle>
              <CardDescription>Esta cuenta tendrá acceso a todos los reportes y registros.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Ej: Juan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Ej: Pérez" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@institucion.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Crear Administrador Maestro
              </Button>
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Volver al login
              </Link>
            </CardFooter>
          </form>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
          EduTrack • Seguridad de Nivel Institucional
        </p>
      </div>
    </div>
  );
}
