// routes/alertRoutes.js
import express from "express";
import Alert from "../models/Alert.js";
import Caretaker from "../models/Caretaker.js";
import protectCaretaker from "../middleware/authCaretaker.js";

const router = express.Router();

// Get all alerts for a caretaker
router.get("/", protectCaretaker, async (req, res) => {
    try {
        const caretakerId = req.caretaker.id;

        // Fetch alerts for this caretaker, sorted by timestamp (newest first)
        const alerts = await Alert.find({ caretakerId })
            .populate('patientId', 'fullName patientID contact')
            .sort({ timestamp: -1 })
            .limit(50); // Limit to last 50 alerts

        // Transform alerts to match frontend format
        const formattedAlerts = alerts.map(alert => ({
            _id: alert._id,
            type: alert.type,
            title: alert.title,
            patient: alert.patientName,
            patientId: alert.patientId?._id || alert.patientId,
            patientID: alert.patientId?.patientID || '', // Patient ID like PT12345
            message: alert.message,
            timestamp: alert.timestamp,
            priority: alert.priority,
            status: alert.status,
            emergencyType: alert.emergencyType,
            location: alert.location,
            isRead: alert.isRead,
            readBy: alert.readBy,
            createdAt: alert.createdAt
        }));

        res.json({
            success: true,
            alerts: formattedAlerts,
            total: formattedAlerts.length
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts'
        });
    }
});

// Get unread alerts count
router.get("/unread-count", protectCaretaker, async (req, res) => {
    try {
        const caretakerId = req.caretaker.id;

        const unreadCount = await Alert.countDocuments({
            caretakerId,
            isRead: false,
            status: 'active'
        });

        res.json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        });
    }
});

// Mark alert as read
router.put("/:alertId/read", protectCaretaker, async (req, res) => {
    try {
        const { alertId } = req.params;
        const caretakerId = req.caretaker.id;

        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Check if alert belongs to this caretaker
        if (alert.caretakerId.toString() !== caretakerId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to access this alert'
            });
        }

        // Mark as read
        alert.isRead = true;
        alert.readBy.push({
            caretakerId: caretakerId,
            readAt: new Date()
        });

        await alert.save();

        res.json({
            success: true,
            message: 'Alert marked as read'
        });
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark alert as read'
        });
    }
});

// Acknowledge alert (mark as acknowledged)
router.put("/:alertId/acknowledge", protectCaretaker, async (req, res) => {
    try {
        const { alertId } = req.params;
        const caretakerId = req.caretaker.id;
        const { notes } = req.body;

        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Check if alert belongs to this caretaker
        if (alert.caretakerId.toString() !== caretakerId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to access this alert'
            });
        }

        // Update alert status
        alert.status = 'acknowledged';
        alert.isRead = true;
        if (notes) {
            alert.notes = notes;
        }

        await alert.save();

        res.json({
            success: true,
            message: 'Alert acknowledged'
        });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge alert'
        });
    }
});

// Resolve alert
router.put("/:alertId/resolve", protectCaretaker, async (req, res) => {
    try {
        const { alertId } = req.params;
        const caretakerId = req.caretaker.id;
        const { notes } = req.body;

        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Check if alert belongs to this caretaker
        if (alert.caretakerId.toString() !== caretakerId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to access this alert'
            });
        }

        // Update alert status
        alert.status = 'resolved';
        alert.resolvedBy = caretakerId;
        alert.resolvedAt = new Date();
        if (notes) {
            alert.notes = notes;
        }

        await alert.save();

        res.json({
            success: true,
            message: 'Alert resolved'
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve alert'
        });
    }
});

// Get alerts by priority
router.get("/priority/:priority", protectCaretaker, async (req, res) => {
    try {
        const { priority } = req.params;
        const caretakerId = req.caretaker.id;

        const alerts = await Alert.find({
            caretakerId,
            priority: priority,
            status: 'active'
        })
            .populate('patientId', 'fullName patientID contact')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            alerts: alerts,
            priority: priority
        });
    } catch (error) {
        console.error('Error fetching alerts by priority:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts by priority'
        });
    }
});

export default router;

