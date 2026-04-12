// import {
//   differenceInMinutes,
//   format,
//   isAfter,
//   isBefore,
//   isValid,
//   parse,
// } from "date-fns";
// import { Timestamp } from "firebase/firestore";

// /**
//  * Converts "HH:mm" string into Date (today)
//  */
// export function parseShiftTime(time: string): Date | null {
//   const parsed = parse(time, "HH:mm", new Date());
//   return isValid(parsed) ? parsed : null;
// }

// /**
//  * Format shift time safely
//  */
// export function formatShiftTime(time: string): string {
//   const date = parseShiftTime(time);
//   return date ? format(date, "hh:mm a") : "--:--";
// }

// /**
//  * Check if current time is late (clock-in)
//  */
// export function isLateFromShift(startTime: string, now: Date = new Date()) {
//   const start = parseShiftTime(startTime);
//   if (!start) return false;

//   return isAfter(now, start);
// }

// /**
//  * Check if current time is early leave (clock-out)
//  */
// export function isEarlyLeaveFromShift(endTime: string, now: Date = new Date()) {
//   const end = parseShiftTime(endTime);
//   if (!end) return false;

//   return isBefore(now, end);
// }

// // ---------- timestamp helpers ------------------------------------------------

// /**
//  * Format a Firestore Timestamp into a string (default 12‑hour time)
//  */
// export function formatTimestamp(
//   ts?: Timestamp | null,
//   fmt: string = "hh:mm a",
// ): string {
//   if (!ts) return "--:--";
//   return format(ts.toDate(), fmt);
// }

// /**
//  * Format a Firestore Timestamp into a date string (default long date)
//  */
// export function formatDate(
//   ts?: Timestamp | null,
//   fmt: string = "dd MMMM yyyy",
// ): string {
//   if (!ts) return "--";
//   return format(ts.toDate(), fmt);
// }

// /**
//  * Compute duration between two timestamps and return as "HH:mm:ss hrs".
//  */
// export function durationBetween(
//   start?: Timestamp | null,
//   end?: Timestamp | null,
// ): string {
//   if (!start || !end) return "--:--:-- hrs";
//   const minutes = differenceInMinutes(end.toDate(), start.toDate());
//   const hours = Math.floor(minutes / 60);
//   const mins = minutes % 60;
//   return `${String(hours).padStart(2, "0")}:
//     ${String(mins).padStart(2, "0")}:
//     00 hrs`.replace(/\s+/g, " ");
// }