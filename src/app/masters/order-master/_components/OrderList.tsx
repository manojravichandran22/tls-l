"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  Eye,
  MoreVertical,
  Download,
  Upload,
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AdvancedTable, { type ActionItem } from "@/components/ui/AdvancedTable";
import { usePermissions } from "@/hooks/usePermissions";
import { useExportPdf } from "@/hooks/useExportPdf";
import { useExport } from "@/hooks/useExport";
import { formatDate } from "@/lib/formatDate";
import type { Order } from "./types";

const SELECT_CLS =
  "h-8 px-2.5 pr-7 text-xs bg-card border border-input-line rounded-input outline-none focus:border-accent text-t-body appearance-none cursor-pointer";

interface BranchOption { id: number; branch_name: string }

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'order_no', label: 'Order No.' },
  { key: 'colour', label: 'Colour' },
  { key: 'ex_fac_date', label: 'Ex-Factory Date' },
  { key: 'order_qty', label: 'Order Qty' },
  { key: 'prod_qty', label: 'Prod Qty' },
  { key: 'tot_prd_ord_qty', label: 'Total Qty' },
  { key: 'input_qty', label: 'Input Qty' },
  { key: 'rej_qty', label: 'Rej Qty' },
  { key: 'rej_per', label: 'Rej %' },
  { key: 'output_qty', label: 'Output Qty' },
  { key: 'wip', label: 'WIP' },
  { key: 'rework_qty', label: 'Rework' },
  { key: 'rework_per', label: 'RW %' },
  { key: 'notes', label: 'Notes' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'input_qty' || h === 'input_0qty') {
      set.add('input_qty')
      set.add('input_0qty')
    }
    if (h === 'status' || h === 'is_active') {
      set.add('status')
      set.add('is_active')
    }
  })
  return Array.from(set)
}

interface OrderListProps {
  data: Order[];
  loading: boolean;
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  search: string;
  orderNoFilter: string;
  colour: string;
  status: string;
  page: number;
  perPage: number;
  totalPages: number;
  totalCount: number;
  colours: string[];
  onSearchChange: (v: string) => void;
  onOrderNoFilterChange: (v: string) => void;
  onColourChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onAdd: () => void;
  onEdit: (row: Order) => void;
  onDelete: (row: Order) => void;
  onView: (uuid: string) => void;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
  isAdmin?: boolean;
  branches?: BranchOption[];
  branchFilter?: string;
  onBranchFilterChange?: (v: string) => void;
  effectiveBranchId?: string;
}

export default function OrderList({
  data,
  loading,
  selected,
  onSelectionChange,
  search,
  orderNoFilter,
  colour,
  status,
  page,
  perPage,
  totalPages,
  totalCount,
  colours,
  onSearchChange,
  onOrderNoFilterChange,
  onColourChange,
  onStatusChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  onPerPageChange,
  isAdmin = false,
  branches = [],
  branchFilter = '',
  onBranchFilterChange = () => { },
  effectiveBranchId = '',
}: OrderListProps) {
  const { can } = usePermissions('Order')
  const canCreate = can('order.create')
  const canView = can('order.show')
  const canEdit = can('order.update')
  const canDelete = can('order.delete')

  const [showExportMenu, setShowExportMenu] = useState(false)

  // Column checkbox heading state for export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={selectedHeadings.includes(key)}
        onChange={() => toggleHeading(key)}
        className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
        title={`Include ${label} in export`}
      />
      <span>{label}</span>
    </div>
  )

  // Export PDF & Excel
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/order/linkorderlist',
    payload: {
      search,
      status,
      colour,
      order_no: orderNoFilter,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'in_process_orders',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<Order>({
    apiPath: '/order/linkorderlist',
    payload: {
      search,
      status,
      colour,
      order_no: orderNoFilter,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
      type: 'excel',
    },
    dataKey: 'records',
    columns: [
      { key: 'order_no', header: 'Order No.', value: r => r.order_no },
      { key: 'colour', header: 'Colour', value: r => r.colour },
      { key: 'ex_fac_date', header: 'Ex-Factory Date', value: r => formatDate(r.ex_fac_date) },
      { key: 'order_qty', header: 'Order Qty', value: r => r.order_qty },
      { key: 'prod_qty', header: 'Prod Qty', value: r => r.prod_qty },
      { key: 'tot_prd_ord_qty', header: 'Total Qty', value: r => r.tot_prd_ord_qty },
      { key: 'input_qty', header: 'Input Qty', value: r => r.input_qty },
      { key: 'rej_qty', header: 'Rej Qty', value: r => r.rej_qty },
      { key: 'rej_per', header: 'Rej %', value: r => r.rej_per },
      { key: 'output_qty', header: 'Output Qty', value: r => r.output_qty },
      { key: 'wip', header: 'WIP', value: r => r.wip },
      { key: 'rework_qty', header: 'Rework', value: r => r.rework_qty },
      { key: 'rework_per', header: 'RW %', value: r => r.rework_per },
      { key: 'notes', header: 'Notes', value: r => r.notes || '—' },
      { key: 'status', header: 'Status', value: r => (r.is_active === 1 ? 'Active' : 'Inactive') },
    ],
    filename: 'in_process_orders',
    method: 'GET',
  })

  const getActions = (row: Order): ActionItem[] => {
    const actions: ActionItem[] = []
    // is_edit === 1 means the order is mapped/in-production — hide Edit & Delete; 0 means show
    const isLocked = row.is_edit === 1
    if (canView) actions.push({ label: "View", icon: <Eye size={13} />, onClick: () => onView(row.uuid) })
    if (canEdit && !isLocked) actions.push({ label: "Edit", icon: <Pencil size={13} />, onClick: () => onEdit(row) })
    if (canDelete && !isLocked) actions.push({ label: "Delete", icon: <Trash2 size={13} />, onClick: () => onDelete(row), variant: "danger" })
    return actions
  }

  const columns = [
    {
      key: "order_no",
      header: renderHeader("order_no", "Order No."),
      sortable: true,
      sortValue: (row: Order) => row.order_no || "—",
      render: (row: Order) => (
        <div>
          <p className="font-semibold text-t-primary text-xs">{row.order_no}</p>
          {row.style && (
            <p className="text-2xs text-t-lighter mt-0.5 truncate max-w-[140px]">
              {row.style.buyer} | {row.style.style_no} | {row.style.style_name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "colour",
      header: renderHeader("colour", "Colour"),
      sortable: true,
      sortValue: (row: Order) => row.colour || "—",
      render: (row: Order) => (
        <span className="text-xs text-t-body">{row.colour || "—"}</span>
      ),
    },
    {
      key: "ex_fac_date",
      header: renderHeader("ex_fac_date", "Ex-Factory Date"),
      sortable: true,
      sortValue: (row: Order) => row.ex_fac_date || "",
      render: (row: Order) => (
        <span className="text-xs text-t-body">
          {formatDate(row.ex_fac_date)}
        </span>
      ),
    },
    {
      key: "order_qty",
      header: renderHeader("order_qty", "Order Qty"),
      sortable: true,
      sortValue: (row: Order) => row.order_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.order_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "prod_qty",
      header: renderHeader("prod_qty", "Prod Qty"),
      sortable: true,
      sortValue: (row: Order) => row.prod_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.prod_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "tot_prd_ord_qty",
      header: renderHeader("tot_prd_ord_qty", "Total Qty"),
      sortable: true,
      sortValue: (row: Order) => row.tot_prd_ord_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.tot_prd_ord_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "input_qty",
      header: renderHeader("input_qty", "Input Qty"),
      sortable: true,
      sortValue: (row: Order) => row.input_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.input_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "rej_qty",
      header: renderHeader("rej_qty", "Rej Qty"),
      sortable: true,
      sortValue: (row: Order) => row.rej_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span
          className={`font-mono text-xs font-semibold ${row.rej_qty > 0 ? "text-red-500" : "text-t-secondary"}`}
        >
          {(row.rej_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "rej_per",
      header: renderHeader("rej_per", "Rej %"),
      sortable: true,
      sortValue: (row: Order) => row.rej_per || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {row.rej_per}%
        </span>
      ),
    },
    {
      key: "output_qty",
      header: renderHeader("output_qty", "Output Qty"),
      sortable: true,
      sortValue: (row: Order) => row.output_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.output_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "wip",
      header: renderHeader("wip", "WIP"),
      sortable: true,
      sortValue: (row: Order) => row.wip || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.wip || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "rework_qty",
      header: renderHeader("rework_qty", "Rework"),
      sortable: true,
      sortValue: (row: Order) => row.rework_qty || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {(row.rework_qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "rework_per",
      header: renderHeader("rework_per", "RW%"),
      sortable: true,
      sortValue: (row: Order) => row.rework_per || 0,
      className: "text-right",
      render: (row: Order) => (
        <span className="font-mono text-xs text-t-secondary">
          {row.rework_per}%
        </span>
      ),
    },
    {
      key: "notes",
      header: renderHeader("notes", "Notes"),
      sortable: true,
      sortValue: (row: Order) => row.notes || "—",
      render: (row: Order) => (
        <span className="text-xs text-t-body max-w-[150px] truncate block" title={row.notes || ""}>
          {row.notes || "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: renderHeader("status", "Active"),
      sortable: true,
      sortValue: (row: Order) => row.is_active,
      className: "text-center",
      render: (row: Order) => (
        <Badge variant={row.is_active === 1 ? "success" : "default"}>
          {row.is_active === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <AdvancedTable<Order>
        header={
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-table-line gap-2 flex-wrap bg-card">
            <span className="text-sm font-semibold text-t-secondary hidden sm:inline">
              In-Process Orders
            </span>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search in-process orders..."
                  className="h-8 pl-8 pr-3 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary w-52"
                />
              </div>
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none"
                />
                <input
                  value={orderNoFilter}
                  onChange={(e) => onOrderNoFilterChange(e.target.value)}
                  placeholder="Order No."
                  className="h-8 pl-8 pr-3 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary w-32"
                />
              </div>
              <div className="relative">
                <select
                  value={colour}
                  onChange={(e) => onColourChange(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="all">All Colour</option>
                  {colours.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-t-lighter text-xs">
                  ▾
                </span>
              </div>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-t-lighter text-xs">
                  ▾
                </span>
              </div>
              {/* Branch filter */}
              {isAdmin ? (
                <div className="relative">
                  <select
                    value={branchFilter}
                    onChange={e => onBranchFilterChange(e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
                </div>
              ) : effectiveBranchId ? (
                <div className="flex items-center gap-1.5 h-8 px-2.5 text-xs bg-card-alt border border-input-line rounded-input text-t-primary font-medium">
                  <span className="text-t-lighter">Branch:</span>
                  <span>{branches.find(b => String(b.id) === effectiveBranchId)?.branch_name ?? '—'}</span>
                </div>
              ) : null}

              {canCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onAdd}
                  leftIcon={<Plus size={13} />}
                >
                  Add Order
                </Button>
              )}

              {/* Export Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  rightIcon={<ChevronDown size={12} />}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exportingExcel || exportingPdf}
                >
                  {exportingExcel || exportingPdf ? 'Exporting...' : 'Export'}
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 bg-card border border-table-line rounded-input shadow-lg z-[9999] min-w-[130px]">
                    <button
                      onClick={() => {
                        handleExportExcel({ check_box_heading: formatExportHeadings(selectedHeadings) })
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-t-secondary hover:bg-accent hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={13} /> Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExportPdf({ check_box_heading: formatExportHeadings(selectedHeadings) })
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-t-secondary hover:bg-accent hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={13} /> PDF
                    </button>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload size={13} />}
              >
                Import
              </Button>
            </div>
          </div>
        }
        columns={columns}
        rowKey={(row) => row.uuid}
        data={data}
        loading={loading}
        emptyMessage="No orders found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="order"
        actions={getActions}
        countLabelPlural="orders"
        selectable
        selected={selected}
        onSelectionChange={onSelectionChange}
      />
    </>
  );
}
