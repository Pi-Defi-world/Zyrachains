import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { authenticateAdmin } from '../middleware/auth';
import connectToDatabase from '../zyrachain-lib/lib/mongodb';

const router: Router = express.Router();

function db(): mongoose.mongo.Db {
  const database = mongoose.connection.db;
  if (!database) {
    throw new Error('Database connection not established');
  }
  return database;
}

router.post('/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const ipAddress =
      req.body.ipAddress ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      'unknown';
    const userAgent = req.body.userAgent || req.headers['user-agent'] || 'unknown';

    const contactData = {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      status: 'new',
      priority: 'normal',
      ipAddress,
      userAgent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db()
      .collection('contactInquiries')
      .insertOne(contactData);

    return res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        inquiryId: result.insertedId,
        status: contactData.status,
      },
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

router.get('/contact', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;

    const collection = db().collection('contactInquiries');

    const inquiries = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await collection.countDocuments(filter);

    const statusCounts = await collection
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray();

    const priorityCounts = await collection
      .aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }])
      .toArray();

    return res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        statusCounts,
        priorityCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching contact inquiries:', error);
    return res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

router.get('/contact/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const inquiry = await db()
      .collection('contactInquiries')
      .findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    return res.json({ success: true, data: inquiry });
  } catch (error) {
    console.error('Error fetching contact inquiry:', error);
    return res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

router.patch('/contact/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    if (status) {
      const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    if (priority) {
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.adminNotes = notes;

    const result = await db()
      .collection('contactInquiries')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    return res.json({ success: true, message: 'Inquiry updated successfully' });
  } catch (error) {
    console.error('Error updating contact inquiry:', error);
    return res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

router.post('/report-scam', async (req: Request, res: Response) => {
  try {
    const {
      walletAddress,
      description,
      evidence,
      reporterContact,
      scamType,
    } = req.body;

    if (!description || !scamType) {
      return res.status(400).json({
        error: 'Missing required fields: description and scamType are required',
      });
    }

    const validScamTypes = [
      'fake_project',
      'phishing',
      'suspicious_wallet',
      'fake_giveaway',
      'impersonation',
      'other',
    ];

    if (!validScamTypes.includes(scamType)) {
      return res.status(400).json({ error: 'Invalid scam type' });
    }

    if (reporterContact) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(reporterContact)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const ipAddress =
      req.body.ipAddress ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      'unknown';
    const userAgent = req.body.userAgent || req.headers['user-agent'] || 'unknown';

    const reportData = {
      scamType: String(scamType).trim(),
      walletAddress: walletAddress ? String(walletAddress).trim() : '',
      description: String(description).trim(),
      evidence: evidence ? String(evidence).trim() : '',
      reporterContact: reporterContact
        ? String(reporterContact).toLowerCase().trim()
        : '',
      status: 'new',
      priority: 'normal',
      ipAddress,
      userAgent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db()
      .collection('scamReports')
      .insertOne(reportData);

    return res.status(201).json({
      success: true,
      message: 'Scam report submitted successfully',
      data: {
        reportId: result.insertedId,
        status: reportData.status,
        priority: reportData.priority,
      },
    });
  } catch (error) {
    console.error('Error submitting scam report:', error);
    return res.status(500).json({ error: 'Failed to submit scam report' });
  }
});

router.get('/report-scam', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const scamType = req.query.scamType as string | undefined;
    const priority = req.query.priority as string | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (scamType && scamType !== 'all') filter.scamType = scamType;
    if (priority && priority !== 'all') filter.priority = priority;

    const collection = db().collection('scamReports');

    const reports = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await collection.countDocuments(filter);

    const statusCounts = await collection
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray();

    const scamTypeCounts = await collection
      .aggregate([{ $group: { _id: '$scamType', count: { $sum: 1 } } }])
      .toArray();

    return res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        statusCounts,
        scamTypeCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching scam reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/report-scam/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const report = await db()
      .collection('scamReports')
      .findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching scam report:', error);
    return res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.patch('/report-scam/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    if (status) {
      const validStatuses = ['new', 'under_review', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    if (priority) {
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.adminNotes = notes;

    const result = await db()
      .collection('scamReports')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json({ success: true, message: 'Report updated successfully' });
  } catch (error) {
    console.error('Error updating scam report:', error);
    return res.status(500).json({ error: 'Failed to update report' });
  }
});

export default router;