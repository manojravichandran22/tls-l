import { type ValidationRules } from '@/lib/validation'

export interface Device {
  id: number
  uuid: string
  //tls_id: number | string
  tls_id: string
  // machine_no: string
  qr_code: string
  mac_id: string
  code?: string
  branch_id?: number
  branch_name?: string
  branch?: { id: number; branch_name?: string; name?: string }
  status: number
  is_active: number
  created_at?: string
  updated_at?: string
}

export interface BranchOption {
  id: number
  branch_name: string
}

export type FormField = 'tls_id' | 'qr_code' | 'mac_id' | 'branch_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  // tls_id: { required: 'TLS ID is required' },
  tls_id: {},
  // qr_code is generated automatically by backend
  mac_id: {},
  branch_id: { required: 'Branch is required' },
}

export function downloadQrCode(qrCode?: string, fileName = 'qr_code.png') {
  if (!qrCode) return
  const src = qrCode.startsWith('data:image/')
    ? qrCode
    : `data:image/png;base64,${qrCode}`

  const link = document.createElement('a')
  link.href = src
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
