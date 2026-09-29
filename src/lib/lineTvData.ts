// ─────────────────────────────────────────────────────────────────────────────
// Line TV Display Data — Types & Static Configuration
// ─────────────────────────────────────────────────────────────────────────────
// This file contains types and initial data for the Line TV Display page.
// Once the backend API is ready, integrate API responses
// using the same interfaces/types so the UI components remain unchanged.
// ─────────────────────────────────────────────────────────────────────────────

// ── TYPES ────────────────────────────────────────────────────────────────────

export type WorkstationStatus = 'NORMAL' | 'ATTENTION' | 'CRITICAL'

export interface LineTvHeaderInfo {
  lineName: string
  order: string
  styleNumber: string
  styleName: string
}

export interface LineTvKPI {
  workstations: { total: number; normal: number; attention: number; critical: number }
  qoneSignal: { critical: number; attention: number }
  openCap: { value: number; sub: string }
  rework: { value: string; sub: string }
  rejection: { value: string; sub: string }
  dhu: { value: string; sub: string }
  input: { value: number; sub: string }
  output: { value: number; sub: string }
  efficiency: { value: string; sub: string }
}

export interface WorkstationCard {
  id: number
  operatorName: string
  operation: string
  tls: number
  rework: number
  rejection: number
  status: WorkstationStatus
}

// ── DATA ─────────────────────────────────────────────────────────────────────

export const LINE_TV_HEADER: LineTvHeaderInfo = {
  lineName: 'LINE 1',
  order: '158343',
  styleNumber: 'STYMA45678',
  styleName: 'Mens POLO',
}

export const LINE_TV_KPI: LineTvKPI = {
  workstations: { total: 35, normal: 30, attention: 4, critical: 1 },
  qoneSignal: { critical: 1, attention: 1 },
  openCap: { value: 3, sub: 'Action Req' },
  rework: { value: '6.20%', sub: '32 Pending' },
  rejection: { value: '1.10%', sub: '55 Pending' },
  dhu: { value: '7.10%', sub: 'Vs 5% Target' },
  input: { value: 1500, sub: 'WIP -2800' },
  output: { value: 18000, sub: 'vs 28000 PCS' },
  efficiency: { value: '61%', sub: 'vs 68% Target' },
}

export const WORKSTATION_CARDS: WorkstationCard[] = [
  // Row 1 (top row - 6 stations)
  { id: 1, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'CRITICAL' },
  { id: 2, operatorName: 'RANJITHA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'ATTENTION' },
  { id: 3, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 4, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'CRITICAL' },
  { id: 5, operatorName: 'RANJITHA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'ATTENTION' },
  { id: 6, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  // Row 2
  { id: 7, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 8, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 9, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'CRITICAL' },
  { id: 10, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 11, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 12, operatorName: 'RANJITHA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'ATTENTION' },
  // Row 3
  { id: 13, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 14, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 15, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 16, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 17, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'CRITICAL' },
  { id: 18, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  // Row 4
  { id: 19, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 20, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 21, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 22, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 23, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'ATTENTION' },
  { id: 24, operatorName: 'RANJITHA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  // Row 5
  { id: 25, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 26, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 27, operatorName: 'KAVITHA', operation: 'Shoulder Attach', tls: 5, rework: 7, rejection: 8, status: 'CRITICAL' },
  { id: 28, operatorName: 'LITHIKA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'NORMAL' },
  { id: 29, operatorName: 'RANJITHA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'ATTENTION' },
  { id: 30, operatorName: 'RANJITHA', operation: 'Rib Attach', tls: 5, rework: 7, rejection: 8, status: 'ATTENTION' },
]

export const DATA_REFRESH_INTERVAL = 15 // seconds
