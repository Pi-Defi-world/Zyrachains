"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const { limit = 20, status, category } = req.query;
        if (!mongoose_1.default.connection.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const query = {};
        if (status) {
            query.status = status;
        }
        if (category) {
            query.category = category;
        }
        const events = await mongoose_1.default.connection.db
            .collection('events')
            .find(query)
            .sort({ date: -1 })
            .limit(Number(limit))
            .toArray();
        return res.json({ events });
    }
    catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
});
router.post('/', async (req, res) => {
    try {
        if (!mongoose_1.default.connection.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const event = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.db
            .collection('events')
            .insertOne(event);
        return res.status(201).json({
            success: true,
            event: { _id: result.insertedId, ...event }
        });
    }
    catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'Failed to create event' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose_1.default.connection.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.db
            .collection('events')
            .updateOne({ _id: new mongoose_1.default.Types.ObjectId(id) }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }
        return res.json({
            success: true,
            message: 'Event updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating event:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose_1.default.connection.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const { id } = req.params;
        const result = await mongoose_1.default.connection.db
            .collection('events')
            .deleteOne({ _id: new mongoose_1.default.Types.ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }
        return res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map