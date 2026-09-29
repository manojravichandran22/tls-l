'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import Toggle from '@/components/ui/Toggle'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import { apiCall } from '@/services/apiClient'
import type { Order, StyleOption, FormErrors, FormTouched } from './types'
import { orderRules } from './types'

interface SizeRow {
  size: string
  ord_qty: string
  _key: string
}

import { useBranchAccess } from '@/hooks/useBranchAccess'

interface BranchOption {
  id: number
  branch_name: string
}

interface OrderFormProps {
  order: Order | null
  branches?: BranchOption[]
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => Promise<{ success?: boolean; message?: string }>
}

function calcProdQty(ordQty: string, prodPer: string): number {
  const qty = parseFloat(ordQty) || 0
  const per = parseFloat(prodPer) || 0
  return Math.ceil(qty * (per / 100))
}

export default function OrderForm({ order, branches = [], onClose, onSave }: OrderFormProps) {
  const isEdit = !!order
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const [form, setForm] = useState({
    buyer: (order as any)?.buyer ?? order?.style?.buyer ?? '',
    branch_id: order?.branch_id?.toString() ?? (order as any)?.branch?.id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
    order_no: order?.order_no?.toString() ?? '',
    colour: order?.colour ?? '',
    order_qty: order?.order_qty?.toString() ?? '',
    prod_per: order?.orderSizes?.[0]?.prod_per?.toString() ?? order?.prod_per?.toString() ?? '',
    link_to_style: !!order?.style_id,
    style_id: order?.style_id?.toString() ?? '',
    ex_fac_date: order?.ex_fac_date ? order.ex_fac_date.split('T')[0] : '',
    cost_of_pic: order?.cost_of_pic?.toString() ?? '',
    currency_type: order?.currency_type ?? '',
    notes: (order as any)?.notes ?? order?.notes ?? '',
  })

  useEffect(() => {
    if (!form.branch_id && userBranchId) {
      setForm(f => ({ ...f, branch_id: String(userBranchId) }))
    }
  }, [userBranchId, form.branch_id])

  const [sizeRows, setSizeRows] = useState<SizeRow[]>(
    order?.orderSizes?.length
      ? order.orderSizes.map((s, i) => ({ size: s.size, ord_qty: String(s.ord_qty), _key: s.id?.toString() ?? `row-${i}` }))
      : [{ size: '', ord_qty: '', _key: 'row-0' }]
  )

  const [colours, setColours] = useState<string[]>([])
  const [styles, setStyles] = useState<StyleOption[]>([])
  const [buyers, setBuyers] = useState<{ id: number; value: string }[]>([])
  const [currencies, setCurrencies] = useState<{ id: number; value: string }[]>([])
  const [addingColour, setAddingColour] = useState(false)
  const [newColour, setNewColour] = useState('')
  const newColourRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [formError, setFormError] = useState('')

  const activeBranchId = form.branch_id || (userBranchId ? String(userBranchId) : '')

  useEffect(() => {
    const payloadBuyer: Record<string, unknown> = { type: 'buyer' }
    if (activeBranchId) payloadBuyer.branch_id = activeBranchId

    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload: payloadBuyer,
    })
      .then(res => {
        const records = res?.data?.records?.buyer ?? res?.data?.buyer ?? (Array.isArray(res?.data?.records) ? res.data.records : [])
        setBuyers(Array.isArray(records) ? records : [])
      })
      .catch(() => { })

    const payloadCurrency: Record<string, unknown> = { type: 'currency' }
    if (activeBranchId) payloadCurrency.branch_id = activeBranchId

    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload: payloadCurrency,
    })
      .then(res => {
        const records = res?.data?.records?.currency ?? res?.data?.currency ?? (Array.isArray(res?.data?.records) ? res.data.records : [])
        setCurrencies(Array.isArray(records) ? records : [])
      })
      .catch(() => { })

    const payloadColors: Record<string, unknown> = {}
    if (activeBranchId) payloadColors.branch_id = activeBranchId

    apiCall<any>('/order/getcolors', {
      method: 'GET',
      encrypt: false,
      payload: payloadColors,
    })
      .then(res => {
        const cols = res?.data?.colors ?? res?.colors ?? (Array.isArray(res?.data) ? res.data : [])
        setColours(Array.isArray(cols) ? cols : [])
      })
      .catch(() => { })

    const payloadStyles: Record<string, unknown> = { page: 1, per_page: 500, status: 'all', search: '' }
    if (activeBranchId) payloadStyles.branch_id = activeBranchId

    apiCall<any>('/styles/list', {
      method: 'GET',
      encrypt: false,
      payload: payloadStyles,
    })
      .then(res => {
        const d = res?.data
        const stList = d?.styles ?? d?.records ?? (Array.isArray(d) ? d : (Array.isArray(res?.styles) ? res.styles : []))
        setStyles(Array.isArray(stList) ? stList : [])
      })
      .catch(() => { })
  }, [activeBranchId])

  useEffect(() => {
    if (addingColour) newColourRef.current?.focus()
  }, [addingColour])

  // ── Field helpers ───────────────────────────────────────────────────────────────
  const setField = (key: keyof typeof form, val: string | boolean) => {
    setForm(f => ({ ...f, [key]: val }))
    if (key in orderRules && touched[key as keyof FormTouched]) {
      setErrors(e => ({ ...e, [key]: validateField(String(val), orderRules[key as keyof typeof orderRules]) }))
    }
  }

  const handleBlur = (key: keyof FormErrors) => {
    setTouched(t => ({ ...t, [key]: true }))
    if (key in orderRules)
      setErrors(e => ({ ...e, [key]: validateField(form[key as keyof typeof form] as string, orderRules[key as keyof typeof orderRules]) }))
  }

  // ── Size rows ───────────────────────────────────────────────────────────────────

  // ── Colour add-new ──────────────────────────────────────────────────────────────
  const confirmNewColour = () => {
    const trimmed = newColour.trim()
    if (!trimmed) return
    setColours(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
    setForm(f => ({ ...f, colour: trimmed }))
    setNewColour('')
    setAddingColour(false)
  }

  const addRow = () =>
    setSizeRows(prev => [...prev, { size: '', ord_qty: '', _key: `row-${Date.now()}` }])

  const removeRow = (i: number) =>
    setSizeRows(prev => prev.filter((_, idx) => idx !== i))

  const setRow = (i: number, field: keyof SizeRow, val: string) =>
    setSizeRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))

  // ── Totals ──────────────────────────────────────────────────────────────────────
  const totalOrderQty = sizeRows.reduce((s, r) => s + (parseInt(r.ord_qty) || 0), 0)
  const totalProdQty = sizeRows.reduce((s, r) => s + calcProdQty(r.ord_qty, form.prod_per), 0)
  const isQtyMatch = (parseInt(form.order_qty) || 0) === totalOrderQty

  // ── Submit ──────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({
      buyer: true,
      branch_id: true,
      order_no: true,
      colour: true,
      order_qty: true,
      prod_per: true,
      ex_fac_date: true,
      currency_type: true,
      cost_of_pic: true,
    })
    const allErrors = validateAll(
      {
        buyer: form.buyer,
        branch_id: form.branch_id,
        order_no: form.order_no,
        colour: form.colour,
        order_qty: form.order_qty,
        prod_per: form.prod_per,
        ex_fac_date: form.ex_fac_date,
        currency_type: form.currency_type,
        cost_of_pic: form.cost_of_pic,
      },
      orderRules
    )
    setErrors(allErrors as FormErrors)
    if (hasErrors(allErrors)) return

    const rowsInvalid = sizeRows.some(r => !r.size.trim() || !r.ord_qty.trim())
    if (rowsInvalid) { setFormError('All size rows require Size and Order Qty'); return }

    if (!isQtyMatch) {
      setFormError(`Total size quantity (${totalOrderQty}) must match the main Order Qty (${form.order_qty || 0})`);
      return;
    }

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        buyer: form.buyer,
        branch_id: form.branch_id ? Number(form.branch_id) : undefined,
        order_no: form.order_no,
        colour: form.colour,
        notes: form.notes ? form.notes.trim() : null,
        style_id: form.link_to_style ? (form.style_id || '') : '',
        order_size: sizeRows.map(r => ({
          size: r.size,
          ord_qty: r.ord_qty,
          prod_per: form.prod_per || '0',
        })),
        ex_fac_date: form.ex_fac_date || null,
        cost_of_pic: form.cost_of_pic ? parseFloat(form.cost_of_pic) : null,
        currency_type: form.currency_type || null,
        // Include order id for updates
        ...(isEdit && order?.id ? { order_id: order.id } : {}),
      }
      if (isEdit) payload.uuid = order.uuid;
      const res = await onSave(payload)
      if (res.success === false) { setFormError(res.message || 'Save failed'); return }
      onClose()
    } catch {
      setFormError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const INPUT_CLS =
    'w-full h-input-h px-2.5 text-sm2 font-inherit text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus-ring/15 placeholder:text-t-lighter'

  return (
    <Modal
      title={isEdit ? 'Edit Order' : 'Add Order'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="order-form" isLoading={saving} disabled={!isQtyMatch || saving}>
            {isEdit ? 'Update Order' : 'Add Order'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}

      <form id="order-form" onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Buyer & Branch Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">
              Buyer <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={form.buyer}
                onChange={e => {
                  setField('buyer', e.target.value)
                  if (touched.buyer) setErrors(er => ({ ...er, buyer: e.target.value ? '' : 'Buyer is required' }))
                }}
                onBlur={() => handleBlur('buyer')}
                className={`${INPUT_CLS} appearance-none pr-7 cursor-pointer ${errors.buyer && touched.buyer ? 'border-red-500' : ''}`}
              >
                <option value="">Select buyer...</option>
                {buyers.map(b => <option key={b.id} value={b.value}>{b.value}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
            </div>
            {errors.buyer && touched.buyer && (
              <span className="text-xs text-red-500 mt-0.5">{errors.buyer}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">
              Branch <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={form.branch_id}
                onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, branch_id: val, colour: '' }))
                  if (touched.branch_id) setErrors(er => ({ ...er, branch_id: val ? '' : 'Branch is required', colour: undefined }))
                }}
                onBlur={() => handleBlur('branch_id')}
                disabled={!isAdmin}
                className={`${INPUT_CLS} appearance-none pr-7 ${!isAdmin ? 'cursor-not-allowed opacity-80 bg-card-alt' : 'cursor-pointer'} ${errors.branch_id && touched.branch_id ? 'border-red-500' : ''}`}
              >
                <option value="">Select branch...</option>
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
            </div>
            {errors.branch_id && touched.branch_id && (
              <span className="text-xs text-red-500 mt-0.5">{errors.branch_id}</span>
            )}
          </div>
        </div>

        {/* Row 1: Order No. + Colour */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Order No."
            value={form.order_no}
            onChange={e => setField('order_no', e.target.value)}
            onBlur={() => handleBlur('order_no')}
            placeholder="Eg.1234"
            error={errors.order_no}
            touched={touched.order_no}
            required
          />

          {/* Colour with add-new */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">
              Colour <span className="text-red-400 ml-0.5">*</span>
            </label>
            {addingColour ? (
              <div className="flex gap-1">
                <input
                  ref={newColourRef}
                  value={newColour}
                  onChange={e => setNewColour(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmNewColour() } if (e.key === 'Escape') { setAddingColour(false); setNewColour('') } }}
                  placeholder="Type new colour"
                  className={INPUT_CLS}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={confirmNewColour}
                  className="h-input-h px-2 shrink-0"
                >
                  <Check size={13} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setAddingColour(false); setNewColour('') }}
                  className="h-input-h px-2 shrink-0"
                >
                  <X size={13} />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={form.colour}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      setAddingColour(true)
                      return
                    }
                    setField('colour', e.target.value)
                    if (touched.colour) setErrors(er => ({ ...er, colour: e.target.value ? '' : 'Colour is required' }))
                  }}
                  onBlur={() => handleBlur('colour')}
                  disabled={!form.branch_id}
                  className={`${INPUT_CLS} appearance-none pr-7 ${!form.branch_id ? 'cursor-not-allowed opacity-80 bg-card-alt' : 'cursor-pointer'} ${errors.colour && touched.colour ? 'border-red-500' : ''}`}
                >
                  <option value="">{form.branch_id ? 'Select colour...' : 'Select branch first'}</option>
                  {colours.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__add_new__">+ Create new colour</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
              </div>
            )}
            {errors.colour && touched.colour && (
              <span className="text-xs text-red-500 mt-0.5">{errors.colour}</span>
            )}
          </div>
        </div>

        {/* Row 2: Order Qty + Prod Qty % */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Order Qty"
            type="number"
            min="0"
            step="1"
            value={form.order_qty}
            onChange={e => setField('order_qty', e.target.value)}
            onBlur={() => handleBlur('order_qty')}
            placeholder="0"
            error={errors.order_qty}
            touched={touched.order_qty}
            required
          />
          <FormInput
            label="Prod. Qty %"
            type="number"
            min="0"
            step="0.01"
            value={form.prod_per}
            onChange={e => setField('prod_per', e.target.value)}
            onBlur={() => handleBlur('prod_per')}
            placeholder="0"
            rightIcon={<span className="text-xs text-t-lighter font-medium pointer-events-none">%</span>}
            error={errors.prod_per}
            touched={touched.prod_per}
            required
          />
        </div>

        {/* Row 3: Ex-Factory Date + Currency & Cost */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Ex-Factory Date"
            type="date"
            min={todayStr}
            value={form.ex_fac_date}
            onChange={e => setField('ex_fac_date', e.target.value)}
            onBlur={() => handleBlur('ex_fac_date')}
            error={errors.ex_fac_date}
            touched={touched.ex_fac_date}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-t-body">
                Currency Type <span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.currency_type}
                  onChange={e => {
                    setField('currency_type', e.target.value)
                    if (touched.currency_type) setErrors(er => ({ ...er, currency_type: e.target.value ? '' : 'Currency type is required' }))
                  }}
                  onBlur={() => handleBlur('currency_type')}
                  className={`${INPUT_CLS} appearance-none pr-7 cursor-pointer ${errors.currency_type && touched.currency_type ? 'border-red-500' : ''}`}
                >
                  <option value="">Select...</option>
                  {currencies.map(curr => (
                    <option key={curr.id} value={curr.value}>
                      {curr.value}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
              </div>
              {errors.currency_type && touched.currency_type && (
                <span className="text-xs text-red-500 mt-0.5">{errors.currency_type}</span>
              )}
            </div>
            <FormInput
              label="Factory Cost/Piece"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_of_pic}
              onChange={e => setField('cost_of_pic', e.target.value)}
              onBlur={() => handleBlur('cost_of_pic')}
              placeholder="0.00"
              error={errors.cost_of_pic}
              touched={touched.cost_of_pic}
              required
            />
          </div>
        </div>

        {/* Notes Field */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-t-body">
            Notes
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder="Enter any additional notes..."
            className="w-full px-2.5 py-2 text-sm2 font-inherit text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus-ring/15 placeholder:text-t-lighter resize-none"
          />
        </div>

        {/* Size wise order qty table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-t-body">Size wise order qty</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              leftIcon={<Plus size={12} />}
              className="text-xs font-semibold text-accent border-accent/40 hover:bg-accent/5"
            >
              Add New
            </Button>
          </div>

          <div className="rounded-card border border-table-line overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-table-head">
                  <th className="px-3 py-2 text-left font-semibold text-t-lighter">Size</th>
                  <th className="px-3 py-2 text-right font-semibold text-t-lighter">O. Qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-t-lighter">Prod qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-t-lighter">Total qty</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {sizeRows.map((row, i) => {
                  const effectiveOrdQty = row.ord_qty
                  const prodQty = calcProdQty(effectiveOrdQty, form.prod_per)
                  return (
                    <tr key={row._key} className={`border-t border-table-line ${i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}>
                      {/* Size */}
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.size}
                          onChange={e => setRow(i, 'size', e.target.value)}
                          placeholder="e.g. XL"
                          className="w-full h-7 px-2 text-xs bg-input border border-input-line rounded outline-none focus:border-accent text-t-secondary"
                        />
                      </td>
                      {/* O. Qty */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.ord_qty}
                          onChange={e => setRow(i, 'ord_qty', e.target.value)}
                          placeholder="0"
                          className="w-full h-7 px-2 text-xs text-right bg-input border border-input-line rounded outline-none focus:border-accent text-t-secondary"
                        />
                      </td>
                      {/* Prod qty — readonly */}
                      <td className="px-3 py-1.5 text-right">
                        <span className="text-xs font-semibold text-t-primary">
                          {effectiveOrdQty ? prodQty.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
                        </span>
                      </td>
                      {/* Total qty — readonly */}
                      <td className="px-3 py-1.5 text-right">
                        <span className="text-xs font-semibold text-t-primary">
                          {effectiveOrdQty ? ((parseInt(effectiveOrdQty) || 0) + prodQty).toLocaleString('en-IN') : '—'}
                        </span>
                      </td>
                      {/* Delete */}
                      <td className="px-2 py-1.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeRow(i)}
                          disabled={sizeRows.length === 1}
                          className="p-1 h-auto text-t-lighter hover:text-red-500 hover:bg-transparent disabled:opacity-30"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Summary */}
              <tfoot>
                <tr className="border-t-2 border-table-line bg-table-head">
                  <td className="px-3 py-2 text-xs font-semibold text-t-body">Total</td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-t-primary">
                    {totalOrderQty.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-t-primary">
                    {parseFloat(totalProdQty.toFixed(2)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-t-primary">
                    {(totalOrderQty + totalProdQty).toLocaleString('en-IN')}
                  </td>
                  <td />
                </tr>
                <tr className="bg-table-head border-t border-table-line">
                  <td className="px-3 py-1.5 text-2xs text-t-lighter">{sizeRows.length} Sizes</td>
                  <td className="px-3 py-1.5 text-right text-2xs text-t-lighter">Order qty</td>
                  <td className="px-3 py-1.5 text-right text-2xs text-t-lighter">Prod qty</td>
                  <td className="px-3 py-1.5 text-right text-2xs text-t-lighter">Total qty</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Link to Style toggle */}
        <div className="flex flex-col gap-2 pt-1 border-t border-table-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-t-body">Link to Style</span>
            <Toggle checked={form.link_to_style} onChange={val => setField('link_to_style', val)} />
          </div>

          {form.link_to_style && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-t-body">Select an existing style</label>
              <div className="relative">
                <select
                  value={form.style_id}
                  onChange={e => setField('style_id', e.target.value)}
                  className={`${INPUT_CLS} appearance-none pr-7 cursor-pointer`}
                >
                  <option value="">Select style...</option>
                  {styles.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.buyer} | {s.style_no} | {s.style_name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
              </div>
            </div>
          )}
        </div>

      </form>
    </Modal>
  )
}
