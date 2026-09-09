import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';

const router: Router = express.Router();

// Get all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 20, status, category } = req.query;
    
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }

    const events = await mongoose.connection.db
      .collection('events')
      .find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .toArray();

    return res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create new event
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const event = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await mongoose.connection.db
      .collection('events')
      .insertOne(event);
    
    return res.status(201).json({ 
      success: true, 
      event: { _id: result.insertedId, ...event }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const result = await mongoose.connection.db
      .collection('events')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );
    
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
  } catch (error: any) {
    console.error('Error updating event:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete event
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { id } = req.params;
    
    const result = await mongoose.connection.db
      .collection('events')
      .deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
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
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router; 