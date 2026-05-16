// controllers/patientController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Caretaker from "../models/Caretaker.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import MedicationRecord from "../models/MedicationRecord.js";
import Alert from "../models/Alert.js";

// /* ------------------- Helper: Generate JWT ------------------- */
// const generateToken = (id) => {
//   if (!process.env.JWT_SECRET) {
//     throw new Error("JWT_SECRET is not defined in environment variables");
//   }
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
// };

// /* ------------------- Helper: Generate Unique Patient ID ------------------- */
// const generatePatientID = async () => {
//   const randomNum = Math.floor(10000 + Math.random() * 90000);
//   return `PT${randomNum}`;
// };

// /* ------------------- Register Patient ------------------- */
// export const registerPatient = async (req, res) => {
//   try {
//     console.log("[RegisterPatient] Incoming body keys:", Object.keys(req.body || {}));
//     const {
//       fullName,
//       dob,
//       gender,
//       contact,
//       emergencyContact,
//       email,
//       password,
//       allergies,
//       conditions,
//       medications,
//       smoking,
//       drinking,
//       activity,
//       consentToShare,
//     } = req.body;

//     // Check if patient already exists
//     const existing = await Patient.findOne({ email });
//     if (existing) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Generate unique patient ID
//     let patientID = await generatePatientID();
//     while (await Patient.findOne({ patientID })) {
//       patientID = await generatePatientID();
//     }

//     // Create patient document
//     const newPatient = new Patient({
//       fullName,
//       dob,
//       gender,
//       contact,
//       emergencyContact,
//       email,
//       password: hashedPassword,
//       allergies,
//       conditions,
//       medications,
//       smoking,
//       drinking,
//       activity,
//       consentToShare,
//       patientID,
//     });

//     await newPatient.save();

//     res.status(201).json({
//       message: "Patient registered successfully",
//       patientID: newPatient.patientID,
//     });
//   } catch (error) {
//     console.error("[RegisterPatient] Error:", error?.message);
//     res.status(500).json({ message: "Server error during registration" });
//   }
// };

// /* ------------------- Login Patient ------------------- */
// export const loginPatient = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if patient exists
//     const patient = await Patient.findOne({ email });
//     if (!patient) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Compare password
//     const isMatch = await bcrypt.compare(password, patient.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Return token + patient info
//     res.json({
//       _id: patient._id,
//       fullName: patient.fullName,
//       email: patient.email,
//       patientID: patient.patientID,
//       token: generateToken(patient._id),
//     });
//   } catch (error) {
//     console.error("[LoginPatient] Error:", error?.message);
//     res.status(500).json({ message: "Server error during login" });
//   }
// };

// /* ------------------- Get Patient Profile ------------------- */
// export const getPatientProfile = async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.patient.id)
//       .select("-password")
//       .populate("linkedCaretakers", "fullName email contact professionalRole caretakerId");
//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }
//     res.json(patient);
//   } catch (error) {
//     console.error("[GetPatientProfile] Error:", error?.message);
//     res.status(500).json({ message: "Server error fetching profile" });
//   }
// };

// /* ------------------- Link Caretaker ------------------- */
// export const linkCaretaker = async (req, res) => {
//   try {
//     const { caretakerId } = req.body;
//     const patient = await Patient.findById(req.patient.id);
//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const caretaker = await Caretaker.findOne({ caretakerId });
//     if (!caretaker) {
//       return res.status(404).json({ message: "Caretaker not found" });
//     }

//     // Avoid duplicates
//     if (patient.linkedCaretakers.includes(caretaker._id)) {
//       return res.status(400).json({ message: "Caretaker already linked" });
//     }

//     // Link both sides
//     patient.linkedCaretakers.push(caretaker._id);
//     caretaker.linkedPatients.push(patient._id);

//     await patient.save();
//     await caretaker.save();

//     res.status(200).json({ message: "Caretaker linked successfully" });
//   } catch (error) {
//     console.error("[LinkCaretaker] Error:", error?.message);
//     res.status(500).json({ message: "Server error linking caretaker" });
//   }
// };

// /* ------------------- Unlink Caretaker ------------------- */
// export const unlinkCaretaker = async (req, res) => {
//   try {
//     console.log("[UnlinkCaretaker] Request body:", req.body);
//     console.log("[UnlinkCaretaker] Patient ID from token:", req.patient.id);

//     const { caretakerId } = req.body;
//     const patient = await Patient.findById(req.patient.id);

//     if (!patient) {
//       console.log("[UnlinkCaretaker] Error: Patient not found");
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     // Find caretaker by MongoDB _id (not caretakerId field)
//     const caretaker = await Caretaker.findById(caretakerId);

//     if (!caretaker) {
//       console.log("[UnlinkCaretaker] Error: Caretaker not found");
//       return res.status(404).json({ message: "Caretaker not found" });
//     }

//     console.log("[UnlinkCaretaker] Patient found:", patient.fullName);
//     console.log("[UnlinkCaretaker] Caretaker found:", caretaker.fullName);

//     console.log("[UnlinkCaretaker] Before unlinking:");
//     console.log("[UnlinkCaretaker] Patient linked caretakers:", patient.linkedCaretakers);
//     console.log("[UnlinkCaretaker] Caretaker linked patients:", caretaker.linkedPatients);

//     // Remove from both sides
//     patient.linkedCaretakers = patient.linkedCaretakers.filter(
//       (id) => id.toString() !== caretakerId
//     );
//     caretaker.linkedPatients = caretaker.linkedPatients.filter(
//       (id) => id.toString() !== patient._id.toString()
//     );

//     console.log("[UnlinkCaretaker] After unlinking:");
//     console.log("[UnlinkCaretaker] Patient linked caretakers:", patient.linkedCaretakers);
//     console.log("[UnlinkCaretaker] Caretaker linked patients:", caretaker.linkedPatients);

//     await patient.save();
//     await caretaker.save();

//     console.log("[UnlinkCaretaker] Success: Caretaker unlinked from patient");
//     res.status(200).json({ message: "Caretaker unlinked successfully" });
//   } catch (error) {
//     console.error("[UnlinkCaretaker] Error:", error?.message);
//     res.status(500).json({ message: "Server error unlinking caretaker" });
//   }
// };

// /* ------------------- Get All Linked Caretakers ------------------- */
// export const getAllCaretakersForPatient = async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.patient.id)
//       .populate("linkedCaretakers", "fullName email contact professionalRole caretakerId");
//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }
//     res.status(200).json({ caretakers: patient.linkedCaretakers });
//   } catch (error) {
//     console.error("[GetAllCaretakersForPatient] Error:", error?.message);
//     res.status(500).json({ message: "Server error fetching caretakers" });
//   }
// };
// export const requestCaretaker = async (req, res) => {
//   try {
//     console.log("[RequestCaretaker] Request body:", req.body);
//     console.log("[RequestCaretaker] Patient ID from token:", req.patient.id);

//     const { caretakerId } = req.body;
//     console.log("[RequestCaretaker] Looking for caretaker with ID:", caretakerId);

//     const patient = await Patient.findById(req.patient.id);
//     console.log("[RequestCaretaker] Patient found:", patient ? patient.fullName : "Not found");

//     const caretaker = await Caretaker.findOne({ caretakerId });
//     console.log("[RequestCaretaker] Caretaker found:", caretaker ? caretaker.fullName : "Not found");
//     console.log("[RequestCaretaker] Caretaker ID in DB:", caretaker ? caretaker.caretakerId : "N/A");

//     if (!patient || !caretaker) {
//       console.log("[RequestCaretaker] Error: Patient or caretaker not found");
//       return res.status(404).json({ message: "Patient or caretaker not found" });
//     }

//     console.log("[RequestCaretaker] Checking existing requests...");
//     console.log("[RequestCaretaker] Patient pending requests:", patient.pendingCaretakerRequests);
//     console.log("[RequestCaretaker] Patient linked caretakers:", patient.linkedCaretakers);

//     if (
//       patient.pendingCaretakerRequests.includes(caretaker._id) ||
//       patient.linkedCaretakers.includes(caretaker._id)
//     ) {
//       console.log("[RequestCaretaker] Error: Already requested or linked");
//       return res.status(400).json({ message: "Already requested or linked" });
//     }

//     console.log("[RequestCaretaker] Adding to pending lists...");
//     // Add to pending lists
//     patient.pendingCaretakerRequests.push(caretaker._id);
//     caretaker.pendingPatientRequests.push(patient._id);

//     await patient.save();
//     await caretaker.save();

//     console.log("[RequestCaretaker] Success: Request sent to caretaker");
//     res.status(200).json({ message: "Request sent to caretaker" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error sending request" });
//   }
// };

// /* ------------------- Search Patient By Public patientID (for caretakers) ------------------- */
// export const findPatientByPatientID = async (req, res) => {
//   try {
//     const { patientID } = req.params;
//     if (!patientID) {
//       return res.status(400).json({ message: "patientID is required" });
//     }

//     const patient = await Patient.findOne({ patientID }).select(
//       "fullName patientID dob contact conditions medications"
//     );

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     return res.status(200).json({ patient });
//   } catch (error) {
//     console.error("[FindPatientByPatientID] Error:", error?.message);
//     return res.status(500).json({ message: "Server error searching patient" });
//   }
// };
// // controllers/patientController.js
// // ... other imports above
// import mongoose from "mongoose";

// const resolveReqPatientId = (req) => {
//   // Try several common shapes: req.patient._id, req.patient.id, req.patient (string), req.patientId
//   if (!req.patient) return null;
//   if (typeof req.patient === "string" || req.patient instanceof mongoose.Types.ObjectId) {
//     return req.patient.toString();
//   }
//   if (req.patient._id) return req.patient._id.toString();
//   if (req.patient.id) return req.patient.id.toString();
//   if (req.patient.patientID) return req.patient.patientID; // unlikely, but safe
//   return null;
// };

// export const getPendingCaretakerRequests = async (req, res) => {
//   try {
//     const patientId = resolveReqPatientId(req);
//     console.log("[GetPendingCaretakerRequests] resolved patientId:", patientId);

//     if (!patientId) {
//       return res.status(400).json({ message: "Unable to resolve authenticated patient id" });
//     }

//     // Use findById and populate the caretakers
//     const patient = await Patient.findById(patientId).populate(
//       "pendingCaretakerRequests",
//       "fullName email contact professionalRole caretakerId specializations"
//     );

//     if (!patient) {
//       console.warn("[GetPendingCaretakerRequests] patient not found for id:", patientId);
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     // Ensure we always return an array
//     const requests = Array.isArray(patient.pendingCaretakerRequests)
//       ? patient.pendingCaretakerRequests
//       : [];

//     console.log(
//       `[GetPendingCaretakerRequests] found ${requests.length} pending caretakers for patient ${patientId}`
//     );

//     return res.status(200).json({ requests });
//   } catch (error) {
//     console.error("[GetPendingCaretakerRequests] Error:", error);
//     return res.status(500).json({ message: "Error fetching pending requests" });
//   }
// };






/* ------------------- Helper: Generate JWT ------------------- */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/* ------------------- Helper: Generate Unique Patient ID ------------------- */
const generatePatientID = async () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PT${randomNum}`;
};

/* ------------------- Register Patient ------------------- */
export const registerPatient = async (req, res) => {
  try {
    console.log("[RegisterPatient] Incoming body keys:", Object.keys(req.body || {}));
    const {
      fullName,
      dob,
      gender,
      contact,
      emergencyContact,
      email,
      password,
      allergies,
      conditions,
      medications,
      smoking,
      drinking,
      activity,
      consentToShare,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !contact) {
      return res.status(400).json({
        message: "Missing required fields: fullName, email, password, and contact are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if patient already exists
    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique patient ID
    let patientID = await generatePatientID();
    let attempts = 0;
    while (await Patient.findOne({ patientID }) && attempts < 10) {
      patientID = await generatePatientID();
      attempts++;
    }

    if (attempts >= 10) {
      return res.status(500).json({ message: "Unable to generate unique patient ID" });
    }

    // Create patient document
    const newPatient = new Patient({
      fullName,
      dob,
      gender,
      contact,
      emergencyContact,
      email,
      password: hashedPassword,
      allergies: allergies || [],
      conditions: conditions || [],
      medications: medications || [],
      smoking,
      drinking,
      activity,
      consentToShare: consentToShare || false,
      patientID,
    });

    await newPatient.save();

    console.log("[RegisterPatient] Successfully created patient:", newPatient.patientID);
    const token = generateToken(newPatient._id);
    res.status(201).json({
      message: "Patient registered successfully",
      patientID: newPatient.patientID,
      token, // send token for auto-login
    });
  } catch (error) {
    console.error("[RegisterPatient] Error:", error?.message);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field value. Email or Patient ID already exists."
      });
    }

    res.status(500).json({ message: "Server error during registration" });
  }
};

/* ------------------- Login Patient ------------------- */
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(patient._id);

    console.log("[LoginPatient] Successfully logged in patient:", patient.patientID);

    // Return token + patient info
    res.json({
      _id: patient._id,
      fullName: patient.fullName,
      email: patient.email,
      patientID: patient.patientID,
      token,
    });
  } catch (error) {
    console.error("[LoginPatient] Error:", error?.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

/* ------------------- Get Patient Profile ------------------- */
export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id)
      .select("-password")
      .populate("linkedCaretakers", "fullName email contact professionalRole caretakerId")
      .populate("linkedDoctors", "fullName email contact specialization doctorId")
      .populate("scheduledVisits.doctorId", "fullName specialization hospitalName");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Format response to match frontend expectations
    const response = {
      _id: patient._id,
      fullName: patient.fullName,
      email: patient.email,
      patientID: patient.patientID,
      // Convert medications array to frontend format
      medications: patient.medications ? patient.medications.map(med => ({
        name: med.name,
        time: med.time ? med.time.join(", ") : "Not specified",
        taken: med.status === "taken"
      })) : [],
      // Include scheduled visits with populated doctor information
      scheduledVisits: patient.scheduledVisits || [],
      // Include other patient data
      allergies: patient.allergies || [],
      conditions: patient.conditions || [],
      healthScore: patient.healthScore || 70,
      linkedCaretakers: patient.linkedCaretakers || [],
      linkedDoctors: patient.linkedDoctors || []
    };

    res.json(response);
  } catch (error) {
    console.error("[GetPatientProfile] Error:", error?.message);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// ------------------- Get Linked Doctors for Patient -------------------
export const getLinkedDoctorsForPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id)
      .select('-password')
      .populate('linkedDoctors', 'fullName email contact specialization doctorId');

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    res.status(200).json({ doctors: patient.linkedDoctors || [] });
  } catch (error) {
    console.error('[GetLinkedDoctorsForPatient] Error:', error?.message);
    res.status(500).json({ message: 'Error fetching linked doctors' });
  }
};

// ------------------- Get Pending Doctor Requests for Patient -------------------
export const getPendingDoctorRequests = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id)
      .select('-password')
      .populate('pendingDoctorRequests', 'fullName email contact specialization doctorId');

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    res.status(200).json({ requests: patient.pendingDoctorRequests || [] });
  } catch (error) {
    console.error('[GetPendingDoctorRequests] Error:', error?.message);
    res.status(500).json({ message: 'Error fetching pending doctor requests' });
  }
};

/* ------------------- Link Caretaker ------------------- */
export const linkCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.body;
    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const caretaker = await Caretaker.findOne({ caretakerId });
    if (!caretaker) {
      return res.status(404).json({ message: "Caretaker not found" });
    }

    // Avoid duplicates
    if (patient.linkedCaretakers.includes(caretaker._id)) {
      return res.status(400).json({ message: "Caretaker already linked" });
    }

    // Link both sides
    patient.linkedCaretakers.push(caretaker._id);
    caretaker.linkedPatients.push(patient._id);

    await patient.save();
    await caretaker.save();

    res.status(200).json({ message: "Caretaker linked successfully" });
  } catch (error) {
    console.error("[LinkCaretaker] Error:", error?.message);
    res.status(500).json({ message: "Server error linking caretaker" });
  }
};

/* ------------------- Unlink Caretaker ------------------- */
export const unlinkCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.body;
    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const caretaker = await Caretaker.findOne({ caretakerId });
    if (!caretaker) {
      return res.status(404).json({ message: "Caretaker not found" });
    }

    // Remove from both sides
    patient.linkedCaretakers = patient.linkedCaretakers.filter(
      (id) => id.toString() !== caretaker._id.toString()
    );
    caretaker.linkedPatients = caretaker.linkedPatients.filter(
      (id) => id.toString() !== patient._id.toString()
    );

    await patient.save();
    await caretaker.save();

    res.status(200).json({ message: "Caretaker unlinked successfully" });
  } catch (error) {
    console.error("[UnlinkCaretaker] Error:", error?.message);
    res.status(500).json({ message: "Server error unlinking caretaker" });
  }
};

/* ------------------- Get All Linked Caretakers ------------------- */
export const getAllCaretakersForPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id)
      .populate("linkedCaretakers", "fullName email contact professionalRole caretakerId");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    console.log(`[GetAllCaretakersForPatient] patient id: ${req.patient.id} - linkedCaretakers count: ${
      (patient.linkedCaretakers || []).length
    }`);
    res.status(200).json({ caretakers: patient.linkedCaretakers });
  } catch (error) {
    console.error("[GetAllCaretakersForPatient] Error:", error?.message);
    res.status(500).json({ message: "Server error fetching caretakers" });
  }
};
export const requestCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.body;
    const patient = await Patient.findById(req.patient.id);
    const caretaker = await Caretaker.findOne({ caretakerId });

    if (!patient || !caretaker) {
      return res.status(404).json({ message: "Patient or caretaker not found" });
    }

    if (
      patient.pendingCaretakerRequests.includes(caretaker._id) ||
      patient.linkedCaretakers.includes(caretaker._id)
    ) {
      return res.status(400).json({ message: "Already requested or linked" });
    }

    // Add to pending lists
    patient.pendingCaretakerRequests.push(caretaker._id);
    caretaker.pendingPatientRequests.push(patient._id);

    await patient.save();
    await caretaker.save();

    res.status(200).json({ message: "Request sent to caretaker" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending request" });
  }
};

// ------------------- Request Doctor -------------------
export const requestDoctor = async (req, res) => {
  try {
    console.log('[RequestDoctor] Request body:', req.body);
    console.log('[RequestDoctor] Patient ID from token:', req.patient?.id);
    
    const { doctorId } = req.body;
    if (!doctorId) return res.status(400).json({ message: 'doctorId is required' });

    // allow patient to provide either the public doctorId (doctor.doctorId) or a mongo _id
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    let doctor = null;
    if (isObjectId(doctorId)) {
      console.log('[RequestDoctor] Searching doctor by MongoDB _id:', doctorId);
      doctor = await Doctor.findById(doctorId);
    } else {
      console.log('[RequestDoctor] Searching doctor by doctorId:', doctorId);
      doctor = await Doctor.findOne({ doctorId });
    }

    console.log('[RequestDoctor] Doctor found:', doctor ? doctor.fullName : 'Not found');

    const patient = await Patient.findById(req.patient.id);
    console.log('[RequestDoctor] Patient found:', patient ? patient.fullName : 'Not found');

    if (!doctor || !patient) return res.status(404).json({ message: 'Doctor or patient not found' });

    console.log('[RequestDoctor] Checking existing requests...');
    console.log('[RequestDoctor] Patient pending doctor requests:', patient.pendingDoctorRequests);
    console.log('[RequestDoctor] Patient linked doctors:', patient.linkedDoctors);

    if (patient.pendingDoctorRequests.includes(doctor._id) || patient.linkedDoctors.includes(doctor._id))
      return res.status(400).json({ message: 'Already requested or linked' });

    console.log('[RequestDoctor] Adding to pending lists...');
    patient.pendingDoctorRequests.push(doctor._id);
    doctor.pendingPatientRequests.push(patient._id);

    await patient.save();
    await doctor.save();

    console.log('[RequestDoctor] Success: Request sent to doctor');
    res.status(200).json({ message: 'Request sent to doctor' });
  } catch (error) {
    console.error('[RequestDoctor] Error:', error);
    res.status(500).json({ message: 'Error sending doctor request' });
  }
};

const resolveReqPatientId = (req) => {
  // Try several common shapes: req.patient._id, req.patient.id, req.patient (string), req.patientId
  if (!req.patient) return null;
  if (typeof req.patient === "string" || req.patient instanceof mongoose.Types.ObjectId) {
    return req.patient.toString();
  }
  if (req.patient._id) return req.patient._id.toString();
  if (req.patient.id) return req.patient.id.toString();
  if (req.patient.patientID) return req.patient.patientID; // unlikely, but safe
  return null;
};

export const getPendingCaretakerRequests = async (req, res) => {
  try {
    const patientId = resolveReqPatientId(req);
    console.log("[GetPendingCaretakerRequests] resolved patientId:", patientId);

    if (!patientId) {
      return res.status(400).json({ message: "Unable to resolve authenticated patient id" });
    }

    // Use findById and populate the caretakers
    const patient = await Patient.findById(patientId).populate(
      "pendingCaretakerRequests",
      "fullName email contact professionalRole caretakerId specializations"
    );

    if (!patient) {
      console.warn("[GetPendingCaretakerRequests] patient not found for id:", patientId);
      return res.status(404).json({ message: "Patient not found" });
    }

    // Ensure we always return an array
    const requests = Array.isArray(patient.pendingCaretakerRequests)
      ? patient.pendingCaretakerRequests
      : [];

    console.log(
      `[GetPendingCaretakerRequests] found ${requests.length} pending caretakers for patient ${patientId}`
    );

    return res.status(200).json({ requests });
  } catch (error) {
    console.error("[GetPendingCaretakerRequests] Error:", error);
    return res.status(500).json({ message: "Error fetching pending requests" });
  }
};

// ✅ Record or update today's daily check-in
export const recordDailyCheckin = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const { energyLevel, painLevel, dietQuality, sleepQuality, notes, healthScore } = req.body;

    // Check if already checked in today
    const existingCheckin = patient.dailyCheckins.find((checkin) => {
      const checkinDate = new Date(checkin.date).toISOString().split("T")[0];
      return checkinDate === todayDate;
    });

    if (existingCheckin) {
      // Update existing check-in
      existingCheckin.energyLevel = energyLevel;
      existingCheckin.pain = painLevel;
      existingCheckin.dietQuality = dietQuality;
      existingCheckin.sleepQuality = sleepQuality;
      existingCheckin.notes = notes;
    } else {
      // Add new daily check-in
      patient.dailyCheckins.push({
        date: new Date(),
        energyLevel,
        pain: painLevel,
        dietQuality,
        sleepQuality,
        notes,
      });
    }

    // Update patient’s overall health score
    patient.healthScore = healthScore;

    await patient.save();

    return res.json({ message: "Daily check-in saved successfully", healthScore });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Failed to save check-in" });
  }
};

// ✅ Add medication for patient
export const addMedication = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const { name, dosage, frequency, times, startDate, endDate, instructions } = req.body;

    // Validate required fields
    if (!name || !dosage || !frequency || !startDate) {
      return res.status(400).json({ 
        message: "Name, dosage, frequency, and start date are required" 
      });
    }

    // Create new medication
    const newMedication = {
      name,
      dosage,
      frequency,
      times: times || [],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      instructions: instructions || "",
      addedBy: 'patient',
      isActive: true,
      takenCount: 0,
      missedCount: 0
    };

    patient.medications.push(newMedication);
    await patient.save();

    // Generate medication records for the next 30 days
    await generateMedicationRecords(patient._id, patient.medications[patient.medications.length - 1]._id, newMedication);

    res.status(201).json({ 
      message: "Medication added successfully",
      medication: newMedication
    });
  } catch (error) {
    console.error("[AddMedication] Error:", error?.message);
    res.status(500).json({ message: "Failed to add medication" });
  }
};

// ✅ Remove medication for patient
export const removeMedication = async (req, res) => {
  try {
    const { medicationId } = req.params;
    const patient = await Patient.findById(req.patient.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Find and remove medication
    const medicationIndex = patient.medications.findIndex(
      med => med._id.toString() === medicationId
    );

    if (medicationIndex === -1) {
      return res.status(404).json({ message: "Medication not found" });
    }

    // Remove medication
    patient.medications.splice(medicationIndex, 1);
    await patient.save();

    // Remove related medication records
    await MedicationRecord.deleteMany({ 
      patientId: patient._id, 
      medicationId: medicationId 
    });

    res.status(200).json({ message: "Medication removed successfully" });
  } catch (error) {
    console.error("[RemoveMedication] Error:", error?.message);
    res.status(500).json({ message: "Failed to remove medication" });
  }
};

// ✅ Get medication records for patient
export const getMedicationRecords = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const { startDate, endDate } = req.query;
    let query = { patientId: patient._id };

    if (startDate && endDate) {
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    }

    const records = await MedicationRecord.find(query)
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.status(200).json({ records });
  } catch (error) {
    console.error("[GetMedicationRecords] Error:", error?.message);
    res.status(500).json({ message: "Failed to fetch medication records" });
  }
};

// ✅ Mark medication as taken
export const markMedicationAsTaken = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { notes } = req.body;

    const record = await MedicationRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Medication record not found" });

    // Verify patient owns this record
    if (record.patientId.toString() !== req.patient.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update record
    record.status = 'taken';
    record.takenAt = new Date();
    if (notes) record.notes = notes;

    await record.save();

    // Update medication counts
    const patient = await Patient.findById(req.patient.id);
    const medication = patient.medications.find(
      med => med._id.toString() === record.medicationId.toString()
    );
    
    if (medication) {
      medication.takenCount = (medication.takenCount || 0) + 1;
      await patient.save();
    }

    res.status(200).json({ 
      message: "Medication marked as taken",
      record 
    });
  } catch (error) {
    console.error("[MarkMedicationAsTaken] Error:", error?.message);
    res.status(500).json({ message: "Failed to mark medication as taken" });
  }
};

// ✅ Mark medication as missed
export const markMedicationAsMissed = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { notes } = req.body;

    const record = await MedicationRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Medication record not found" });

    // Verify patient owns this record
    if (record.patientId.toString() !== req.patient.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update record
    record.status = 'missed';
    if (notes) record.notes = notes;

    await record.save();

    // Update medication counts
    const patient = await Patient.findById(req.patient.id);
    const medication = patient.medications.find(
      med => med._id.toString() === record.medicationId.toString()
    );
    
    if (medication) {
      medication.missedCount = (medication.missedCount || 0) + 1;
      await patient.save();
    }

    res.status(200).json({ 
      message: "Medication marked as missed",
      record 
    });
  } catch (error) {
    console.error("[MarkMedicationAsMissed] Error:", error?.message);
    res.status(500).json({ message: "Failed to mark medication as missed" });
  }
};

// ✅ Helper function to generate medication records
const generateMedicationRecords = async (patientId, medicationId, medication) => {
  try {
    const records = [];
    const startDate = new Date(medication.startDate);
    const endDate = medication.endDate ? new Date(medication.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    // Generate records for each day
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate records for each time
      for (const time of medication.times) {
        const record = new MedicationRecord({
          patientId,
          medicationId,
          medicationName: medication.name,
          scheduledTime: time,
          scheduledDate: dateStr,
          status: date < new Date() ? 'pending' : 'upcoming',
          dosage: medication.dosage,
          instructions: medication.instructions
        });
        records.push(record);
      }
    }

    await MedicationRecord.insertMany(records);
    console.log(`Generated ${records.length} medication records for patient ${patientId}`);
  } catch (error) {
    console.error("Error generating medication records:", error);
  }
};

// ✅ Send SOS Alert
export const sendSOSAlert = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const { emergencyType, location } = req.body;

    // Get all linked caretakers for this patient
    const linkedCaretakers = await Caretaker.find({
      _id: { $in: patient.linkedCaretakers }
    });

    if (linkedCaretakers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No linked caretakers found. Please link a caretaker first.'
      });
    }

    // Create alerts for each caretaker
    const alertPromises = linkedCaretakers.map(caretaker => {
      return Alert.create({
        patientId: patient._id,
        patientName: patient.fullName,
        caretakerId: caretaker._id,
        title: '🚨 Emergency SOS Alert',
        message: `${patient.fullName} (${patient.patientID}) has triggered an emergency SOS alert. Immediate assistance may be required.`,
        type: 'emergency',
        priority: 'Critical',
        status: 'active',
        emergencyType: emergencyType || 'OTHER',
        location: location || {},
        timestamp: new Date()
      });
    });

    const alerts = await Promise.all(alertPromises);

    res.json({
      success: true,
      message: `Emergency alert sent to ${alerts.length} caregiver(s)`,
      alerts: alerts.length,
      notifications: alerts.length
    });
  } catch (error) {
    console.error('[SendSOSAlert] Error:', error?.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send SOS alert'
    });
  }
};
