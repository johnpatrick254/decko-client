import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner";
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const delay = (ms = 100) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const syncUser = async (localId: string, authId: string) => {
  await fetch('/api/user/sync', { method: 'POST', body: JSON.stringify({ localId, authId }) })
};

export function timeAgo(dateString: Date) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1)
    return interval + "yr" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "hr ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "min ago";
  return "Just now";
};

export const formatDateParts = (dateString: string | undefined) => {
  if (!dateString) return { day: "??", month: "???" };

  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return {
        day: date.getDate().toString(),
        month: date.toLocaleString('default', { month: 'short' })
      };
    }
    const parts = dateString.split(/[\s,-\/]+/);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let day = "", month = "";

    for (const part of parts) {
      if (/^\d{1,2}$/.test(part) && parseInt(part) >= 1 && parseInt(part) <= 31) {
        day = part;
      }
      else if (isNaN(parseInt(part)) && part.length >= 3) {
        const monthIndex = monthNames.findIndex(m =>
          part.toLowerCase().startsWith(m.toLowerCase())
        );
        if (monthIndex !== -1) {
          month = monthNames[monthIndex].charAt(0).toUpperCase() + monthNames[monthIndex].slice(1, 3);
        }
      }
    }

    return {
      day: day || "??",
      month: month || "???"
    };
  } catch (e) {
    return { day: "??", month: "???" };
  }
};

export function formatTime(timeStr: string) {
  try {
    // Check if the time is already in AM/PM format
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    console.log(timeStr)
    // Parse the time from the timeStr (assuming 24-hour format like "14:30")
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));

    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    // Format the time with AM/PM
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.log('Error formatting time:', error);
    return timeStr;
  }
}

export function formatTimeWithTimezone(dateStr: string) {
  try {
    // Parse the date from the ISO string
    const dateWithTime = new Date(dateStr);

    // Check if time is exactly midnight (00:00:00.000)
    if (
      dateWithTime.getUTCHours() === 0 &&
      dateWithTime.getUTCMinutes() === 0 &&
      dateWithTime.getUTCSeconds() === 0 &&
      dateWithTime.getUTCMilliseconds() === 0
    ) {
      return null;
    }

    // Format the time with AM/PM and get the timezone abbreviation
    const formattedTime = dateWithTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Return the formatted time with timezone
    return `${formattedTime} `;
  } catch (error) {
    console.log(error)
    return dateStr
  }
}

/**
 * Extracts the date portion (YYYY-MM-DD) from an ISO datetime string or military time format
 * @param isoString - ISO datetime string (e.g., "2025-05-29T20:00:00.000Z")
 * @returns Date string in YYYY-MM-DD format or null if invalid
 */
export const extractDateFromISO = (isoString: string | undefined): string | null => {
  if (!isoString) return null;

  try {
    // Method 1: Direct string extraction (fastest for well-formed ISO strings)
    const isoMatch = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return isoMatch[1];
    }

    // Method 2: Parse as Date object and format (handles edge cases)
    const date = new Date(isoString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Method 3: Manual parsing for non-standard formats
    const parts = isoString.split(/[T\s]/)[0]; // Get everything before 'T' or space
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
      return parts;
    }

    return null;
  } catch (error) {
    console.warn('Error extracting date from ISO string:', error);
    return null;
  }
};

/**
 * Alternative version that returns a fallback value instead of null
 * @param isoString - ISO datetime string
 * @param fallback - Fallback value to return if extraction fails (default: "Invalid Date")
 * @returns Date string in YYYY-MM-DD format or fallback value
 */
export const extractDateFromISOWithFallback = (
  isoString: string | undefined,
  fallback: string = "Invalid Date"
): string => {
  return extractDateFromISO(isoString) ?? fallback;
};

/**
 * Extract date with custom format options
 * @param isoString - ISO datetime string
 * @param format - Output format: "YYYY-MM-DD" | "DD-MM-YYYY" | "MM-DD-YYYY"
 * @returns Formatted date string or null if invalid
 */
export const extractDateFromISOFormatted = (
  isoString: string | undefined,
  format: "YYYY-MM-DD" | "DD-MM-YYYY" | "MM-DD-YYYY" = "YYYY-MM-DD"
): string | null => {
  const dateStr = extractDateFromISO(isoString);
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split('-');

  switch (format) {
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "MM-DD-YYYY":
      return `${month}-${day}-${year}`;
    case "YYYY-MM-DD":
    default:
      return dateStr;
  }
};
