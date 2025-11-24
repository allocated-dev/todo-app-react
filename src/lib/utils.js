import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getRandomUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  } else {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}

export function formatTodoDateTime(dateStr, timeStr) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert "HH:MM" → "H:MM AM/PM"
  const formatTimeTo12Hour = (t) => {
    if (!t) return "";
    const [hour, minute] = t.split(":").map(Number);

    let h = hour % 12 || 12;
    let ampm = hour >= 12 ? "PM" : "AM";

    return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const formattedTime = formatTimeTo12Hour(timeStr);

  if (date.getTime() === today.getTime()) {
    return formattedTime;
  }

  const weekday = date.toLocaleString("en-US", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });

  return `${weekday}, ${day} ${month} at ${formattedTime}`;
}
