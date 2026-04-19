import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function calculateTotalTime(start: string, end: string): string {
  if (!start || !end) return '0h 0m';
  try {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    const diff = endMins - startMins;
    if (diff < 0) return '0h 0m';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  } catch (e) {
    return '0h 0m';
  }
}
