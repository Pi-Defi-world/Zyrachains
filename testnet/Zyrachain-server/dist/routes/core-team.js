"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CoreTeamContact_1 = __importDefault(require("../zyrachain-lib/lib/models/CoreTeamContact"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, category, search } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (priority)
            query['inquiry.priority'] = priority;
        if (category)
            query['inquiry.category'] = category;
        if (search) {
            query.$or = [
                { 'contactInfo.name': { $regex: search, $options: 'i' } },
                { 'contactInfo.email': { $regex: search, $options: 'i' } },
                { 'inquiry.subject': { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [contacts, total] = await Promise.all([
            CoreTeamContact_1.default.find(query)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            CoreTeamContact_1.default.countDocuments(query)
        ]);
        return res.json({
            success: true,
            contacts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching core team contacts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch core team contacts'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const contact = await CoreTeamContact_1.default.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Core team contact not found'
            });
        }
        return res.json({
            success: true,
            contact
        });
    }
    catch (error) {
        console.error('Error fetching core team contact:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch core team contact'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const contact = new CoreTeamContact_1.default(req.body);
        await contact.save();
        return res.status(201).json({
            success: true,
            contact
        });
    }
    catch (error) {
        console.error('Error creating core team contact:', error);
        return res.status(400).json({
            success: false,
            error: error.message || 'Failed to create core team contact'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const updated = await CoreTeamContact_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Core team contact not found'
            });
        }
        return res.json({
            success: true,
            contact: updated
        });
    }
    catch (error) {
        console.error('Error updating core team contact:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await CoreTeamContact_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Core team contact not found'
            });
        }
        return res.json({
            success: true,
            message: 'Core team contact deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting core team contact:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/stats/dashboard', async (req, res) => {
    try {
        const [totalContacts, newContacts, inProgressContacts, overdueContacts, priorityBreakdown] = await Promise.all([
            CoreTeamContact_1.default.countDocuments(),
            CoreTeamContact_1.default.countDocuments({ status: 'new' }),
            CoreTeamContact_1.default.countDocuments({ status: 'in_progress' }),
            CoreTeamContact_1.default.aggregate([
                {
                    $addFields: {
                        isOverdue: {
                            $and: [
                                { $nin: ['$status', ['resolved', 'closed']] },
                                {
                                    $gt: [
                                        new Date(),
                                        {
                                            $add: [
                                                '$submittedAt',
                                                { $multiply: ['$expectedResponseTime', 60, 60, 1000] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                { $match: { isOverdue: true } },
                { $count: 'overdueCount' }
            ]),
            CoreTeamContact_1.default.aggregate([
                {
                    $group: {
                        _id: '$inquiry.priority',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        const overdueCount = overdueContacts[0]?.overdueCount || 0;
        return res.json({
            success: true,
            stats: {
                total: totalContacts,
                new: newContacts,
                inProgress: inProgressContacts,
                overdue: overdueCount,
                priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    }
    catch (error) {
        console.error('Error fetching core team contact stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard stats'
        });
    }
});
exports.default = router;
//# sourceMappingURL=core-team.js.map