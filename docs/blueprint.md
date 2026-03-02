# **App Name**: EduTrack Attendance

## Core Features:

- User Authentication and Role Management: Allow teachers, coordinators, and administrators to register and log in using email or Firebase Authentication. Distinguish access levels based on user roles (teacher, coordinator, admin).
- QR Code Attendance Marking: Generate a dynamic QR code for teachers to scan with their devices for clocking in/out, securely validating via a server-side tool using Cloud Functions to prevent tampering.
- Manual Attendance Oversight: Provide a coordinator/admin interface to view a list of teachers and manually mark their attendance ('Cumplió Jornada') if QR scanning was not possible, with editing capabilities.
- Geolocation Verification: Capture and store the GPS coordinates during each attendance mark to verify the teacher's physical presence at the institution.
- Attendance History View: Enable users to view their personal attendance history (teachers) or all attendance records (coordinators/admins), with filtering options by date range (weekly, bi-weekly, monthly) from Firestore.
- Automated Report Generation Tool: Allow administrators to generate and export reports (PDF for viewing, Excel/CSV for administrative processes) detailing accumulated hours per teacher. This tool will automatically calculate total hours from attendance records using Cloud Functions.

## Style Guidelines:

- Primary color: A deep, professional blue-violet (#4747D1) to convey stability and academic focus. (HSL: H=240, S=60%, L=55%)
- Background color: A very light, almost white, subtle blue-violet (#F0F0F4) for a clean, unobtrusive canvas. (HSL: H=240, S=15%, L=95%)
- Accent color: A vibrant, slightly brighter blue (#5E9EEF) for call-to-action buttons and interactive elements, providing clear contrast. (HSL: H=210, S=80%, L=65%)
- Body and headline font: 'Inter', a modern sans-serif, for clear and objective readability across all text content and data displays.
- Utilize simple, professional, and easily recognizable line icons that align with educational and administrative themes to ensure intuitive navigation and data representation.
- Implement a clean, structured, and responsive layout, prioritizing data readability and efficient navigation. Key information should be immediately accessible, with forms and lists clearly organized, adapting seamlessly across mobile and desktop devices.
- Incorporate subtle, functional animations to provide visual feedback for user actions such as successful QR scans, form submissions, and data loading, enhancing user experience without distraction.