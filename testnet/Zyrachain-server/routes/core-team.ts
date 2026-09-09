import express, { Request, Response, Router } from 'express';
import CoreTeamContact from '../zyrachain-lib/lib/models/CoreTeamContact';

const router: Router = express.Router();

// GET all core team contacts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      category, 
      search 
    } = req.query;

    const query: any = {};
    
    if (status) query.status = status;
    if (priority) query['inquiry.priority'] = priority;
    if (category) query['inquiry.category'] = category;
    
    if (search) {
      query.$or = [
        { 'contactInfo.name': { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'inquiry.subject': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
      CoreTeamContact.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CoreTeamContact.countDocuments(query)
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
  } catch (error: any) {
    console.error('Error fetching core team contacts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch core team contacts'
    });
  }
});

// GET single core team contact
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contact = await CoreTeamContact.findById(req.params.id);
    
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
  } catch (error: any) {
    console.error('Error fetching core team contact:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch core team contact'
    });
  }
});

// POST create new core team contact
router.post('/', async (req: Request, res: Response) => {
  try {
    const contact = new CoreTeamContact(req.body);
    await contact.save();

    return res.status(201).json({
      success: true,
      contact
    });
  } catch (error: any) {
    console.error('Error creating core team contact:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create core team contact'
    });
  }
});

// PUT update core team contact
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await CoreTeamContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Error updating core team contact:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE core team contact
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await CoreTeamContact.findByIdAndDelete(req.params.id);

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
  } catch (error: any) {
    console.error('Error deleting core team contact:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET dashboard stats for core team contacts
router.get('/stats/dashboard', async (req: Request, res: Response) => {
  try {
    const [
      totalContacts,
      newContacts,
      inProgressContacts,
      overdueContacts,
      priorityBreakdown
    ] = await Promise.all([
      CoreTeamContact.countDocuments(),
      CoreTeamContact.countDocuments({ status: 'new' }),
      CoreTeamContact.countDocuments({ status: 'in_progress' }),
      CoreTeamContact.aggregate([
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
      CoreTeamContact.aggregate([
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
        }, {} as Record<string, number>)
      }
    });
  } catch (error: any) {
    console.error('Error fetching core team contact stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

export default router; 