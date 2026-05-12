/**
 * Centralized formatting utilities for dates, numbers, and currency.
 * All formatting uses Swedish locale (sv-SE).
 */

/**
 * Format a date as "2026-05-12"
 */
export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("sv-SE");
}

/**
 * Format a date with time as "2026-05-12 14:30"
 */
export function formatDateTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date as relative time: "3 min sedan", "1 timme sedan", "2 dagar sedan"
 */
export function formatRelative(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "Just nu";
  if (minutes === 1) return "1 min sedan";
  if (minutes < 60) return `${minutes} min sedan`;
  if (hours === 1) return "1 timme sedan";
  if (hours < 24) return `${hours} timmar sedan`;
  if (days === 1) return "1 dag sedan";
  if (days < 7) return `${days} dagar sedan`;
  if (weeks === 1) return "1 vecka sedan";
  if (weeks < 4) return `${weeks} veckor sedan`;
  if (months === 1) return "1 manad sedan";
  if (months < 12) return `${months} manader sedan`;
  return formatDate(date);
}

/**
 * Format a date in long format: "12 maj 2026"
 */
export function formatDateLong(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format currency: "1 200 000 kr" or "1,2 MSEK" for large amounts
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    const msek = amount / 1_000_000;
    return `${msek.toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MSEK`;
  }
  return `${amount.toLocaleString("sv-SE")} kr`;
}

/**
 * Format number with space as thousands separator: "1 200"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("sv-SE");
}

/**
 * Format operating hours: "1 200 h"
 */
export function formatHours(hours: number): string {
  return `${formatNumber(hours)} h`;
}
