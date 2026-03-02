
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { adminAttendanceSummary } from "@/ai/flows/admin-attendance-summary-flow";
import { AttendanceRecord } from "@/lib/types";

interface AdminAttendanceSummaryProps {
  attendance: AttendanceRecord[];
}

export function AdminAttendanceSummary({ attendance }: AdminAttendanceSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      // For demo, we just pick the first teacher or a general overview
      const teacherRecords = attendance.filter(a => a.userId === 'u1');
      const result = await adminAttendanceSummary({
        teacherId: 'u1',
        teacherName: 'Dr. Sarah Wilson',
        reportPeriod: 'Últimos 30 días',
        attendanceRecords: teacherRecords.map(r => ({
          id: r.id,
          date: r.date,
          time: r.time,
          type: r.type,
          method: r.method,
          location: r.location
        }))
      });
      setSummary(result.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-lg bg-secondary/50 border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Análisis de Patrones (AI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground animate-pulse">Analizando registros con GenAI...</p>
          </div>
        ) : summary ? (
          <div className="bg-white rounded-lg p-4 text-sm leading-relaxed border shadow-inner">
            {summary}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Genera un resumen inteligente de los patrones de asistencia de este periodo.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 border-primary/20 hover:bg-primary/5"
          onClick={generateSummary}
          disabled={loading}
        >
          {summary ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {summary ? 'Regenerar Resumen' : 'Generar Resumen AI'}
        </Button>
      </CardFooter>
    </Card>
  );
}
