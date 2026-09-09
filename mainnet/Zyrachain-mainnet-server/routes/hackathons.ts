import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';

const router: Router = express.Router();

// Get all hackathons
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 20, status } = req.query;
    
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const hackathons = await mongoose.connection.db
      .collection('hackathons')
      .find(query)
      .sort({ startDate: -1 })
      .limit(Number(limit))
      .toArray();

    return res.json({ hackathons });
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    return res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

// Create new hackathon
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const hackathon = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await mongoose.connection.db
      .collection('hackathons')
      .insertOne(hackathon);
    
    return res.status(201).json({ 
      success: true, 
      hackathon: { _id: result.insertedId, ...hackathon }
    });
  } catch (error) {
    console.error('Error creating hackathon:', error);
    return res.status(500).json({ error: 'Failed to create hackathon' });
  }
});

// Update hackathon
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
      .collection('hackathons')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );
    
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
  } catch (error: any) {
    console.error('Error updating hackathon:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete hackathon
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { id } = req.params;
    
    const result = await mongoose.connection.db
      .collection('hackathons')
      .deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
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
  } catch (error: any) {
    console.error('Error deleting hackathon:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router; 