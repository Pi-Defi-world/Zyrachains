"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BusinessListing_1 = __importDefault(require("../zyrachain-lib/lib/models/BusinessListing"));
const StartupListing_1 = __importDefault(require("../zyrachain-lib/lib/models/StartupListing"));
const CommunityListing_1 = __importDefault(require("../zyrachain-lib/lib/models/CommunityListing"));
const InfluencerListing_1 = __importDefault(require("../zyrachain-lib/lib/models/InfluencerListing"));
const UpdateListing_1 = __importDefault(require("../zyrachain-lib/lib/models/UpdateListing"));
const ProjectListing_1 = __importDefault(require("../zyrachain-lib/lib/models/ProjectListing"));
const AdvertisingInquiry_1 = __importDefault(require("../zyrachain-lib/lib/models/AdvertisingInquiry"));
const listing_social_stats_1 = require("../zyrachain-lib/lib/listing-social-stats");
function wantsSocialStats(req) {
    const v = req.query.socialStats ?? req.query.social;
    return v === '1' || v === 'true' || v === 'yes';
}
const router = express_1.default.Router();
router.get('/business', async (req, res) => {
    try {
        const listings = await BusinessListing_1.default.find({ status: 'approved' })
            .sort({ featured: -1, createdAt: -1 })
            .limit(50);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching business listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch business listings'
        });
    }
});
router.post('/business', async (req, res) => {
    try {
        const listing = new BusinessListing_1.default(req.body);
        await listing.save();
        return res.status(201).json({
            success: true,
            listing
        });
    }
    catch (error) {
        console.error('Error creating business listing:', error);
        return res.status(500).json({
            error: 'Failed to create business listing'
        });
    }
});
router.put('/business/:id', async (req, res) => {
    try {
        const updated = await BusinessListing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Business listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating business listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/business/:id', async (req, res) => {
    try {
        const deleted = await BusinessListing_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Business listing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Business listing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting business listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/startup', async (req, res) => {
    try {
        const listings = await StartupListing_1.default.find({ status: 'approved' })
            .sort({ featured: -1, createdAt: -1 })
            .limit(50);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching startup listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch startup listings'
        });
    }
});
router.post('/startup', async (req, res) => {
    try {
        const listing = new StartupListing_1.default(req.body);
        await listing.save();
        return res.status(201).json({
            success: true,
            listing
        });
    }
    catch (error) {
        console.error('Error creating startup listing:', error);
        return res.status(500).json({
            error: 'Failed to create startup listing'
        });
    }
});
router.put('/startup/:id', async (req, res) => {
    try {
        const updated = await StartupListing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Startup listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating startup listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/startup/:id', async (req, res) => {
    try {
        const deleted = await StartupListing_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Startup listing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Startup listing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting startup listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/community', async (req, res) => {
    try {
        const withSocial = wantsSocialStats(req);
        const listings = await CommunityListing_1.default.find({ status: 'approved' })
            .sort({ featured: -1, createdAt: -1 })
            .limit(50)
            .lean();
        let payload = listings;
        if (withSocial) {
            const enriched = await (0, listing_social_stats_1.enrichCommunityListings)(listings);
            payload = (0, listing_social_stats_1.sortCommunitiesByTelegramMembers)(enriched);
        }
        return res.json({
            success: true,
            listings: payload,
            socialStats: withSocial,
        });
    }
    catch (error) {
        console.error('Error fetching community listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch community listings'
        });
    }
});
router.post('/community', async (req, res) => {
    try {
        const listing = new CommunityListing_1.default(req.body);
        await listing.save();
        return res.status(201).json({
            success: true,
            listing
        });
    }
    catch (error) {
        console.error('Error creating community listing:', error);
        return res.status(500).json({
            error: 'Failed to create community listing'
        });
    }
});
router.put('/community/:id', async (req, res) => {
    try {
        const updated = await CommunityListing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Community listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating community listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/community/:id', async (req, res) => {
    try {
        const deleted = await CommunityListing_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Community listing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Community listing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting community listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/influencer', async (req, res) => {
    try {
        const withSocial = wantsSocialStats(req);
        const listings = await InfluencerListing_1.default.find({ status: 'approved' })
            .sort({ featured: -1, createdAt: -1 })
            .limit(50)
            .lean();
        let payload = listings;
        if (withSocial) {
            const enriched = await (0, listing_social_stats_1.enrichInfluencerListings)(listings);
            payload = (0, listing_social_stats_1.sortInfluencersByTwitterFollowers)(enriched);
        }
        return res.json({
            success: true,
            listings: payload,
            socialStats: withSocial,
        });
    }
    catch (error) {
        console.error('Error fetching influencer listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch influencer listings'
        });
    }
});
router.post('/influencer', async (req, res) => {
    try {
        const listing = new InfluencerListing_1.default(req.body);
        await listing.save();
        return res.status(201).json({
            success: true,
            listing
        });
    }
    catch (error) {
        console.error('Error creating influencer listing:', error);
        return res.status(500).json({
            error: 'Failed to create influencer listing'
        });
    }
});
router.put('/influencer/:id', async (req, res) => {
    try {
        const updated = await InfluencerListing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Influencer listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating influencer listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/influencer/:id', async (req, res) => {
    try {
        const deleted = await InfluencerListing_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Influencer listing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Influencer listing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting influencer listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/project', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status, search } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (status)
            query.status = status;
        if (search) {
            query.$text = { $search: search };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [projects, total] = await Promise.all([
            ProjectListing_1.default.find(query)
                .sort(search ? { score: { $meta: 'textScore' } } : { submittedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ProjectListing_1.default.countDocuments(query)
        ]);
        return res.json({
            success: true,
            projects,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching project listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch project listings'
        });
    }
});
router.post('/project', async (req, res) => {
    try {
        const project = new ProjectListing_1.default(req.body);
        await project.save();
        return res.status(201).json({
            success: true,
            project
        });
    }
    catch (error) {
        console.error('Error creating project listing:', error);
        return res.status(500).json({
            error: 'Failed to create project listing'
        });
    }
});
router.put('/project/:id', async (req, res) => {
    try {
        const updated = await ProjectListing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Project listing not found'
            });
        }
        return res.json({
            success: true,
            project: updated
        });
    }
    catch (error) {
        console.error('Error updating project listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/project/:id', async (req, res) => {
    try {
        const deleted = await ProjectListing_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Project listing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Project listing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting project listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/all', async (req, res) => {
    try {
        const [business, startup, community, influencer] = await Promise.all([
            BusinessListing_1.default.find({ status: 'approved' }).limit(10),
            StartupListing_1.default.find({ status: 'approved' }).limit(10),
            CommunityListing_1.default.find({ status: 'approved' }).limit(10),
            InfluencerListing_1.default.find({ status: 'approved' }).limit(10)
        ]);
        return res.json({
            success: true,
            listings: {
                business,
                startup,
                community,
                influencer
            }
        });
    }
    catch (error) {
        console.error('Error fetching all listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch listings'
        });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { q, type, category } = req.query;
        const query = { status: 'approved' };
        if (q) {
            query.$text = { $search: q };
        }
        if (category) {
            query.category = category;
        }
        let listings = [];
        if (!type || type === 'all') {
            const [business, startup, community, influencer] = await Promise.all([
                BusinessListing_1.default.find(query).limit(25),
                StartupListing_1.default.find(query).limit(25),
                CommunityListing_1.default.find(query).limit(25),
                InfluencerListing_1.default.find(query).limit(25)
            ]);
            listings = [
                ...business.map((l) => ({ ...l.toObject(), type: 'business' })),
                ...startup.map((l) => ({ ...l.toObject(), type: 'startup' })),
                ...community.map((l) => ({ ...l.toObject(), type: 'community' })),
                ...influencer.map((l) => ({ ...l.toObject(), type: 'influencer' }))
            ];
        }
        else {
            let Model;
            switch (type) {
                case 'business':
                    Model = BusinessListing_1.default;
                    break;
                case 'startup':
                    Model = StartupListing_1.default;
                    break;
                case 'community':
                    Model = CommunityListing_1.default;
                    break;
                case 'influencer':
                    Model = InfluencerListing_1.default;
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid listing type'
                    });
            }
            listings = await Model.find(query).limit(50);
        }
        return res.json({
            success: true,
            listings,
            total: listings.length
        });
    }
    catch (error) {
        console.error('Error searching listings:', error);
        return res.status(500).json({
            error: 'Search failed'
        });
    }
});
router.get('/update', async (req, res) => {
    try {
        const listings = await UpdateListing_1.default.find({ status: 'approved' })
            .sort({ featured: -1, createdAt: -1 })
            .limit(50);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching update listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch update listings'
        });
    }
});
router.post('/update', async (req, res) => {
    try {
        const listing = new UpdateListing_1.default(req.body);
        await listing.save();
        return res.status(201).json({
            success: true,
            listing
        });
    }
    catch (error) {
        console.error('Error creating update listing:', error);
        return res.status(500).json({
            error: 'Failed to create update listing'
        });
    }
});
router.put('/update/:id', async (req, res) => {
    try {
        const updated = await UpdateListing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Update listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating update listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.delete('/update/:id', async (req, res) => {
    try {
        const deleted = await UpdateListing_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Update listing not found'
            });
        }
        return res.json({
            success: true,
            message: 'Update listing deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting update listing:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/admin/community', async (req, res) => {
    try {
        const listings = await CommunityListing_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching all community listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch community listings'
        });
    }
});
router.get('/admin/influencer', async (req, res) => {
    try {
        const listings = await InfluencerListing_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching all influencer listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch influencer listings'
        });
    }
});
router.get('/admin/business', async (req, res) => {
    try {
        const listings = await BusinessListing_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching all business listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch business listings'
        });
    }
});
router.get('/admin/startup', async (req, res) => {
    try {
        const listings = await StartupListing_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching all startup listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch startup listings'
        });
    }
});
router.get('/admin/project', async (req, res) => {
    try {
        const listings = await ProjectListing_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching all project listings:', error);
        return res.status(500).json({
            error: 'Failed to fetch project listings'
        });
    }
});
router.put('/admin/community/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }
        const updated = await CommunityListing_1.default.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Community listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating community status:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.put('/admin/influencer/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }
        const updated = await InfluencerListing_1.default.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Influencer listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating influencer status:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.put('/admin/business/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }
        const updated = await BusinessListing_1.default.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Business listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating business status:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.put('/admin/startup/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }
        const updated = await StartupListing_1.default.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Startup listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating startup status:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.put('/admin/project/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }
        const updated = await ProjectListing_1.default.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Project listing not found'
            });
        }
        return res.json({
            success: true,
            listing: updated
        });
    }
    catch (error) {
        console.error('Error updating project status:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/admin/advertising', async (req, res) => {
    try {
        const inquiries = await AdvertisingInquiry_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json({
            success: true,
            inquiries
        });
    }
    catch (error) {
        console.error('Error fetching all advertising inquiries:', error);
        return res.status(500).json({
            error: 'Failed to fetch advertising inquiries'
        });
    }
});
router.put('/admin/advertising/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }
        const updated = await AdvertisingInquiry_1.default.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Advertising inquiry not found'
            });
        }
        return res.json({
            success: true,
            inquiry: updated
        });
    }
    catch (error) {
        console.error('Error updating advertising inquiry status:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=listings.js.map