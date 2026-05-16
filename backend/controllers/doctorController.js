import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import MedicationRecord from "../models/MedicationRecord.js";

// ------------------- Helper: Generate JWT -------------------
// ------------------- Helper: Generate JWT -------------------
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};


// ------------------- Register Doctor -------------------
export const registerDoctor = async (req, res) => {
  try {
    const {
      fullName,
      specialization,
      hospitalName,
      hospitalId,
      contact,
      email,
      password,
      licenseNumber,
      experienceYears,
      agreeToTerms,
      agreeToEthics,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required" });
    }

    const existing = await Doctor.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newDoctor = new Doctor({
      fullName,
      specialization,
      hospitalName,
      hospitalId,
      contact,
      email,
      password,
      licenseNumber,
      experienceYears,
      agreeToTerms,
      agreeToEthics,
    });

    await newDoctor.save();

    // Generate token for auto-login after signup
    const token = generateToken(newDoctor._id);

    res.status(201).json({
      message: "Doctor registered successfully",
      doctorId: newDoctor.doctorId,
      fullName: newDoctor.fullName,
      email: newDoctor.email,
      token: token,
    });
  } catch (error) {
    console.error("[RegisterDoctor] Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ------------------- Login Doctor -------------------
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({
      _id: doctor._id,
      fullName: doctor.fullName,
      email: doctor.email,
      doctorId: doctor.doctorId,
      token: generateToken(doctor._id),
    });
  } catch (error) {
    console.error("[LoginDoctor] Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ------------------- Get Doctor Profile -------------------
export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id)
      .select("-password")
      .populate("linkedPatients", "fullName email contact dob healthScore");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json(doctor);
  } catch (error) {
    console.error("[GetDoctorProfile] Error:", error.message);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// ------------------- Get Doctor Profile by ID (for auto-login) -------------------
export const getDoctorProfileById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) return res.status(400).json({ message: "Doctor ID is required" });

    const doctor = await Doctor.findOne({ doctorId })
      .select("-password")
      .populate("linkedPatients", "fullName email contact dob healthScore");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json(doctor);
  } catch (error) {
    console.error("[GetDoctorProfileById] Error:", error.message);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// ------------------- Link Patient -------------------
export const linkPatient = async (req, res) => {
  try {
    let { doctorId, patientId } = req.body;
    // prefer authenticated doctor id if available from protectDoctor middleware
    if (!doctorId && req.user && req.user.id) doctorId = req.user.id;
    if (!doctorId || !patientId) return res.status(400).json({ message: "doctorId and patientId required" });

    // Check if doctorId is MongoDB ObjectId or custom doctorId field
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    const doctor = isObjectId(doctorId) 
      ? await Doctor.findById(doctorId)
      : await Doctor.findOne({ doctorId });
    // allow doctors to provide either Mongo _id or public patientID (e.g. PT12345)
    let patient = null;
    if (isObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientID: patientId });
    }

    if (!doctor || !patient) return res.status(404).json({ message: "Doctor or Patient not found" });

    // ensure linkedPatients stores Mongo ObjectId
    if (!doctor.linkedPatients.map(id => id.toString()).includes(patient._id.toString())) doctor.linkedPatients.push(patient._id);
    // add doctor to patient's linkedDoctors
    if (!patient.linkedDoctors.includes(doctorId)) patient.linkedDoctors.push(doctorId);

    await doctor.save();
    await patient.save();

    res.status(200).json({ message: "Patient linked to doctor", doctor, patient });
  } catch (error) {
    console.error("[LinkPatient] Error:", error.message);
    res.status(500).json({ message: "Error linking patient" });
  }
};

// ------------------- Unlink Patient -------------------
export const unlinkPatient = async (req, res) => {
  try {
    let { doctorId, patientId } = req.body;
    if (!doctorId && req.user && req.user.id) doctorId = req.user.id;
    if (!doctorId || !patientId) return res.status(400).json({ message: "doctorId and patientId required" });

    // Check if doctorId is MongoDB ObjectId or custom doctorId field
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    const doctor = isObjectId(doctorId) 
      ? await Doctor.findById(doctorId)
      : await Doctor.findOne({ doctorId });
    let patient = null;
    if (isObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientID: patientId });
    }

    if (!doctor || !patient) return res.status(404).json({ message: "Doctor or Patient not found" });

    doctor.linkedPatients = doctor.linkedPatients.filter(id => id.toString() !== patient._id.toString());
    // remove doctor from patient's linkedDoctors
    patient.linkedDoctors = patient.linkedDoctors.filter(id => id.toString() !== doctorId); // optional

    await doctor.save();
    await patient.save();

    res.status(200).json({ message: "Patient unlinked from doctor" });
  } catch (error) {
    console.error("[UnlinkPatient] Error:", error.message);
    res.status(500).json({ message: "Error unlinking patient" });
  }
};

// ------------------- Get All Linked Patients -------------------
export const getAllPatientsForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findOne({ doctorId }).populate(
      "linkedPatients",
      "fullName email contact dob gender healthScore medications scheduledVisits dailyCheckins patientID"
    );
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json({ totalPatients: doctor.linkedPatients.length, patients: doctor.linkedPatients });
  } catch (error) {
    console.error("[GetAllPatientsForDoctor] Error:", error.message);
    res.status(500).json({ message: "Error fetching linked patients" });
  }
};

// ------------------- Approve Patient Request -------------------
export const approvePatientRequest = async (req, res) => {
  try {
    const { patientId } = req.body;
    const doctor = await Doctor.findById(req.user.id);
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    let patient = null;
    if (isObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientID: patientId });
    }

    if (!doctor || !patient) return res.status(404).json({ message: "Doctor or patient not found" });

    if (!doctor.pendingPatientRequests.includes(patient._id))
      return res.status(400).json({ message: "No pending request from this patient" });

    doctor.linkedPatients.push(patient._id);
    // add doctor to patient's linkedDoctors
    patient.linkedDoctors.push(doctor._id);

    doctor.pendingPatientRequests = doctor.pendingPatientRequests.filter(id => id.toString() !== patient._id.toString());
    // remove doctor from patient's pendingDoctorRequests
    patient.pendingDoctorRequests = patient.pendingDoctorRequests.filter(id => id.toString() !== doctor._id.toString());

    await doctor.save();
    await patient.save();

    res.status(200).json({ message: "Patient request approved", doctor, patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error approving request" });
  }
};

// ------------------- Reject Patient Request -------------------
export const rejectPatientRequest = async (req, res) => {
  try {
    const { patientId } = req.body;
    const doctor = await Doctor.findById(req.user.id);
    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    let patient = null;
    if (isObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientID: patientId });
    }

    if (!doctor || !patient) return res.status(404).json({ message: "Doctor or patient not found" });

    if (!doctor.pendingPatientRequests.includes(patient._id))
      return res.status(400).json({ message: "No pending request from this patient" });

    // Remove pending references on both sides
    doctor.pendingPatientRequests = doctor.pendingPatientRequests.filter(id => id.toString() !== patient._id.toString());
    patient.pendingDoctorRequests = patient.pendingDoctorRequests.filter(id => id.toString() !== doctor._id.toString());

    await doctor.save();
    await patient.save();

    res.status(200).json({ message: "Patient request rejected", doctor, patient });
  } catch (error) {
    console.error("[RejectPatientRequest] Error:", error);
    res.status(500).json({ message: "Error rejecting request" });
  }
};

// ------------------- Medication Management -------------------
export const addMedicationToPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, dosage, frequency, times, startDate, endDate, instructions } = req.body;

    if (!name || !patientId || !dosage || !frequency || !startDate) {
      return res.status(400).json({ message: "Name, patientId, dosage, frequency, and start date are required" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Create new medication
    const newMedication = {
      name,
      dosage,
      frequency,
      times: times || [],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      instructions: instructions || "",
      prescribedBy: req.user.id,
      addedBy: 'doctor',
      isActive: true,
      takenCount: 0,
      missedCount: 0
    };

    patient.medications.push(newMedication);
    await patient.save();

    // Generate medication records for the next 30 days
    const medicationId = patient.medications[patient.medications.length - 1]._id;
    await generateMedicationRecords(patient._id, medicationId, newMedication);

    res.status(200).json({ message: "Medication added to patient", medication: newMedication });
  } catch (error) {
    console.error("[AddMedicationToPatient] Error:", error.message);
    res.status(500).json({ message: "Error adding medication" });
  }
};

export const removeMedicationFromPatient = async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;

    const patient = await Patient.findById(patientId);
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

    res.status(200).json({ message: "Medication removed from patient" });
  } catch (error) {
    console.error("[RemoveMedicationFromPatient] Error:", error.message);
    res.status(500).json({ message: "Error removing medication" });
  }
};

// ------------------- Scheduled Visit Management -------------------
export const addScheduledVisitToPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, time, purpose, notes } = req.body;

    if (!patientId || !date || !time || !purpose) {
      return res.status(400).json({ message: "PatientId, date, time, and purpose are required" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Check if doctor is linked to this patient
    if (!patient.linkedDoctors.includes(req.user.id)) {
      return res.status(403).json({ message: "Doctor is not linked to this patient" });
    }

    const newVisit = { 
      date, 
      time, 
      purpose, 
      notes: notes || '', 
      status: "upcoming",
      doctorId: req.user.id // Add the doctor ID who is scheduling the visit
    };
    
    patient.scheduledVisits.push(newVisit);
    await patient.save();

    console.log(`📅 Doctor ${req.user.id} scheduled visit for patient ${patientId}:`, newVisit);
    res.status(200).json({ message: "Scheduled visit added successfully", visit: newVisit });
  } catch (error) {
    console.error("[AddScheduledVisitToPatient] Error:", error.message);
    res.status(500).json({ message: "Error adding scheduled visit" });
  }
};

export const removeScheduledVisitFromPatient = async (req, res) => {
  try {
    const { patientId, visitId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.scheduledVisits = patient.scheduledVisits.filter(v => v._id.toString() !== visitId);
    await patient.save();

    res.status(200).json({ message: "Scheduled visit removed" });
  } catch (error) {
    console.error("[RemoveScheduledVisitFromPatient] Error:", error.message);
    res.status(500).json({ message: "Error removing scheduled visit" });
  }
};

// ------------------- Get Pending Patient Requests -------------------
export const getPendingPatientRequests = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id)
      .populate("pendingPatientRequests", "fullName email contact dob gender");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json({
      totalPendingRequests: doctor.pendingPatientRequests.length,
      pendingRequests: doctor.pendingPatientRequests,
    });
  } catch (error) {
    console.error("[GetPendingPatientRequests] Error:", error.message);
    res.status(500).json({ message: "Error fetching pending requests" });
  }
};

// ✅ Get doctor's appointments/scheduled visits
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get all patients linked to this doctor
    const patients = await Patient.find({ linkedDoctors: doctorId })
      .populate('scheduledVisits.doctorId', 'fullName specialization hospitalName')
      .select('fullName patientID scheduledVisits');

    // Extract and format appointments
    const appointments = [];
    patients.forEach(patient => {
      if (patient.scheduledVisits && patient.scheduledVisits.length > 0) {
        patient.scheduledVisits.forEach(visit => {
          if (visit.doctorId && visit.doctorId._id.toString() === doctorId) {
            appointments.push({
              _id: visit._id,
              patientId: patient._id,
              patientName: patient.fullName,
              patientID: patient.patientID,
              date: visit.date,
              time: visit.time,
              purpose: visit.purpose,
              notes: visit.notes,
              status: visit.status,
              doctorName: visit.doctorId.fullName,
              doctorSpecialization: visit.doctorId.specialization,
              hospitalName: visit.doctorId.hospitalName
            });
          }
        });
      }
    });

    // Sort appointments by date
    appointments.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({ 
      appointments,
      totalAppointments: appointments.length 
    });
  } catch (error) {
    console.error("[GetDoctorAppointments] Error:", error?.message);
    res.status(500).json({ message: "Failed to fetch appointments" });
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
