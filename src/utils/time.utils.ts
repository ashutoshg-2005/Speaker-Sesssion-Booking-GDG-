export const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

export const convertToIST = (date: Date): Date => {
    const istDate = new Date(date.getTime() + IST_OFFSET);
    return istDate;
};

export const convertToUTC = (istDate: Date): Date => {
    const utcDate = new Date(istDate.getTime() - IST_OFFSET);
    return utcDate;
};

export const parseISTString = (dateTimeString: string): Date => {
    // Assume the input is in IST
    const date = new Date(dateTimeString);
    return convertToUTC(date); // Convert to UTC for storage
};

export const isWithinBusinessHours = (time: Date): boolean => {
    const istTime = convertToIST(time);
    const hours = istTime.getUTCHours();
    // Strictly enforce 9 AM to 4 PM IST
    return hours >= 9 && hours <= 16;
};

export const formatISTTime = (date: Date): string => {
    const istDate = convertToIST(date);
    return istDate.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'  // Since we already converted to IST
    });
};

export const isValidBusinessHour = (dateStr: string): boolean => {
  const date = new Date(dateStr); // Input is already in IST
  const hours = date.getHours();
  // Check if time is between 9 AM and 4 PM IST
  return hours >= 9 && hours < 16;
};

export const validateTimeSlot = (startTime: string, endTime: string): boolean => {
  const start = new Date(startTime); // Input is already in IST
  const end = new Date(endTime);     // Input is already in IST

  // Get hours in IST (times are already in IST from client)
  const startHour = start.getHours();
  const endHour = end.getHours();

  // Check if within business hours (9 AM - 4 PM IST)
  if (startHour < 9 || endHour > 16) {
    throw new Error('Sessions must be scheduled between 9 AM and 4 PM IST');
  }

  // Ensure session is in future
  if (start < new Date()) {
    throw new Error('Cannot book sessions in the past');
  }

  // Validate session duration (1 hour)
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  if (durationHours !== 1) {
    throw new Error('Sessions must be exactly 1 hour long');
  }

  return true;
};