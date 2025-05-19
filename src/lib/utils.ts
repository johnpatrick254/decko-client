import { clsx, type ClassValue } from "clsx"
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
