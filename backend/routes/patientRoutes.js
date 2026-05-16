// routes/patientRoutes.js
import express from "express";
import protectPatient from "../middleware/authMiddleware.js";
import Patient from "../models/Patient.js";
import {
  registerPatient,
  loginPatient,
  getPatientProfile,
  linkCaretaker,
  unlinkCaretaker,
  getAllCaretakersForPatient,
  requestCaretaker,
  getPendingCaretakerRequests,
  getLinkedDoctorsForPatient,
  getPendingDoctorRequests,
  requestDoctor,
  recordDailyCheckin,
  addMedication,
  removeMedication,
  getMedicationRecords,
  markMedicationAsTaken,
  markMedicationAsMissed,
  sendSOSAlert
} from "../controllers/patientController.js";

const router = express.Router();

/* ----------------------------
   Authentication Routes
----------------------------- */

// Register a new patient
router.post("/signup", registerPatient);

// Login patient
router.post("/login", loginPatient);

/* ----------------------------
   Protected Patient Routes
----------------------------- */

// Get patient profile
router.get("/profile", protectPatient, getPatientProfile);

// Get patient dashboard
router.get("/dashboard", protectPatient, async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id)
      .populate("scheduledVisits.doctorId", "fullName specialization hospitalName");
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Format scheduledVisits as appointments to match frontend expectations
    const appointments = (patient.scheduledVisits || []).map(visit => ({
      _id: visit._id,
      doctorId: visit.doctorId?._id || visit.doctorId,
      doctorName: visit.doctorId?.fullName || 'Unknown Doctor',
      date: visit.date,
      time: visit.time,
      purpose: visit.purpose || '',
      notes: visit.notes || '',
      status: visit.status || 'upcoming'
    }));
    
    res.json({ 
      success: true, 
      medications: patient.medications || [],
      appointments: appointments, // Frontend expects 'appointments' not 'scheduledVisits'
      scheduledVisits: patient.scheduledVisits || [], // Keep for backward compatibility
      fullName: patient.fullName,
      healthScore: patient.healthScore || 70
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

/* ----------------------------
   Caretaker Management
----------------------------- */

// Link a caretaker to patient
router.post("/link-caretaker", protectPatient, linkCaretaker);

// Unlink a caretaker from patient
router.post("/unlink-caretaker", protectPatient, unlinkCaretaker);

// Get all linked caretakers
router.get("/caretakers", protectPatient, getAllCaretakersForPatient);

// Request a caretaker
router.post("/request-caretaker", protectPatient, requestCaretaker);

// Get pending caretaker requests
router.get("/pending-caretakers", protectPatient, getPendingCaretakerRequests);

/* ----------------------------
   Doctor Management
----------------------------- */

// Get linked doctors
router.get("/doctors", protectPatient, getLinkedDoctorsForPatient);

// Get pending doctor requests
router.get("/pending-doctors", protectPatient, getPendingDoctorRequests);

// Request a doctor
router.post("/request-doctor", protectPatient, requestDoctor);

/* ----------------------------
   Health Management
----------------------------- */

// Record daily check-in
router.post("/daily-checkin", protectPatient, recordDailyCheckin);

// Add medication
router.post("/medications", protectPatient, addMedication);

// Remove medication
router.delete("/medications/:medicationId", protectPatient, removeMedication);

// Get medication records
router.get("/medication-records", protectPatient, getMedicationRecords);

// Mark medication as taken
router.patch("/medication-records/:recordId/taken", protectPatient, markMedicationAsTaken);

// Mark medication as missed
router.patch("/medication-records/:recordId/missed", protectPatient, markMedicationAsMissed);

/* ----------------------------
   Emergency SOS Alert
----------------------------- */

// Send SOS alert to linked caretakers
router.post("/sos-alert", protectPatient, sendSOSAlert);

export default router;