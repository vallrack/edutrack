
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useFirebase } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc, serverTimestamp, limit } from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Loader2, CheckCircle2, XCircle, Clock, MapPin, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function PublicScanPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  async function onScanSuccess(decodedText: string) {
    if (processing) return;
    setProcessing(true);
    setError(null);

    try {
      const data = JSON.parse(decodedText);
      if (!data.id) throw new Error("QR inválido: No se encontró ID del docente.");

      // 1. Fetch Teacher Profile
      const teacherRef = doc(firestore, 'userProfiles', data.id);
      const teacherSnap = await getDoc(teacherRef);

      if (!teacherSnap.exists()) {
        throw new Error("Docente no encontrado en la base de datos.");
      }

      const teacher = teacherSnap.data();
      const now = new Date();
      const currentDay = now.getDay();
      const todayStr = format(now, 'yyyy-MM-dd');

      // 2. Fetch Teacher Shifts
      const shifts: any[] = [];
      for (const sid of (teacher.shiftIds || [])) {
        const sSnap = await getDoc(doc(firestore, 'shifts', sid));
        if (sSnap.exists()) shifts.push({ ...sSnap.data(), id: sSnap.id });
      }

      // 3. Find applicable shift for today
      const todayShift = shifts.find(s => s.days?.includes(currentDay));

      if (!todayShift) {
        throw new Error(`El docente no tiene jornadas programadas para hoy (${format(now, 'EEEE')}).`);
      }

      // 4. Mark Attendance
      const recordsRef = collection(firestore, 'userProfiles', teacher.id, 'attendanceRecords');
      const todayQuery = query(recordsRef, where('date', '==', todayStr), where('shiftId', '==', todayShift.id), limit(1));
      const querySnapshot = await getDocs(todayQuery);

      let status = "";
      const attendanceData: any = {
        userId: teacher.id,
        shiftId: todayShift.id,
        date: todayStr,
        updatedAt: serverTimestamp()
      };

      if (querySnapshot.empty) {
        // Create Entry
        attendanceData.entryDateTime = now.toISOString();
        attendanceData.entryMethod = 'qr-public';
        attendanceData.createdAt = serverTimestamp();
        await addDoc(recordsRef, attendanceData);
        status = "ENTRADA REGISTRADA";
      } else {
        const existingRecord = querySnapshot.docs[0].data();
        if (existingRecord.exitDateTime) {
          throw new Error("Ya se ha registrado la salida para esta jornada hoy.");
        }
        // Update Exit
        attendanceData.exitDateTime = now.toISOString();
        attendanceData.exitMethod = 'qr-public';
        await setDoc(doc(recordsRef, querySnapshot.docs[0].id), attendanceData, { merge: true });
        status = "SALIDA REGISTRADA";
      }

      setLastResult({
        teacher: `${teacher.firstName} ${teacher.lastName}`,
        shift: todayShift.name,
        time: format(now, 'HH:mm'),
        status
      });

      toast({ title: status, description: `${teacher.firstName} ${teacher.lastName} - ${todayShift.name}` });

      // Reset scanner after 5 seconds
      setTimeout(() => {
        setLastResult(null);
        setProcessing(false);
      }, 5000);

    } catch (err: any) {
      setError(err.message || "Error al procesar el código.");
      setProcessing(false);
      setTimeout(() => setError(null), 4000);
    }
  }

  function onScanFailure(error: any) {
    // Silently handle scan failures (usually just "no QR found in frame")
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-12 w-60 md:h-16 md:w-72">
            <Image 
              src="https://ciudaddonbosco.org/wp-content/uploads/2025/07/CIUDAD-DON-BOSCO_CABECERA-04-1024x284.png" 
              alt="Ciudad Don Bosco" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Estación de Marcaje QR</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Punto de Control Institucional</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary text-white p-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" /> ESCÁNER ACTIVO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div id="reader" className="w-full"></div>
              {processing && !lastResult && !error && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-xs font-black text-primary uppercase">Procesando Identidad...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {lastResult ? (
              <Card className="border-none shadow-2xl bg-green-50 border-2 border-green-200 rounded-3xl animate-in zoom-in-95 duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-green-900 uppercase tracking-tight">{lastResult.status}</h3>
                    <p className="text-sm font-bold text-green-700 mt-1">{lastResult.teacher}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-green-200">
                    <div>
                      <p className="text-[10px] font-black text-green-400 uppercase">Jornada</p>
                      <p className="text-xs font-bold text-green-800 uppercase">{lastResult.shift}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-green-400 uppercase">Hora</p>
                      <p className="text-xs font-bold text-green-800 uppercase">{lastResult.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-none shadow-2xl bg-red-50 border-2 border-red-200 rounded-3xl animate-in shake duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-red-900 uppercase tracking-tight">ERROR DE MARCAJE</h3>
                    <p className="text-xs font-bold text-red-700 mt-2 leading-relaxed">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-xl bg-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-md font-black uppercase text-slate-800">Instrucciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">1</div>
                    <p className="text-xs text-slate-600 leading-relaxed">Presente el código QR de su <b>Carnet Digital</b> frente a la cámara.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">2</div>
                    <p className="text-xs text-slate-600 leading-relaxed">Asegúrese de que el brillo de su celular sea alto para una lectura óptima.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">3</div>
                    <p className="text-xs text-slate-600 leading-relaxed">El sistema registrará su <b>entrada</b> o <b>salida</b> según su horario actual.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full h-12 gap-2 font-bold rounded-2xl border-slate-200">
                  <ArrowLeft className="h-4 w-4" /> Volver al Inicio
                </Button>
              </Link>
              <div className="flex justify-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="h-3 w-3" /> {format(new Date(), 'HH:mm')}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  <MapPin className="h-3 w-3" /> SEDE CENTRAL
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
