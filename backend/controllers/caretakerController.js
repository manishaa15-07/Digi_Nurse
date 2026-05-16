
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Caretaker from "../models/Caretaker.js";
import Patient from "../models/Patient.js";

// ------------------- Helper: Generate JWT -------------------
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ------------------- Register Caretaker -------------------
export const registerCaretaker = async (req, res) => {
  try {
    console.log("[RegisterCaretaker] Incoming body keys:", Object.keys(req.body || {}));

    const {
      fullName,
      professionalRole,
      organization,
      orgId,
      contact,
      email,
      password,
      agreeToTerms,
      agreeToEthics,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required" });
    }

    const existing = await Caretaker.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newCaretaker = new Caretaker({
      fullName,
      professionalRole,
      organization,
      orgId,
      contact,
      email,
      password, // will be hashed in pre-save
      agreeToTerms,
      agreeToEthics,
    });

    await newCaretaker.save();

    console.log("[RegisterCaretaker] Saved with caretakerId:", newCaretaker.caretakerId);

    // After saving newCaretaker
    const token = generateToken(newCaretaker._id);

    res.status(201).json({
      message: "Caretaker registered successfully",
      caretakerId: newCaretaker.caretakerId,
      fullName: newCaretaker.fullName,
      email: newCaretaker.email,
      token, // <-- send token for auto-login
    });
  } catch (error) {
    console.error("[RegisterCaretaker] Error:", error?.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ------------------- Login Caretaker -------------------
export const loginCaretaker = async (req, res) => {
  try {
    console.log("[LoginCaretaker] Incoming body keys:", Object.keys(req.body || {}));

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const caretaker = await Caretaker.findOne({ email });
    if (!caretaker) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, caretaker.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      _id: caretaker._id,
      fullName: caretaker.fullName,
      email: caretaker.email,
      caretakerId: caretaker.caretakerId,
      token: generateToken(caretaker._id),
    });
  } catch (error) {
    console.error("[LoginCaretaker] Error:", error?.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ------------------- Get Caretaker Profile -------------------
export const getCaretakerProfile = async (req, res) => {
  try {
    // req.caretaker is populated by auth middleware
    const caretaker = await Caretaker.findById(req.caretaker.id)
      .select("-password")
      .populate({
        path: "linkedPatients",
        select: "fullName email contact dob patientID conditions medications healthScore dailyCheckins",
        options: { sort: { createdAt: -1 } }
      })
      .populate("pendingPatientRequests", "fullName email contact dob patientID");

    if (!caretaker) {
      return res.status(404).json({ message: "Caretaker not found" });
    }

    // Format response to include all necessary data
    const response = {
      _id: caretaker._id,
      caretakerId: caretaker.caretakerId,
      fullName: caretaker.fullName,
      email: caretaker.email,
      contact: caretaker.contact,
      professionalRole: caretaker.professionalRole,
      organization: caretaker.organization,
      specializations: caretaker.specializations,
      experienceYears: caretaker.experienceYears,
      linkedPatients: caretaker.linkedPatients || [],
      pendingPatientRequests: caretaker.pendingPatientRequests || []
    };

    console.log(`📋 Caretaker Profile Response for ${caretaker.caretakerId}:`, {
      linkedPatients: response.linkedPatients.length,
      pendingRequests: response.pendingPatientRequests.length
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("[GetCaretakerProfile] Error:", error?.message);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// ------------------- Link Patient to Caretaker -------------------
export const linkPatient = async (req, res) => {
  try {
    const { caretakerId, patientId } = req.body;

    if (!caretakerId || !patientId) {
      return res.status(400).json({ message: "caretakerId and patientId are required." });
    }

    const caretaker = await Caretaker.findById(caretakerId);
    const patient = await Patient.findById(patientId);

    if (!caretaker || !patient) {
      return res.status(404).json({ message: "Caretaker or Patient not found." });
    }

    // ✅ Avoid duplicates
    if (!caretaker.linkedPatients.includes(patientId)) {
      caretaker.linkedPatients.push(patientId);
    }

    if (!patient.linkedCaretakers.includes(caretakerId)) {
      patient.linkedCaretakers.push(caretakerId);
    }

    await caretaker.save();
    await patient.save();

    res.status(200).json({
      message: "Patient successfully linked to caretaker.",
      caretaker,
    });
  } catch (error) {
    console.error("[LinkPatient] Error:", error?.message);
    res.status(500).json({ message: "Server error while linking patient." });
  }
};

// ------------------- Unlink Patient from Caretaker -------------------
export const unlinkPatient = async (req, res) => {
  try {
    const { caretakerId, patientId } = req.body;

    if (!caretakerId || !patientId) {
      return res.status(400).json({ message: "caretakerId and patientId are required." });
    }

    const caretaker = await Caretaker.findById(caretakerId);
    const patient = await Patient.findById(patientId);

    if (!caretaker || !patient) {
      return res.status(404).json({ message: "Caretaker or Patient not found." });
    }

    caretaker.linkedPatients = caretaker.linkedPatients.filter(
      (id) => id.toString() !== patientId
    );

    patient.linkedCaretakers = patient.linkedCaretakers.filter(
      (id) => id.toString() !== caretakerId
    );

    await caretaker.save();
    await patient.save();

    res.status(200).json({ message: "Patient successfully unlinked from caretaker." });
  } catch (error) {
    console.error("[UnlinkPatient] Error:", error?.message);
    res.status(500).json({ message: "Server error while unlinking patient." });
  }
};
// ------------------- Get All Patients Linked to a Caretaker -------------------
export const getAllPatientsForCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.params;

    console.log(`🔍 Getting patients for caretaker ID: ${caretakerId}`);

    if (!caretakerId) {
      return res.status(400).json({ message: "caretakerId is required in params." });
    }

    // Handle both MongoDB _id and public caretakerId
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    let caretaker = null;
    
    if (isObjectId(caretakerId)) {
      console.log('🔍 Searching caretaker by MongoDB _id:', caretakerId);
      caretaker = await Caretaker.findById(caretakerId).populate({
        path: "linkedPatients",
        select: "fullName email contact dob gender conditions medications healthScore patientID dailyCheckins",
        options: { sort: { createdAt: -1 } }
      });
    } else {
      console.log('🔍 Searching caretaker by public caretakerId:', caretakerId);
      caretaker = await Caretaker.findOne({ caretakerId }).populate({
        path: "linkedPatients",
        select: "fullName email contact dob gender conditions medications healthScore patientID dailyCheckins",
        options: { sort: { createdAt: -1 } }
      });
    }

    if (!caretaker) {
      console.log(`❌ Caretaker not found for ID: ${caretakerId}`);
      return res.status(404).json({ message: "Caretaker not found" });
    }

    console.log(`✅ Found ${caretaker.linkedPatients?.length || 0} linked patients`);

    if (!caretaker.linkedPatients.length) {
      return res.status(200).json({ 
        message: "No patients linked to this caretaker yet.", 
        patients: [],
        totalPatients: 0,
        caretakerId: caretaker.caretakerId,
        caretakerName: caretaker.fullName
      });
    }

    res.status(200).json({
      patients: caretaker.linkedPatients || [],
      totalPatients: caretaker.linkedPatients?.length || 0,
      caretakerId: caretaker.caretakerId,
      caretakerName: caretaker.fullName,
    });
  } catch (error) {
    console.error("[GetAllPatientsForCaretaker] Error:", error?.message);
    res.status(500).json({ message: "Server error while fetching caretaker patients." });
  }
};

export const approvePatientRequest = async (req, res) => {
  try {
    let { patientId } = req.body;
    const caretaker = await Caretaker.findById(req.caretaker.id);
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    let patient = null;
    if (isObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientID: patientId });
    }

    if (!caretaker || !patient) {
      return res.status(404).json({ message: "Caretaker or patient not found" });
    }

    if (!caretaker.pendingPatientRequests.includes(patient._id)) {
      return res.status(400).json({ message: "No pending request from this patient" });
    }

    // Approve request: move to linked (avoid duplicates)
    if (!caretaker.linkedPatients.map(id => id.toString()).includes(patient._id.toString())) caretaker.linkedPatients.push(patient._id);
    if (!patient.linkedCaretakers.map(id => id.toString()).includes(caretaker._id.toString())) patient.linkedCaretakers.push(caretaker._id);

    // Remove from pending
    caretaker.pendingPatientRequests = caretaker.pendingPatientRequests.filter(
      (id) => id.toString() !== patient._id.toString()
    );
    patient.pendingCaretakerRequests = patient.pendingCaretakerRequests.filter(
      (id) => id.toString() !== caretaker._id.toString()
    );

    await caretaker.save();
    await patient.save();

    res.status(200).json({ message: "Patient request approved", patient, caretaker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error approving request" });
  }
};

export const rejectPatientRequest = async (req, res) => {
  try {
    let { patientId } = req.body;
    const caretaker = await Caretaker.findById(req.caretaker.id);
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    let patient = null;
    if (isObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientID: patientId });
    }

    if (!caretaker || !patient) {
      return res.status(404).json({ message: "Caretaker or patient not found" });
    }

    if (!caretaker.pendingPatientRequests.includes(patient._id)) {
      return res.status(400).json({ message: "No pending request from this patient" });
    }

    // Remove from pending on both sides
    caretaker.pendingPatientRequests = caretaker.pendingPatientRequests.filter(
      (id) => id.toString() !== patient._id.toString()
    );
    patient.pendingCaretakerRequests = patient.pendingCaretakerRequests.filter(
      (id) => id.toString() !== caretaker._id.toString()
    );

    await caretaker.save();
    await patient.save();

    res.status(200).json({ message: "Patient request rejected", patient, caretaker });
  } catch (error) {
    console.error("[RejectPatientRequest] Error:", error);
    res.status(500).json({ message: "Error rejecting request" });
  }
};
export const addPatientDirectly = async (req, res) => {
  try {
    const { patientId } = req.body;
    const caretaker = await Caretaker.findById(req.caretaker.id);
    const patient = await Patient.findById(patientId);

    if (!caretaker || !patient) {
      return res.status(404).json({ message: "Caretaker or patient not found" });
    }

    if (caretaker.linkedPatients.includes(patient._id)) {
      return res.status(400).json({ message: "Patient already linked" });
    }

    caretaker.linkedPatients.push(patient._id);
    patient.linkedCaretakers.push(caretaker._id);

    await caretaker.save();
    await patient.save();

    res.status(200).json({ message: "Patient added successfully", caretaker, patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding patient" });
  }
};
export const getPendingPatientRequests = async (req, res) => {
  try {
    const caretaker = await Caretaker.findById(req.caretaker.id).populate(
      "pendingPatientRequests",
      "fullName email contact dob patientID"
    );
    res.status(200).json({ requests: caretaker.pendingPatientRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching pending patient requests" });
  }
};

// Find patient by patientID
export const findPatientByPatientID = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Try to find by patientID first (string like "PT12345")
    let patient = await Patient.findOne({ patientID: patientId })
      .select("_id fullName patientID email contact");
    
    // If not found by patientID, try MongoDB ObjectId
    if (!patient && mongoose.Types.ObjectId.isValid(patientId)) {
      patient = await Patient.findById(patientId)
        .select("_id fullName patientID email contact");
    }
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    res.status(200).json({
      _id: patient._id,
      fullName: patient.fullName,
      patientID: patient.patientID,
      email: patient.email,
      contact: patient.contact
    });
  } catch (error) {
    console.error("[FindPatientByPatientID] Error:", error);
    res.status(500).json({ message: "Error finding patient" });
  }
};