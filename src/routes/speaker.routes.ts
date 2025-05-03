import { Router, Response, Request } from 'express';
import { prisma } from '../app';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';
import { convertToUTC, isWithinBusinessHours } from '../utils/time.utils';

const router = Router();

// Get all speakers (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const speakers = await prisma.speaker.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        expertise: true,
        pricePerSession: true,
        timeSlots: {
          where: {
            isBooked: false,
            date: {
              gte: new Date(),
            },
          },
        },
      },
    });
    res.json(speakers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching speakers' });
  }
});

// Update speaker profile (protected - speaker only)
router.put('/profile', authenticateToken, authorizeRole(['SPEAKER']), async (req: Request, res: Response) => {
  try {
    const { expertise, pricePerSession } = req.body;
    const speakerId = req.user?.id;

    if (!speakerId) {
      res.status(401).json({ message: 'Speaker not authenticated' });
      return;
    }

    const updatedSpeaker = await prisma.speaker.update({
      where: { id: speakerId },
      data: { expertise, pricePerSession },
    });

    res.json(updatedSpeaker);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Create time slots (protected - speaker only)
router.post('/time-slots', authenticateToken, authorizeRole(['SPEAKER']), async (req: Request, res: Response) => {
  try {
    const { date, slots } = req.body;
    const speakerId = req.user?.id;

    if (!speakerId) {
      res.status(401).json({ message: 'Speaker not authenticated' });
      return;
    }

    // Validate each time slot
    const invalidSlots = slots.filter((slot: any) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      return !isWithinBusinessHours(startTime) || !isWithinBusinessHours(endTime);
    });

    if (invalidSlots.length > 0) {
      res.status(400).json({ 
        message: 'Time slots must be between 9 AM and 4 PM IST',
        detail: 'Please provide all times in IST (UTC+5:30)'
      });
      return;
    }

    // Convert IST times to UTC for storage
    const createdSlots = await Promise.all(
      slots.map((slot: any) =>
        prisma.timeSlot.create({
          data: {
            speakerId,
            date: convertToUTC(new Date(date)),
            startTime: convertToUTC(new Date(slot.startTime)),
            endTime: convertToUTC(new Date(slot.endTime)),
          },
        })
      )
    );

    res.status(201).json(createdSlots);
  } catch (error) {
    res.status(500).json({ message: 'Error creating time slots' });
  }
});

// Get speaker's time slots (protected - speaker only)
router.get('/time-slots', authenticateToken, authorizeRole(['SPEAKER']), async (req: Request, res: Response) => {
  try {
    const speakerId = req.user?.id;

    if (!speakerId) {
      res.status(401).json({ message: 'Speaker not authenticated' });
      return;
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        speakerId,
        date: {
          gte: new Date(),
        },
      },
      include: {
        session: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching time slots' });
  }
});

export default router;