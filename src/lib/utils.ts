import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strip SQL LIKE wildcard chars that produce unintended results (% = match-all, \ = escape)
export function sanitizeSearch(val: string): string {
  return val.replace(/[%\\]/g, '')
}
