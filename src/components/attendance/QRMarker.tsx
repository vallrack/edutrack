
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, X, Loader2, Upload, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult } from "html5-qrcode";
import { useToast } from '@/hooks/use-toast';

interface QRMarkerProps {
    onMark: (decodedText: string) => void;
}

export const QRMarker: React.FC<QRMarkerProps> = ({ onMark }) => {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const readerId = "reader-institutional";

    useEffect(() => {
        // This effect runs once on mount to initialize the scanner.
        if (typeof window !== 'undefined' && !scannerRef.current) {
            scannerRef.current = new Html5Qrcode(readerId, { verbose: false });
        }

        return () => {
            // Cleanup on unmount.
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    const stopScanner = useCallback(() => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop()
                .then(() => setIsScanning(false))
                .catch(() => setIsScanning(false));
        } else {
            setIsScanning(false);
        }
    }, []);

    const onScanSuccess = useCallback((decodedText: string) => {
        stopScanner();
        onMark(decodedText);
        toast({
            title: "¡QR Escaneado!",
            description: "El registro de asistencia ha sido validado.",
            className: "bg-green-100 border-green-300 text-green-800",
        });
    }, [stopScanner, onMark, toast]);
    
    const onScanFailure = (errorMessage: string) => {
        // This callback is called frequently, so we don't want to spam the state or console.
        // We can add more sophisticated error handling here if needed.
    };

    const startScanner = async () => {
        setError(null);
        setIsScanning(true);

        // Check for camera permissions
        try {
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                throw new Error("No cameras found.");
            }
        } catch(err) {
            setError("No se encontró ninguna cámara. Conecta una o revisa los permisos.");
            setIsScanning(false);
            return;
        }

        if (!scannerRef.current) return;
        
        try {
             await scannerRef.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 }, useBarCodeDetectorIfSupported: true },
                (decodedText: string, result: Html5QrcodeResult) => onScanSuccess(decodedText),
                (errorMessage: string, result: Html5QrcodeResult) => onScanFailure(errorMessage),
            );
        } catch (err: any) {
            console.error("Camera start error:", err);
            let message = "No se pudo iniciar la cámara. Intenta de nuevo o usa un archivo.";
            if(err.name === 'NotReadableError') {
                message = "La cámara ya está en uso por otra aplicación o pestaña."
            } else if (err.name === 'NotAllowedError') {
                message = "El permiso para usar la cámara fue denegado."
            }
            setError(message);
            setIsScanning(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !scannerRef.current) return;
        
        stopScanner();
        setError(null);

        try {
            const decodedText = await scannerRef.current.scanFile(file, false);
            onScanSuccess(decodedText);
        } catch (err) {
            console.error("File scan error:", err);
            setError("No se encontró un código QR válido en la imagen.");
            toast({
                variant: "destructive",
                title: "Error de Lectura",
                description: "La imagen no contiene un QR reconocible.",
            });
        } finally {
             if(fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <Card className="border-dashed border-red-200 bg-red-50 shadow-md rounded-2xl mt-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800"> 
                    <QrCode/> Registro Institucional
                </CardTitle>
                <CardDescription className="text-red-900/80">
                    Escanea el código de la sede para validar tu asistencia.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* The reader element is always in the DOM but hidden */} 
                <div 
                    id={readerId}
                    className="w-full bg-slate-900 rounded-lg overflow-hidden"
                    style={{ display: isScanning ? 'block' : 'none' }}
                />

                {error && (
                    <div className='p-3 bg-red-100 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2'>
                        <AlertCircle className="h-4 w-4"/> {error}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                    {!isScanning ? (
                        <Button onClick={startScanner} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 rounded-xl shadow-lg">
                            <Camera /> Activar Escáner
                        </Button>
                    ) : (
                        <Button onClick={stopScanner} variant="outline" className="w-full h-12 bg-white/50 border-red-200 font-bold flex items-center gap-2 rounded-xl">
                            <X /> Cancelar
                        </Button>
                    )}
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full h-12 bg-white/50 border-red-200 font-bold flex items-center gap-2 rounded-xl" disabled={isScanning}>
                        <Upload className="h-4 w-4"/> Archivo
                    </Button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            </CardContent>
        </Card>
    );
};
