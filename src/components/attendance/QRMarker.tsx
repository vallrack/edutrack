
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCode, Scan, CheckCircle2, MapPin, Loader2, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

interface QRMarkerProps {
  onMark: (type: 'entry' | 'exit', location?: { latitude: number, longitude: number }) => void;
}

export function QRMarker({ onMark }: QRMarkerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => toast({ variant: "destructive", title: "GPS Desactivado", description: "Es necesario activar la ubicación." })
      );
    }

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!location) {
      toast({ variant: "destructive", title: "Ubicación requerida", description: "Esperando señal GPS..." });
      return;
    }

    setShowScanner(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("dashboard-scanner");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => {
            stopScanner();
            handleScanSuccess(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Scanner error:", err);
        setShowScanner(false);
        toast({ variant: "destructive", title: "Error de cámara", description: "No se pudo iniciar el escáner." });
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Stop error:", err);
      }
    }
    setShowScanner(false);
  };

  const handleScanSuccess = (data: string) => {
    setIsMarked(true);
    onMark('entry', location!);
    toast({ title: "Marcado exitoso" });
    setTimeout(() => setIsMarked(false), 3000);
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <QrCode className="h-32 w-32" />
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Registro Institucional
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Escanea el código de la sede para validar tu asistencia.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center gap-4">
        <div className="w-full max-w-[240px] aspect-square bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg relative overflow-hidden">
          {showScanner ? (
            <div id="dashboard-scanner" className="w-full h-full bg-black rounded-xl"></div>
          ) : isMarked ? (
            <div className="flex flex-col items-center text-green-500 animate-in zoom-in-95">
              <CheckCircle2 className="h-16 w-16" />
              <p className="text-[10px] mt-2 font-black">REGISTRO EXITOSO</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <QrCode className="h-20 w-20 text-slate-200" />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Listo para escanear</p>
            </div>
          )}
          
          {showScanner && (
            <button 
              onClick={stopScanner}
              className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/40 rounded-full z-20 backdrop-blur-sm"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] bg-black/20 px-3 py-1.5 rounded-full font-bold">
          <MapPin className="h-3 w-3" />
          {location ? `UBICACIÓN: ${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : "OBTENIENDO GPS..."}
        </div>

        {!showScanner ? (
          <Button 
            onClick={startScanner} 
            disabled={isMarked || !location}
            className="w-full bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest h-12 rounded-xl"
          >
            <Camera className="h-4 w-4" /> Activar Escáner
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter opacity-70">
            <Loader2 className="h-3 w-3 animate-spin" /> Buscando código QR...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
