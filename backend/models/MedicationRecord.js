// models/MedicationRecord.js
import mongoose from "mongoose";

const medicationRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true
    },
    medicationName: {
      type: String,
      required: true
    },
    scheduledTime: {
      type: String,
      required: true // Format: "HH:MM" (24-hour format)
    },
    scheduledDate: {
      type: String,
      required: true // Format: "YYYY-MM-DD"
    },
    status: {
      type: String,
      enum: ['taken', 'missed', 'pending', 'upcoming'],
      default: 'upcoming'
    },
    takenAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ""
    },
    dosage: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Index for efficient queries
medicationRecordSchema.index({ patientId: 1, scheduledDate: 1 });
medicationRecordSchema.index({ patientId: 1, status: 1 });

const MedicationRecord = mongoose.model("MedicationRecord", medicationRecordSchema);
export default MedicationRecord;

