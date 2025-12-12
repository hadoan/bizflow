import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "EUR"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(numAmount);
}

export function formatDate(date: Date | string, formatStr = "dd.MM.yyyy"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd.MM.yyyy HH:mm");
}

export function calculateVAT(netAmount: number, vatRate: number): number {
  return netAmount * vatRate;
}

export function calculateGross(netAmount: number, vatRate: number): number {
  return netAmount + calculateVAT(netAmount, vatRate);
}

export function calculateNet(grossAmount: number, vatRate: number): number {
  return grossAmount / (1 + vatRate);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function parseDecimal(value: string | number): number {
  if (typeof value === "number") return value;
  return parseFloat(value.replace(",", "."));
}
