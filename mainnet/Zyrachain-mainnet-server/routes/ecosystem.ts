import express, { Request, Response, Router } from 'express';
import EcosystemEvent from '../zyrachain-lib/lib/models/EcosystemEvent';
import EcosystemHackathon from '../zyrachain-lib/lib/models/EcosystemHackathon';
import EcosystemCommunity from '../zyrachain-lib/lib/models/EcosystemCommunity';
import CoreTeamContact from '../zyrachain-lib/lib/models/CoreTeamContact';
import mongoose from 'mongoose';
import {
  enrichEcosystemCommunityDocuments,
  enrichEcosystemInfluencerDocuments,
  sortEcosystemCommunitiesByMembers,
  sortEcosystemInfluencersByFollowers,
} from '../zyrachain-lib/lib/ecosystem-social-enrich';

const router: Router = express.Router();

function wantsSocialStats(req: Request): boolean {
  const v = req.query.socialStats ?? req.query.social;
  return v === '1' || v === 'true' || v === 'yes';
}

// Get all ecosystem data
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    console.log('🔍 Ecosystem route called with type:', type);
    console.log('🔍 mongoose.connection:', !!mongoose.connection);
    console.log('🔍 mongoose.connection.readyState:', mongoose.connection?.readyState);
    
    if (type === 'communities') {
      let communities: Record<string, unknown>[] = (await mongoose.connection
        .collection('communities')
        .find({})
        .toArray()) as Record<string, unknown>[];
      console.log('🔍 Found communities:', communities.length);
      const withSocial = wantsSocialStats(req);
      if (withSocial) {
        communities = sortEcosystemCommunitiesByMembers(
          await enrichEcosystemCommunityDocuments(communities)
        );
      }
      return res.json({ success: true, data: communities, socialStats: withSocial });
    } else if (type === 'events') {
      const events = await mongoose.connection.collection('ecosystemevents').find({}).toArray();
      console.log('🔍 Found events:', events.length);
      return res.json({ success: true, data: events });
    
    } else if (type === 'hackathons') {
      const hackathons = await mongoose.connection.collection('ecosystemhackathons').find({}).toArray();
      console.log('🔍 Found hackathons:', hackathons.length);
      return res.json({ success: true, data: hackathons });
    } else if (type === 'cex-addresses') {
      const addresses = await mongoose.connection.collection('cex-addresses').find({}).toArray();
      console.log('🔍 Found cex-addresses:', addresses.length);
      return res.json({ success: true, data: addresses });
    } else if (type === 'core-team-addresses') {
      const addressesRaw = await mongoose.connection.collection('core-team-addresses').find({}).toArray();
      const addresses = addressesRaw.map((addr: Record<string, unknown>) => ({
        ...addr,
        Name:
          (addr.Name as string | undefined) ??
          (addr.name as string | undefined) ??
          'Pi Core Team',
      }));
      console.log('🔍 Found core-team-addresses:', addresses.length);
      return res.json({ success: true, data: addresses });
    } else if (type === 'generated-addresses') {
      try {
        const addresses = await mongoose.connection.collection('generated-addresses').find({}).toArray();
        console.log('🔍 Found generated-addresses:', addresses.length);
        
        // Filter out invalid or problematic addresses
        const validAddresses = addresses.filter(addr => {
          // Check if address has required fields
          if (!addr.identifier || !addr.Name) {
            console.log('🔍 Skipping invalid address:', addr);
            return false;
          }
          
          // Check if identifier looks like a valid Stellar address
          if (!addr.identifier.match(/^G[A-Z0-9]{55}$/)) {
            console.log('🔍 Skipping invalid Stellar address format:', addr.identifier);
            return false;
          }
          
          return true;
        });
        
        console.log('🔍 Valid generated-addresses:', validAddresses.length);
        return res.json({ success: true, data: validAddresses });
      } catch (error: any) {
        console.error('Error fetching generated addresses:', error);
        // Return empty array instead of error for generated addresses
        return res.json({ success: true, data: [] });
      }
    } else if (type === 'influencers') {
      let influencers: Record<string, unknown>[] = (await mongoose.connection
        .collection('influencers')
        .find({})
        .toArray()) as Record<string, unknown>[];
      console.log('🔍 Found influencers:', influencers.length);
      const withSocial = wantsSocialStats(req);
      if (withSocial) {
        influencers = sortEcosystemInfluencersByFollowers(
          await enrichEcosystemInfluencerDocuments(influencers)
        );
      }
      return res.json({ success: true, data: influencers, socialStats: withSocial });
    } else {
      // Return all data if no type specified
      const [events, hackathons, communities] = await Promise.all([
        mongoose.connection.collection('ecosystemevents').find({}).toArray(),
        mongoose.connection.collection('ecosystemhackathons').find({}).toArray(),
        mongoose.connection.collection('communities').find({}).toArray()
      ]);

      return res.json({
        events,
        hackathons,
        communities
      });
    }
  } catch (error: any) {
    console.error('Error fetching ecosystem data:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ error: 'Failed to fetch ecosystem data', details: error.message });
  }
});

// Events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { limit = 20, status = 'active' } = req.query;
    
    const query: any = {};
    if (status) {
      query.isActive = status === 'active';
    }

    const events = await EcosystemEvent.find(query)
      .sort({ startDate: -1 })
      .limit(Number(limit));

    return res.json({ events });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events', async (req: Request, res: Response) => {
  try {
    const event = new EcosystemEvent(req.body);
    await event.save();
    
    return res.status(201).json({ 
      success: true, 
      event 
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update Event
router.put('/events/:id', async (req: Request, res: Response) => {
  try {
    const updated = await EcosystemEvent.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating event:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Event
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await EcosystemEvent.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Hackathons
router.get('/hackathons', async (req: Request, res: Response) => {
  try {
    const { limit = 20, status = 'active' } = req.query;
    
    const query: any = {};
    if (status) {
      query.isActive = status === 'active';
    }

    const hackathons = await EcosystemHackathon.find(query)
      .sort({ startDate: -1 })
      .limit(Number(limit));

    return res.json({ hackathons });
  } catch (error: any) {
    console.error('Error fetching hackathons:', error);
    return res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

router.post('/hackathons', async (req: Request, res: Response) => {
  try {
    const hackathon = new EcosystemHackathon(req.body);
    await hackathon.save();
    
    return res.status(201).json({ 
      success: true, 
      hackathon 
    });
  } catch (error: any) {
    console.error('Error creating hackathon:', error);
    return res.status(500).json({ error: 'Failed to create hackathon' });
  }
});

// Update Hackathon
router.put('/hackathons/:id', async (req: Request, res: Response) => {
  try {
    const updated = await EcosystemHackathon.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
  } catch (error: any) {
    console.error('Error updating hackathon:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Hackathon
router.delete('/hackathons/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await EcosystemHackathon.findByIdAndDelete(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error deleting hackathon:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Communities
router.get('/communities', async (req: Request, res: Response) => {
  try {
    const { limit = 50, category } = req.query;
    
    const query: any = {};
    if (category) {
      query.category = category;
    }

    const communities = await EcosystemCommunity.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ communities });
  } catch (error: any) {
    console.error('Error fetching communities:', error);
    return res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

router.post('/communities', async (req: Request, res: Response) => {
  try {
    const community = new EcosystemCommunity(req.body);
    await community.save();
    
    return res.status(201).json({ 
      success: true, 
      community 
    });
  } catch (error: any) {
    console.error('Error creating community:', error);
    return res.status(500).json({ error: 'Failed to create community' });
  }
});

// Core Team Contacts
router.get('/core-team-contacts', async (req: Request, res: Response) => {
  try {
    const contacts = await CoreTeamContact.find({ status: 'active' })
      .sort({ priority: 1, createdAt: -1 })
      .limit(50);

    return res.json({ contacts });
  } catch (error: any) {
    console.error('Error fetching core team contacts:', error);
    return res.status(500).json({ error: 'Failed to fetch core team contacts' });
  }
});

router.post('/core-team-contacts', async (req: Request, res: Response) => {
  try {
    const contact = new CoreTeamContact(req.body);
    await contact.save();
    
    return res.status(201).json({ 
      success: true, 
      contact 
    });
  } catch (error: any) {
    console.error('Error creating core team contact:', error);
    return res.status(500).json({ error: 'Failed to create core team contact' });
  }
});

// Core Team Contact Routes
router.get('/core-team-contact', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, priority, status, assignedTo } = req.query;
    
    const query: any = {};
    if (category) query['inquiry.category'] = category;
    if (priority) query['inquiry.priority'] = priority;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
      CoreTeamContact.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CoreTeamContact.countDocuments(query)
    ]);

    // Add virtual isOverdue field
    const contactsWithVirtuals = contacts.map(contact => {
      const now = new Date();
      const deadlineTime = new Date(contact.submittedAt).getTime() + (contact.expectedResponseTime * 60 * 60 * 1000);
      const isOverdue = contact.status !== 'resolved' && contact.status !== 'closed' && now.getTime() > deadlineTime;
      
      return {
        ...contact,
        isOverdue,
        ticketNumber: `CT-${(contact._id as any).toString().slice(-6).toUpperCase()}`
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
  } catch (error: any) {
    console.error('Error fetching core team contacts:', error);
    return res.status(500).json({
      error: 'Failed to fetch core team contacts'
    });
  }
});

router.post('/core-team-contact', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Calculate expected response time based on priority
    const getExpectedResponseTime = (priority: string) => {
      switch (priority) {
        case 'urgent': return 4;   // 4 hours
        case 'high': return 24;    // 1 day
        case 'medium': return 72;  // 3 days
        case 'low': return 168;    // 1 week
        default: return 72;
      }
    };

    // Clean up project info if provided
    let projectInfo;
    if (data.projectInfo) {
      projectInfo = {
        ...data.projectInfo,
        website: data.projectInfo.website === '' ? undefined : data.projectInfo.website
      };
    }

    // Create new contact request
    const contactRequest = new CoreTeamContact({
      ...data,
      projectInfo,
      status: 'new',
      submittedAt: new Date(),
      followUpRequired: data.inquiry.priority === 'urgent' || data.inquiry.priority === 'high',
      expectedResponseTime: getExpectedResponseTime(data.inquiry.priority)
    });

    await contactRequest.save();

    // Determine response message based on priority
    const getResponseMessage = (priority: string) => {
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
  } catch (error: any) {
    console.error('Error creating core team contact:', error);
    return res.status(500).json({
      error: 'Failed to create core team contact'
    });
  }
});

export default router;
