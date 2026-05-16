import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls safely
    },
    fullName: { type: String, required: true },
    professionalRole: String,
    specialization: {
      type: String,
      enum: [
        "Cardiology",
        "Neurology",
        "Oncology",
        "Orthopedics",
        "General Medicine",
        "Endocrinology",
        "Pediatrics",
        "Psychiatry",
        "Dermatology",
        "Other",
      ],
    },
    hospitalName: String,
    hospitalId: String,
    contact: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    licenseNumber: String,
    experienceYears: { type: Number },
    agreeToTerms: { type: Boolean, default: false },
    agreeToEthics: { type: Boolean, default: false },

    // ✅ Linked patients
    linkedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],
    pendingPatientRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    ],

    // ✅ Medications prescribed by doctor
    prescribedMedications: [
      {
        patient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
          required: true,
        },
        name: { type: String, required: true }, // e.g., "Paracetamol"
        dosage: { type: String }, // e.g., "500mg"
        time: [{ type: String }], // e.g., ["08:00", "20:00"]
        startDate: { type: Date },
        endDate: { type: Date },
        notes: { type: String }, // doctor notes
        status: {
          type: String,
          enum: ["active", "completed", "stopped"],
          default: "active",
        },
      },
    ],

    // ✅ Scheduled visits
    scheduledVisits: [
      {
        date: { type: Date, required: true },
        patient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
          required: true,
        },
        purpose: { type: String },
        status: {
          type: String,
          enum: ["upcoming", "completed", "cancelled"],
          default: "upcoming",
        },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Auto-generate doctorId if missing
doctorSchema.pre("save", async function (next) {
  if (!this.doctorId) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.doctorId = `DR${randomNum}`;
  }

  // ✅ Hash password if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
