"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EcosystemEvent_1 = __importDefault(require("../zyrachain-lib/lib/models/EcosystemEvent"));
const EcosystemHackathon_1 = __importDefault(require("../zyrachain-lib/lib/models/EcosystemHackathon"));
const EcosystemCommunity_1 = __importDefault(require("../zyrachain-lib/lib/models/EcosystemCommunity"));
const CoreTeamContact_1 = __importDefault(require("../zyrachain-lib/lib/models/CoreTeamContact"));
const mongoose_1 = __importDefault(require("mongoose"));
const ecosystem_social_enrich_1 = require("../zyrachain-lib/lib/ecosystem-social-enrich");
const router = express_1.default.Router();
function wantsSocialStats(req) {
    const v = req.query.socialStats ?? req.query.social;
    return v === '1' || v === 'true' || v === 'yes';
}
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        console.log('🔍 Ecosystem route called with type:', type);
        console.log('🔍 mongoose.connection:', !!mongoose_1.default.connection);
        console.log('🔍 mongoose.connection.readyState:', mongoose_1.default.connection?.readyState);
        if (type === 'communities') {
            let communities = (await mongoose_1.default.connection
                .collection('communities')
                .find({})
                .toArray());
            console.log('🔍 Found communities:', communities.length);
            const withSocial = wantsSocialStats(req);
            if (withSocial) {
                communities = (0, ecosystem_social_enrich_1.sortEcosystemCommunitiesByMembers)(await (0, ecosystem_social_enrich_1.enrichEcosystemCommunityDocuments)(communities));
            }
            return res.json({ success: true, data: communities, socialStats: withSocial });
        }
        else if (type === 'events') {
            const events = await mongoose_1.default.connection.collection('ecosystemevents').find({}).toArray();
            console.log('🔍 Found events:', events.length);
            return res.json({ success: true, data: events });
        }
        else if (type === 'hackathons') {
            const hackathons = await mongoose_1.default.connection.collection('ecosystemhackathons').find({}).toArray();
            console.log('🔍 Found hackathons:', hackathons.length);
            return res.json({ success: true, data: hackathons });
        }
        else if (type === 'cex-addresses') {
            const addresses = await mongoose_1.default.connection.collection('cex-addresses').find({}).toArray();
            console.log('🔍 Found cex-addresses:', addresses.length);
            return res.json({ success: true, data: addresses });
        }
        else if (type === 'core-team-addresses') {
            const addressesRaw = await mongoose_1.default.connection.collection('core-team-addresses').find({}).toArray();
            const addresses = addressesRaw.map((addr) => ({
                ...addr,
                Name: addr.Name ??
                    addr.name ??
                    'Pi Core Team',
            }));
            console.log('🔍 Found core-team-addresses:', addresses.length);
            return res.json({ success: true, data: addresses });
        }
        else if (type === 'generated-addresses') {
            try {
                const addresses = await mongoose_1.default.connection.collection('generated-addresses').find({}).toArray();
                console.log('🔍 Found generated-addresses:', addresses.length);
                const validAddresses = addresses.filter(addr => {
                    if (!addr.identifier || !addr.Name) {
                        console.log('🔍 Skipping invalid address:', addr);
                        return false;
                    }
                    if (!addr.identifier.match(/^G[A-Z0-9]{55}$/)) {
                        console.log('🔍 Skipping invalid Stellar address format:', addr.identifier);
                        return false;
                    }
                    return true;
                });
                console.log('🔍 Valid generated-addresses:', validAddresses.length);
                return res.json({ success: true, data: validAddresses });
            }
            catch (error) {
                console.error('Error fetching generated addresses:', error);
                return res.json({ success: true, data: [] });
            }
        }
        else if (type === 'influencers') {
            let influencers = (await mongoose_1.default.connection
                .collection('influencers')
                .find({})
                .toArray());
            console.log('🔍 Found influencers:', influencers.length);
            const withSocial = wantsSocialStats(req);
            if (withSocial) {
                influencers = (0, ecosystem_social_enrich_1.sortEcosystemInfluencersByFollowers)(await (0, ecosystem_social_enrich_1.enrichEcosystemInfluencerDocuments)(influencers));
            }
            return res.json({ success: true, data: influencers, socialStats: withSocial });
        }
        else {
            const [events, hackathons, communities] = await Promise.all([
                mongoose_1.default.connection.collection('ecosystemevents').find({}).toArray(),
                mongoose_1.default.connection.collection('ecosystemhackathons').find({}).toArray(),
                mongoose_1.default.connection.collection('communities').find({}).toArray()
            ]);
            return res.json({
                events,
                hackathons,
                communities
            });
        }
    }
    catch (error) {
        console.error('Error fetching ecosystem data:', error);
        console.error('Error details:', error.stack);
        return res.status(500).json({ error: 'Failed to fetch ecosystem data', details: error.message });
    }
});
router.get('/events', async (req, res) => {
    try {
        const { limit = 20, status = 'active' } = req.query;
        const query = {};
        if (status) {
            query.isActive = status === 'active';
        }
        const events = await EcosystemEvent_1.default.find(query)
            .sort({ startDate: -1 })
            .limit(Number(limit));
        return res.json({ events });
    }
    catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
});
router.post('/events', async (req, res) => {
    try {
        const event = new EcosystemEvent_1.default(req.body);
        await event.save();
        return res.status(201).json({
            success: true,
            event
        });
    }
    catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'Failed to create event' });
    }
});
router.put('/events/:id', async (req, res) => {
    try {
        const updated = await EcosystemEvent_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }
        return res.json({
            success: true,
            event: updated
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
router.delete('/events/:id', async (req, res) => {
    try {
        const deleted = await EcosystemEvent_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
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
router.get('/hackathons', async (req, res) => {
    try {
        const { limit = 20, status = 'active' } = req.query;
        const query = {};
        if (status) {
            query.isActive = status === 'active';
        }
        const hackathons = await EcosystemHackathon_1.default.find(query)
            .sort({ startDate: -1 })
            .limit(Number(limit));
        return res.json({ hackathons });
    }
    catch (error) {
        console.error('Error fetching hackathons:', error);
        return res.status(500).json({ error: 'Failed to fetch hackathons' });
    }
});
router.post('/hackathons', async (req, res) => {
    try {
        const hackathon = new EcosystemHackathon_1.default(req.body);
        await hackathon.save();
        return res.status(201).json({
            success: true,
            hackathon
        });
    }
    catch (error) {
        console.error('Error creating hackathon:', error);
        return res.status(500).json({ error: 'Failed to create hackathon' });
    }
});
router.put('/hackathons/:id', async (req, res) => {
    try {
        const updated = await EcosystemHackathon_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Hackathon not found'
            });
        }
        return res.json({
            success: true,
            hackathon: updated
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
router.delete('/hackathons/:id', async (req, res) => {
    try {
        const deleted = await EcosystemHackathon_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
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
router.get('/communities', async (req, res) => {
    try {
        const { limit = 50, category } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        const communities = await EcosystemCommunity_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        return res.json({ communities });
    }
    catch (error) {
        console.error('Error fetching communities:', error);
        return res.status(500).json({ error: 'Failed to fetch communities' });
    }
});
router.post('/communities', async (req, res) => {
    try {
        const community = new EcosystemCommunity_1.default(req.body);
        await community.save();
        return res.status(201).json({
            success: true,
            community
        });
    }
    catch (error) {
        console.error('Error creating community:', error);
        return res.status(500).json({ error: 'Failed to create community' });
    }
});
router.get('/core-team-contacts', async (req, res) => {
    try {
        const contacts = await CoreTeamContact_1.default.find({ status: 'active' })
            .sort({ priority: 1, createdAt: -1 })
            .limit(50);
        return res.json({ contacts });
    }
    catch (error) {
        console.error('Error fetching core team contacts:', error);
        return res.status(500).json({ error: 'Failed to fetch core team contacts' });
    }
});
router.post('/core-team-contacts', async (req, res) => {
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
        return res.status(500).json({ error: 'Failed to create core team contact' });
    }
});
router.get('/core-team-contact', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, priority, status, assignedTo } = req.query;
        const query = {};
        if (category)
            query['inquiry.category'] = category;
        if (priority)
            query['inquiry.priority'] = priority;
        if (status)
            query.status = status;
        if (assignedTo)
            query.assignedTo = assignedTo;
        const skip = (Number(page) - 1) * Number(limit);
        const [contacts, total] = await Promise.all([
            CoreTeamContact_1.default.find(query)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            CoreTeamContact_1.default.countDocuments(query)
        ]);
        const contactsWithVirtuals = contacts.map(contact => {
            const now = new Date();
            const deadlineTime = new Date(contact.submittedAt).getTime() + (contact.expectedResponseTime * 60 * 60 * 1000);
            const isOverdue = contact.status !== 'resolved' && contact.status !== 'closed' && now.getTime() > deadlineTime;
            return {
                ...contact,
                isOverdue,
                ticketNumber: `CT-${contact._id.toString().slice(-6).toUpperCase()}`
            };
        });
        return res.json({
            success: true,
            contacts: contactsWithVirtuals,
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
            error: 'Failed to fetch core team contacts'
        });
    }
});
router.post('/core-team-contact', async (req, res) => {
    try {
        const data = req.body;
        const getExpectedResponseTime = (priority) => {
            switch (priority) {
                case 'urgent': return 4;
                case 'high': return 24;
                case 'medium': return 72;
                case 'low': return 168;
                default: return 72;
            }
        };
        let projectInfo;
        if (data.projectInfo) {
            projectInfo = {
                ...data.projectInfo,
                website: data.projectInfo.website === '' ? undefined : data.projectInfo.website
            };
        }
        const contactRequest = new CoreTeamContact_1.default({
            ...data,
            projectInfo,
            status: 'new',
            submittedAt: new Date(),
            followUpRequired: data.inquiry.priority === 'urgent' || data.inquiry.priority === 'high',
            expectedResponseTime: getExpectedResponseTime(data.inquiry.priority)
        });
        await contactRequest.save();
        const getResponseMessage = (priority) => {
            switch (priority) {
                case 'urgent': return 'Your urgent inquiry has been submitted. We aim to respond within 4 hours.';
                case 'high': return 'Your high-priority inquiry has been submitted. We aim to respond within 24 hours.';
                case 'medium': return 'Your inquiry has been submitted. We aim to respond within 3 business days.';
                case 'low': return 'Your inquiry has been submitted. We aim to respond within 1 week.';
                default: return 'Your inquiry has been submitted successfully.';
            }
        };
        return res.status(201).json({
            success: true,
            message: getResponseMessage(data.inquiry.priority),
            id: contactRequest._id,
            ticketNumber: `CT-${contactRequest._id.toString().slice(-6).toUpperCase()}`,
            expectedResponse: `${getExpectedResponseTime(data.inquiry.priority)} hours`,
            status: 'submitted'
        });
    }
    catch (error) {
        console.error('Error creating core team contact:', error);
        return res.status(500).json({
            error: 'Failed to create core team contact'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ecosystem.js.map