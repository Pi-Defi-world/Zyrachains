import express, { Request, Response, Router } from 'express';
import BusinessListing from '../zyrachain-lib/lib/models/BusinessListing';
import StartupListing from '../zyrachain-lib/lib/models/StartupListing';
import CommunityListing from '../zyrachain-lib/lib/models/CommunityListing';
import InfluencerListing from '../zyrachain-lib/lib/models/InfluencerListing';
import UpdateListing from '../zyrachain-lib/lib/models/UpdateListing';
import ProjectListing from '../zyrachain-lib/lib/models/ProjectListing';
import AdvertisingInquiry from '../zyrachain-lib/lib/models/AdvertisingInquiry';
import {
  enrichCommunityListings,
  enrichInfluencerListings,
  sortCommunitiesByTelegramMembers,
  sortInfluencersByTwitterFollowers,
} from '../zyrachain-lib/lib/listing-social-stats';

function wantsSocialStats(req: Request): boolean {
  const v = req.query.socialStats ?? req.query.social;
  return v === '1' || v === 'true' || v === 'yes';
}


const router: Router = express.Router();

// Business Listings
router.get('/business', async (req: Request, res: Response) => {
  try {
    const listings = await BusinessListing.find({ status: 'approved' })
      .sort({ featured: -1, createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching business listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch business listings'
    });
  }
});

router.post('/business', async (req: Request, res: Response) => {
  try {
    const listing = new BusinessListing(req.body);
    await listing.save();

    return res.status(201).json({
      success: true,
      listing
    });
  } catch (error: any) {
    console.error('Error creating business listing:', error);
    return res.status(500).json({
      error: 'Failed to create business listing'
    });
  }
});

// Update Business Listing
router.put('/business/:id', async (req: Request, res: Response) => {
  try {
    const updated = await BusinessListing.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating business listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Business Listing
router.delete('/business/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await BusinessListing.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting business listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Startup Listings
router.get('/startup', async (req: Request, res: Response) => {
  try {
    const listings = await StartupListing.find({ status: 'approved' })
      .sort({ featured: -1, createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching startup listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch startup listings'
    });
  }
});

router.post('/startup', async (req: Request, res: Response) => {
  try {
    const listing = new StartupListing(req.body);
    await listing.save();

    return res.status(201).json({
      success: true,
      listing
    });
  } catch (error: any) {
    console.error('Error creating startup listing:', error);
    return res.status(500).json({
      error: 'Failed to create startup listing'
    });
  }
});

// Update Startup Listing
router.put('/startup/:id', async (req: Request, res: Response) => {
  try {
    const updated = await StartupListing.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating startup listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Startup Listing
router.delete('/startup/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await StartupListing.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting startup listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Community Listings
router.get('/community', async (req: Request, res: Response) => {
  try {
    const withSocial = wantsSocialStats(req);
    const listings = await CommunityListing.find({ status: 'approved' })
      .sort({ featured: -1, createdAt: -1 })
      .limit(50)
      .lean();

    let payload: unknown[] = listings as unknown[];
    if (withSocial) {
      const enriched = await enrichCommunityListings(listings as { telegram?: string }[]);
      payload = sortCommunitiesByTelegramMembers(enriched) as unknown[];
    }

    return res.json({
      success: true,
      listings: payload,
      socialStats: withSocial,
    });
  } catch (error: any) {
    console.error('Error fetching community listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch community listings'
    });
  }
});

router.post('/community', async (req: Request, res: Response) => {
  try {
    const listing = new CommunityListing(req.body);
    await listing.save();

    return res.status(201).json({
      success: true,
      listing
    });
  } catch (error: any) {
    console.error('Error creating community listing:', error);
    return res.status(500).json({
      error: 'Failed to create community listing'
    });
  }
});

// Update Community Listing
router.put('/community/:id', async (req: Request, res: Response) => {
  try {
    const updated = await CommunityListing.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating community listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Community Listing
router.delete('/community/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await CommunityListing.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting community listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Influencer Listings
router.get('/influencer', async (req: Request, res: Response) => {
  try {
    const withSocial = wantsSocialStats(req);
    const listings = await InfluencerListing.find({ status: 'approved' })
      .sort({ featured: -1, createdAt: -1 })
      .limit(50)
      .lean();

    let payload: unknown[] = listings as unknown[];
    if (withSocial) {
      const enriched = await enrichInfluencerListings(listings as { twitter?: string }[]);
      payload = sortInfluencersByTwitterFollowers(enriched) as unknown[];
    }

    return res.json({
      success: true,
      listings: payload,
      socialStats: withSocial,
    });
  } catch (error: any) {
    console.error('Error fetching influencer listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch influencer listings'
    });
  }
});

router.post('/influencer', async (req: Request, res: Response) => {
  try {
    const listing = new InfluencerListing(req.body);
    await listing.save();

    return res.status(201).json({
      success: true,
      listing
    });
  } catch (error: any) {
    console.error('Error creating influencer listing:', error);
    return res.status(500).json({
      error: 'Failed to create influencer listing'
    });
  }
});

// Update Influencer Listing
router.put('/influencer/:id', async (req: Request, res: Response) => {
  try {
    const updated = await InfluencerListing.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating influencer listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Influencer Listing
router.delete('/influencer/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await InfluencerListing.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting influencer listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Project Listings
router.get('/project', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    
    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      ProjectListing.find(query)
        .sort(search ? { score: { $meta: 'textScore' } } : { submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ProjectListing.countDocuments(query)
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
  } catch (error: any) {
    console.error('Error fetching project listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch project listings'
    });
  }
});

router.post('/project', async (req: Request, res: Response) => {
  try {
    const project = new ProjectListing(req.body);
    await project.save();

    return res.status(201).json({
      success: true,
      project
    });
  } catch (error: any) {
    console.error('Error creating project listing:', error);
    return res.status(500).json({
      error: 'Failed to create project listing'
    });
  }
});

// Update Project Listing
router.put('/project/:id', async (req: Request, res: Response) => {
  try {
    const updated = await ProjectListing.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating project listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Project Listing
router.delete('/project/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await ProjectListing.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting project listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generic endpoints for all listing types
router.get('/all', async (req: Request, res: Response) => {
  try {
    const [business, startup, community, influencer] = await Promise.all([
      BusinessListing.find({ status: 'approved' }).limit(10),
      StartupListing.find({ status: 'approved' }).limit(10),
      CommunityListing.find({ status: 'approved' }).limit(10),
      InfluencerListing.find({ status: 'approved' }).limit(10)
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
  } catch (error: any) {
    console.error('Error fetching all listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch listings'
    });
  }
});

// Search across all listing types
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, type, category } = req.query;
    const query: any = { status: 'approved' };

    if (q) {
      query.$text = { $search: q as string };
    }

    if (category) {
      query.category = category;
    }

    let listings: any[] = [];

    if (!type || type === 'all') {
      // Search all types
      const [business, startup, community, influencer] = await Promise.all([
        BusinessListing.find(query).limit(25),
        StartupListing.find(query).limit(25),
        CommunityListing.find(query).limit(25),
        InfluencerListing.find(query).limit(25)
      ]);

      listings = [
        ...business.map((l: any) => ({ ...l.toObject(), type: 'business' })),
        ...startup.map((l: any) => ({ ...l.toObject(), type: 'startup' })),
        ...community.map((l: any) => ({ ...l.toObject(), type: 'community' })),
        ...influencer.map((l: any) => ({ ...l.toObject(), type: 'influencer' }))
      ];
    } else {
      // Search specific type
      let Model;
      switch (type) {
        case 'business':
          Model = BusinessListing;
          break;
        case 'startup':
          Model = StartupListing;
          break;
        case 'community':
          Model = CommunityListing;
          break;
        case 'influencer':
          Model = InfluencerListing;
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
  } catch (error: any) {
    console.error('Error searching listings:', error);
    return res.status(500).json({
      error: 'Search failed'
    });
  }
});

// Update Listings
router.get('/update', async (req: Request, res: Response) => {
  try {
    const listings = await UpdateListing.find({ status: 'approved' })
      .sort({ featured: -1, createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching update listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch update listings'
    });
  }
});

router.post('/update', async (req: Request, res: Response) => {
  try {
    const listing = new UpdateListing(req.body);
    await listing.save();

    return res.status(201).json({
      success: true,
      listing
    });
  } catch (error: any) {
    console.error('Error creating update listing:', error);
    return res.status(500).json({
      error: 'Failed to create update listing'
    });
  }
});

// Update Update Listing
router.put('/update/:id', async (req: Request, res: Response) => {
  try {
    const updated = await UpdateListing.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating update listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Update Listing
router.delete('/update/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await UpdateListing.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting update listing:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Admin endpoints for management (returns all listings regardless of status)
router.get('/admin/community', async (req: Request, res: Response) => {
  try {
    const listings = await CommunityListing.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching all community listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch community listings'
    });
  }
});

router.get('/admin/influencer', async (req: Request, res: Response) => {
  try {
    const listings = await InfluencerListing.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching all influencer listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch influencer listings'
    });
  }
});

router.get('/admin/business', async (req: Request, res: Response) => {
  try {
    const listings = await BusinessListing.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching all business listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch business listings'
    });
  }
});

router.get('/admin/startup', async (req: Request, res: Response) => {
  try {
    const listings = await StartupListing.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching all startup listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch startup listings'
    });
  }
});

router.get('/admin/project', async (req: Request, res: Response) => {
  try {
    const listings = await ProjectListing.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      listings
    });
  } catch (error: any) {
    console.error('Error fetching all project listings:', error);
    return res.status(500).json({
      error: 'Failed to fetch project listings'
    });
  }
});

// Admin endpoints for status management
router.put('/admin/community/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await CommunityListing.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating community status:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/admin/influencer/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await InfluencerListing.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating influencer status:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/admin/business/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await BusinessListing.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating business status:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/admin/startup/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await StartupListing.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating startup status:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/admin/project/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await ProjectListing.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating project status:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/admin/advertising', async (req: Request, res: Response) => {
  try {
    const inquiries = await AdvertisingInquiry.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      inquiries
    });
  } catch (error: any) {
    console.error('Error fetching all advertising inquiries:', error);
    return res.status(500).json({
      error: 'Failed to fetch advertising inquiries'
    });
  }
});

router.put('/admin/advertising/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await AdvertisingInquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating advertising inquiry status:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 
