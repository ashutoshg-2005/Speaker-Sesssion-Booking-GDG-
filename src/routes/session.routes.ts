import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';
  import { sendSessionConfirmation, createCalendarEvent, sendSessionCancellation } from '../services/notification.service';
import { convertToIST } from '../utils/time.utils';

const router = Router();

// Book a session (protected - user only)
router.post('/book', authenticateToken, authorizeRole(['USER']), async (req: Request, res: Response) => {
  try {
    const { timeSlotId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Check if time slot exists and is not booked
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { speaker: true },
    });

    if (!timeSlot) {
      res.status(404).json({ message: 'Time slot not found' });
      return;
    }

    if (timeSlot.isBooked) {
      res.status(400).json({ message: 'Time slot already booked' });
      return;
    }

    // Check if slot is in the past
    const now = new Date();
    if (timeSlot.startTime < now) {
      res.status(400).json({ message: 'Cannot book a slot that is in the past' });
      return;
    }

    // Check if slot is within business hours (9 AM to 4 PM IST)
    const istStartTime = convertToIST(timeSlot.startTime);
    const istEndTime = convertToIST(timeSlot.endTime);
    const startHour = istStartTime.getHours();
    const endHour = istEndTime.getHours();

    if (startHour < 9 || endHour > 16) {
      res.status(400).json({ 
        message: 'Time slot is outside business hours (9 AM to 4 PM IST)',
        detail: {
          slotTime: `${istStartTime.toLocaleTimeString('en-IN')} - ${istEndTime.toLocaleTimeString('en-IN')} IST`,
        }
      });
      return;
    }

    // Create session and update time slot
    const session = await prisma.session.create({
      data: {
        userId,
        speakerId: timeSlot.speakerId,
        timeSlotId,
      },
      include: {
        user: true,
        speaker: true,
        timeSlot: true,
      },
    });

    // Mark time slot as booked
    await prisma.timeSlot.update({
      where: { id: timeSlotId },
      data: { isBooked: true },
    });

    // Send notifications with IST times
    const sessionDetails = {
      date: istStartTime.toLocaleDateString('en-IN'),
      startTime: istStartTime.toLocaleTimeString('en-IN'),
      endTime: istEndTime.toLocaleTimeString('en-IN'),
      speakerName: `${timeSlot.speaker.firstName} ${timeSlot.speaker.lastName}`,
      userName: `${session.user.firstName} ${session.user.lastName}`,
    };

    // Send email confirmation
    await sendSessionConfirmation(
      session.user.email,
      session.speaker.email,
      sessionDetails
    );

    // Try to create calendar event
    const calendarResult = await createCalendarEvent(
      session.user.email,
      session.speaker.email,
      sessionDetails
    );

    // Return the session with calendar info
    res.status(201).json({
      ...session,
      calendar: calendarResult.success 
        ? { eventUrl: calendarResult.eventUrl }
        : { 
            needsAuth: true,
            authUrl: calendarResult.authUrl,
            message: calendarResult.message
          }
    });
  } catch (error) {
    console.error('Session booking error:', error);
    res.status(500).json({ 
      message: 'Error booking session',
      detail: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get user's booked sessions (protected - user only)
router.get('/my-sessions', authenticateToken, authorizeRole(['USER']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: { userId },
      include: {
        speaker: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            expertise: true,
          },
        },
        timeSlot: true,
      },
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

// Cancel a session (protected - user only)
router.delete('/:sessionId', authenticateToken, authorizeRole(['USER']), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get the complete session details including user and speaker for emails
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        timeSlot: true,
        user: true,
        speaker: true 
      },
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to cancel this session' });
      return;
    }

    // Prepare session details for email notifications
    const istStartTime = convertToIST(session.timeSlot.startTime);
    const istEndTime = convertToIST(session.timeSlot.endTime);
    const istDate = convertToIST(session.timeSlot.date);
    
    const sessionDetails = {
      date: istDate.toLocaleDateString('en-IN'),
      startTime: istStartTime.toLocaleTimeString('en-IN'),
      endTime: istEndTime.toLocaleTimeString('en-IN'),
      speakerName: `${session.speaker.firstName} ${session.speaker.lastName}`,
      userName: `${session.user.firstName} ${session.user.lastName}`,
    };

    // Delete session and update time slot
    await Promise.all([
      prisma.session.delete({ where: { id: sessionId } }),
      prisma.timeSlot.update({
        where: { id: session.timeSlotId },
        data: { isBooked: false },
      }),
    ]);

    // Send cancellation emails to both user and speaker
    try {
      await sendSessionCancellation(
        session.user.email,
        session.speaker.email,
        sessionDetails
      );
      console.log('Cancellation emails sent successfully');
    } catch (emailError) {
      console.error('Failed to send cancellation emails:', emailError);
      // We don't want to fail the cancellation if just the emails fail
    }

    res.json({ message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Session cancellation error:', error);
    res.status(500).json({ 
      message: 'Error cancelling session',
      detail: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Confirm a session (protected - speaker only)
router.put('/:sessionId/confirm', authenticateToken, authorizeRole(['SPEAKER']), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const speakerId = req.user?.id;

    if (!speakerId) {
      res.status(401).json({ message: 'Speaker not authenticated' });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { speaker: true, user: true, timeSlot: true },
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    if (session.speakerId !== speakerId) {
      res.status(403).json({ message: 'Not authorized to confirm this session' });
      return;
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CONFIRMED' },
      include: {
        user: true,
        speaker: true,
        timeSlot: true,
      },
    });

    // Send confirmation emails
    const sessionDetails = {
      date: convertToIST(session.timeSlot.date).toLocaleDateString('en-IN'),
      startTime: convertToIST(session.timeSlot.startTime).toLocaleTimeString('en-IN'),
      endTime: convertToIST(session.timeSlot.endTime).toLocaleTimeString('en-IN'),
      speakerName: `${session.speaker.firstName} ${session.speaker.lastName}`,
      userName: `${session.user.firstName} ${session.user.lastName}`,
    };

    await sendSessionConfirmation(
      session.user.email,
      session.speaker.email,
      sessionDetails
    );

    res.json(updatedSession);
  } catch (error) {
    console.error('Session confirmation error:', error);
    res.status(500).json({ message: 'Error confirming session' });
  }
});

export default router;