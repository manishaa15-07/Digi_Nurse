import express from "express";
import {
   addPatientDirectly,
   approvePatientRequest,
   rejectPatientRequest,
   getAllPatientsForCaretaker,
   getCaretakerProfile,
   getPendingPatientRequests,
   linkPatient,
   loginCaretaker,
   registerCaretaker,
   unlinkPatient,
   findPatientByPatientID
} from "../controllers/caretakerController.js";
import protectCaretaker from "../middleware/authCaretaker.js";

const router = express.Router();

/* ----------------------------
   Authentication Routes
----------------------------- */

// Register a new caretaker
router.post("/signup", registerCaretaker);

// Login caretaker
router.post("/login", loginCaretaker);

/* ----------------------------
   Protected Caretaker Routes
----------------------------- */

// Get caretaker profile
router.get("/profile", protectCaretaker, getCaretakerProfile);

// Link a patient to caretaker
router.post("/link-patient", protectCaretaker, linkPatient);

// Unlink a patient from caretaker
router.post("/unlink-patient", protectCaretaker, unlinkPatient);

// Get all linked patients of a caretaker
router.get("/:caretakerId/patients", protectCaretaker, getAllPatientsForCaretaker);

router.post("/approve-patient", protectCaretaker, approvePatientRequest);
router.post("/reject-patient", protectCaretaker, rejectPatientRequest);
router.post("/add-patient", protectCaretaker, addPatientDirectly);
router.get("/pending-patients", protectCaretaker, getPendingPatientRequests);

// Find patient by patientID (for linking)
router.get("/patient/:patientId", protectCaretaker, findPatientByPatientID);

export default router;