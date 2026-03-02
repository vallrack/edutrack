
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCode, Scan, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRMarkerProps {
  onMark: (type: 'entry' | 'exit', location?: { latitude: number, longitude: number }) => void;
}

export function QRMarker({ onMark }: QRMarkerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => toast({ variant: "destructive", title: "Error de ubicación", description: "Es obligatorio activar el GPS para marcar." })
      );
    }
  }, [toast]);

  const handleScan = () => {
    if (!location) {
      toast({ variant: "destructive", title: "Ubicación requerida", description: "Esperando señal GPS..." });
      return;
    }

    setIsScanning(true);
    // Simulate server-side QR validation via Cloud Functions
    setTimeout(() => {
      setIsScanning(false);
      setIsMarked(true);
      onMark('entry', location);
      toast({ title: "¡Marcado exitoso!", description: "Entrada registrada mediante QR dinámico." });
      
      setTimeout(() => setIsMarked(false), 3000);
    }, 1500);
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <QrCode className="h-32 w-32" />
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Registro Rápido
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Escanea el código QR de la institución para marcar tu jornada.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center gap-4">
        <div className="w-full max-w-[200px] aspect-square bg-white rounded-2xl p-4 flex items-center justify-center shadow-lg relative overflow-hidden group">
          {isScanning ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-[10px] text-primary mt-2 font-bold">VALIDANDO...</p>
            </div>
          ) : isMarked ? (
            <div className="flex flex-col items-center text-green-500 scale-110 transition-transform">
              <CheckCircle2 className="h-16 w-16" />
              <p className="text-[10px] mt-2 font-bold">¡LISTO!</p>
            </div>
          ) : (
            <>
              <QrCode className="h-full w-full text-slate-200" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 flex items-center justify-center transition-colors">
                 <div className="w-full h-[2px] bg-primary/50 absolute top-1/2 left-0 -translate-y-1/2 animate-bounce" />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs bg-black/20 px-3 py-1.5 rounded-full">
          <MapPin className="h-3 w-3" />
          {location ? `Ubicación: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Obteniendo coordenadas..."}
        </div>

        <Button 
          onClick={handleScan} 
          disabled={isScanning || isMarked || !location}
          className="w-full bg-white text-primary hover:bg-white/90 font-bold"
        >
          {isScanning ? "Procesando..." : "Escanear QR"}
        </Button>
      </CardContent>
    </Card>
  );
}
