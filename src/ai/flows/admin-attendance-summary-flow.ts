'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating a concise, natural language summary
 * of a teacher's attendance report for a selected period.
 *
 * - adminAttendanceSummary - A function that generates the attendance summary.
 * - AdminAttendanceSummaryInput - The input type for the adminAttendanceSummary function.
 * - AdminAttendanceSummaryOutput - The return type for the adminAttendanceSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define a schema for a single attendance record for clarity
const AttendanceRecordSchema = z.object({
  id: z.string().describe('Unique ID for the attendance record.'),
  date: z.string().describe('The date of the attendance record (YYYY-MM-DD).'),
  time: z.string().describe('The time of the attendance record (HH:MM).'),
  type: z.enum(['entry', 'exit']).describe("Type of attendance: 'entry' for clock-in, 'exit' for clock-out."),
  method: z.enum(['qr', 'manual']).describe("Method of attendance marking: 'qr' or 'manual'."),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional().describe("Optional GPS coordinates captured at the time of marking, if available."),
});

const AdminAttendanceSummaryInputSchema = z.object({
  teacherId: z.string().describe('The unique identifier of the teacher.'),
  teacherName: z.string().describe('The full name of the teacher.'),
  reportPeriod: z.string().describe('A description of the report period (e.g., "from YYYY-MM-DD to YYYY-MM-DD").'),
  attendanceRecords: z.array(AttendanceRecordSchema)
    .describe('A detailed list of attendance records for the teacher during the specified period.'),
});

export type AdminAttendanceSummaryInput = z.infer<typeof AdminAttendanceSummaryInputSchema>;

const AdminAttendanceSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, natural language summary of the teacher\u0027s attendance patterns and any notable issues.'),
});

export type AdminAttendanceSummaryOutput = z.infer<typeof AdminAttendanceSummaryOutputSchema>;

// This intermediate schema is used by the prompt to pass stringified data.
// It's not exported as it's an internal detail for the prompt's input formatting.
const PromptInputSchema = z.object({
  teacherId: z.string(),
  teacherName: z.string(),
  reportPeriod: z.string(),
  attendanceRecordsJson: z.string().describe('A JSON string representation of the attendance records.'),
});

const attendanceSummaryPrompt = ai.definePrompt({
  name: 'attendanceSummaryPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: AdminAttendanceSummaryOutputSchema },
  prompt: `You are an expert attendance analyst. Your task is to provide a concise, natural language summary of a teacher's attendance report.\n\nAnalyze the provided attendance records for {{teacherName}} (ID: {{teacherId}}) for the period {{reportPeriod}}.\n\nFocus on identifying patterns and notable issues such as:\n- Overall punctuality (on-time, late entries, early exits).\n- Consistency of attendance.\n- Frequency of manual markings vs. QR scans.\n- Any unusual gaps or discrepancies in entry/exit pairings.\n- General observations about their attendance behavior.\n\nDo NOT attempt to calculate total hours worked; focus purely on qualitative summary and patterns.\n\nAttendance Records (JSON format):\n{{{attendanceRecordsJson}}}\n\nSummary:`,
});

const adminAttendanceSummaryFlow = ai.defineFlow(
  {
    name: 'adminAttendanceSummaryFlow',
    inputSchema: AdminAttendanceSummaryInputSchema,
    outputSchema: AdminAttendanceSummaryOutputSchema,
  },
  async (input) => {
    // Stringify the attendance records before passing to the prompt to ensure logic-less Handlebars usage.
    const promptInput = {
      ...input,
      attendanceRecordsJson: JSON.stringify(input.attendanceRecords),
    };
    const { output } = await attendanceSummaryPrompt(promptInput);
    return output!;
  }
);

export async function adminAttendanceSummary(input: AdminAttendanceSummaryInput): Promise<AdminAttendanceSummaryOutput> {
  return adminAttendanceSummaryFlow(input);
}
