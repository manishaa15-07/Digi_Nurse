// models/Alert.js
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true
        },
        patientName: {
            type: String,
            required: true
        },
        caretakerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Caretaker"
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["urgent", "warning", "info", "emergency"],
            required: true
        },
        priority: {
            type: String,
            enum: ["Critical", "High", "Medium", "Low"],
            required: true
        },
        status: {
            type: String,
            enum: ["active", "acknowledged", "resolved"],
            default: "active"
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String }
        },
        emergencyType: {
            type: String,
            enum: ["AMBULANCE_REQUIRED", "MEDICAL_EMERGENCY", "FALL_DETECTED", "MEDICATION_MISSED", "OTHER"],
            default: "OTHER"
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readBy: [{
            caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: "Caretaker" },
            readAt: { type: Date, default: Date.now }
        }],
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Caretaker"
        },
        resolvedAt: {
            type: Date
        },
        notes: {
            type: String
        }
    },
    { timestamps: true }
);

// Index for efficient queries
alertSchema.index({ patientId: 1, timestamp: -1 });
alertSchema.index({ caretakerId: 1, status: 1 });
alertSchema.index({ type: 1, priority: 1 });

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
