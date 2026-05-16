// models/Patient.js
import mongoose from "mongoose";
const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String },
    contact: { type: String, required: true },
    emergencyContact: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    smoking: { type: String },
    drinking: { type: String },
    activity: { type: String },
    consentToShare: { type: Boolean, default: false },
    patientID: { type: String, unique: true },

    // ✅ Linked caretakers (array of ObjectIds)
    linkedCaretakers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Caretaker" }
    ],
    pendingCaretakerRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Caretaker" }
    ],
    // ✅ Doctor management (doctors who are linked to this patient)
    linkedDoctors: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }
    ],
    pendingDoctorRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }
    ],

    // ✅ Daily check-ins
    dailyCheckins: [
      {
        date: { type: Date, default: Date.now },
        energyLevel: { type: Number, min: 1, max: 10 },
        pain: { type: Number, min: 1, max: 10 },
        dietQuality: { type: String, enum: ['poor', 'average', 'good', 'excellent'] },
        sleepQuality: { type: String, enum: ['poor', 'average', 'good', 'excellent'] },
        notes: { type: String },
        createdAt: { type: Date, default: Date.now }
      },
    ],


    // ✅ Medications array
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        times: [{ type: String }], // Array of times like ["08:00", "14:00", "20:00"]
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        instructions: { type: String },
        prescribedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
        addedBy: {
          type: String,
          enum: ['patient', 'doctor'],
          default: 'patient'
        },
        isActive: { type: Boolean, default: true },
        takenCount: { type: Number, default: 0 },
        missedCount: { type: Number, default: 0 },
      },
    ],

    // ✅ Scheduled visits array
    scheduledVisits: [
      {
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        purpose: { type: String },
        notes: { type: String },
        status: {
          type: String,
          enum: ["upcoming", "completed", "cancelled"],
          default: "upcoming",
        },
      },
    ],

    // ✅ Overall health score (0–100)
    healthScore: { type: Number, min: 0, max: 100, default: 70 },
  },
  { timestamps: true }
);



const Patient = mongoose.model("Patient", patientSchema);
export default Patient;