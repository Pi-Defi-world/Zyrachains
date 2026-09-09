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
        const { limit = 20, status } = req.query;
        if (!mongoose_1.default.connection.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const query = {};
        if (status) {
            query.status = status;
        }
        const hackathons = await mongoose_1.default.connection.db
            .collection('hackathons')
            .find(query)
            .sort({ startDate: -1 })
            .limit(Number(limit))
            .toArray();
        return res.json({ hackathons });
    }
    catch (error) {
        console.error('Error fetching hackathons:', error);
        return res.status(500).json({ error: 'Failed to fetch hackathons' });
    }
});
router.post('/', async (req, res) => {
    try {
        if (!mongoose_1.default.connection.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const hackathon = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.db
            .collection('hackathons')
            .insertOne(hackathon);
        return res.status(201).json({
            success: true,
            hackathon: { _id: result.insertedId, ...hackathon }
        });
    }
    catch (error) {
        console.error('Error creating hackathon:', error);
        return res.status(500).json({ error: 'Failed to create hackathon' });
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
            .collection('hackathons')
            .updateOne({ _id: new mongoose_1.default.Types.ObjectId(id) }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hackathon not found'
            });
        }
        return res.json({
            success: true,
            message: 'Hackathon updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating hackathon:', error);
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
            .collection('hackathons')
            .deleteOne({ _id: new mongoose_1.default.Types.ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hackathon not found'
            });
        }
        return res.json({
            success: true,
            message: 'Hackathon deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting hackathon:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=hackathons.js.map