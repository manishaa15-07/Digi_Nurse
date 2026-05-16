import express from "express";
import {
   registerDoctor,
   loginDoctor,
   getDoctorProfile,
   getDoctorProfileById,
   getAllPatientsForDoctor,
   getPendingPatientRequests,
   approvePatientRequest,
   rejectPatientRequest,
   linkPatient,
   unlinkPatient,
   addMedicationToPatient,
   removeMedicationFromPatient,
   addScheduledVisitToPatient,
   removeScheduledVisitFromPatient,
   getDoctorAppointments
} from "../controllers/doctorController.js";

import protectDoctor from "../middleware/authDoctor.js";

const router = express.Router();

/* ----------------------------
   Authentication Routes
----------------------------- */

// Register a new doctor
router.post("/signup", registerDoctor);

// Login doctor
router.post("/login", loginDoctor);

/* ----------------------------
   Protected Doctor Routes
----------------------------- */

// Get doctor profile
router.get("/profile", protectDoctor, getDoctorProfile);

// Get doctor profile by ID (for auto-login after signup)
router.get("/profile-by-id/:doctorId", getDoctorProfileById);

// Link a patient to doctor
router.post("/link-patient", protectDoctor, linkPatient);

// Unlink a patient from doctor
router.post("/unlink-patient", protectDoctor, unlinkPatient);

// Get all linked patients of a doctor
router.get("/:doctorId/patients", protectDoctor, getAllPatientsForDoctor);

// Approve a patient request
router.post("/approve-patient", protectDoctor, approvePatientRequest);

// Reject a patient request
router.post("/reject-patient", protectDoctor, rejectPatientRequest);

// Get all pending patient requests
router.get("/pending-patients", protectDoctor, getPendingPatientRequests);

/* ----------------------------
   Medication Management
----------------------------- */

// Add medication to a patient
router.post("/patient/:patientId/add-medication", protectDoctor, addMedicationToPatient);

// Remove medication from a patient
router.delete("/patient/:patientId/remove-medication/:medicationId", protectDoctor, removeMedicationFromPatient);

/* ----------------------------
   Scheduled Visit Management
----------------------------- */

// Add scheduled visit for a patient
router.post("/patient/:patientId/add-visit", protectDoctor, addScheduledVisitToPatient);

// Remove scheduled visit from a patient
router.delete("/patient/:patientId/remove-visit/:visitId", protectDoctor, removeScheduledVisitFromPatient);

// Get doctor's appointments
router.get("/appointments", protectDoctor, getDoctorAppointments);

export default router;