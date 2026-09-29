"use client";

import { useMemo } from "react";
import Toolbar from "@/components/ui/Toolbar";
import ReportTable, { type ReportColumn } from "@/components/ui/ReportTable";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useExportPdf } from "@/hooks/useExportPdf";
import { useExport } from "@/hooks/useExport";
import { useBranchAccess } from "@/hooks/useBranchAccess";
import type { CheckingReportData, CheckingReportRow } from "../types";
import type {
  BranchOption,
  TeamOption,
  ShiftOption,
} from "@/services/dropdownService";

interface CheckingReportListProps {
  data: CheckingReportData | null;
  loading: boolean;
  search: string;
  branchFilter: string;
  teamFilter: string;
  shiftFilter: string;
  fromDate: string;
  toDate: string;
  branches: BranchOption[];
  teams: TeamOption[];
  shifts: ShiftOption[];
  onSearchChange: (val: string) => void;
  onBranchFilterChange: (val: string) => void;
  onTeamFilterChange: (val: string) => void;
  onShiftFilterChange: (val: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
}

export default function CheckingReportList({
  data,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  fromDate,
  toDate,
  branches,
  teams,
  shifts,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onDateRangeChange,
}: CheckingReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess();
  const rows: CheckingReportRow[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.checking)) return data.checking;
    if (Array.isArray((data as any).data?.checking))
      return (data as any).data.checking;
    if (Array.isArray((data as any).data)) return (data as any).data;
    if (Array.isArray(data)) return data as any;
    return [];
  }, [data]);

  const summary = data?.summary || (data as any)?.data?.summary;

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.order_no && r.order_no.toLowerCase().includes(q)) ||
        (r.buyer && r.buyer.toLowerCase().includes(q)) ||
        (r.branch_name && r.branch_name.toLowerCase().includes(q)) ||
        (r.team_name && r.team_name.toLowerCase().includes(q)) ||
        (r.shift_name && r.shift_name.toLowerCase().includes(q)) ||
        (r.colour && r.colour.toLowerCase().includes(q)) ||
        (r.size && r.size.toLowerCase().includes(q)) ||
        (r.checker_emp_code !== undefined &&
          String(r.checker_emp_code).toLowerCase().includes(q)) ||
        (r.checker_name && r.checker_name.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  // PDF Export setup
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: "/report/checkingreport",
    payload: {
      search,
      branch_id: branchFilter,
      team_id: teamFilter,
      shift_id: shiftFilter,
      date_from: fromDate,
      date_to: toDate,
    },
    filename: `Checking_Report_${fromDate}_to_${toDate}`,
  });

  // Excel Export setup
  const { handleExport: handleExportExcel, exporting: exportingExcel } =
    useExport<CheckingReportRow>({
      apiPath: "/report/checkingreport",
      payload: {
        search,
        branch_id: branchFilter,
        team_id: teamFilter,
        shift_id: shiftFilter,
        date_from: fromDate,
        date_to: toDate,
        type: "excel",
      },
      dataKey: "data.checking",
      columns: [
        {
          key: "shift_name",
          header: "Shift",
          value: (r) => r.shift_name || "—",
        },
        {
          key: "branch_name",
          header: "Branch",
          value: (r) => r.branch_name || "—",
        },
        { key: "team_name", header: "Team", value: (r) => r.team_name || "—" },
        {
          key: "order_no",
          header: "Order No",
          value: (r) => r.order_no || "—",
        },
        { key: "buyer", header: "Buyer", value: (r) => r.buyer || "—" },
        { key: "colour", header: "Colour", value: (r) => r.colour || "—" },
        {
          key: "line_name",
          header: "Line",
          value: (r) => r.line_name || (r.line_id ? `Line ${r.line_id}` : "—"),
        },
        {
          key: "checker_id",
          header: "Checker ID",
          value: (r) => r.checker_emp_code ?? "—",
        },
        {
          key: "checker_name",
          header: "Checker Name",
          value: (r) => r.checker_name || "—",
        },
        { key: "size", header: "Size", value: (r) => r.size || "—" },
        { key: "qty", header: "Qty", value: (r) => r.qty ?? 0 },
        {
          key: "output_qty",
          header: "Output Qty",
          value: (r) => r.output_qty ?? 0,
        },
        { key: "balance", header: "Balance", value: (r) => r.balance ?? 0 },
        { key: "wip", header: "WIP", value: (r) => r.wip ?? 0 },
      ],
      filename: `Checking_Report_${fromDate}_to_${toDate}`,
      method: "POST",
    });

  // Totals calculation
  const totals = useMemo(() => {
    if (summary) {
      return {
        total_records: summary.total_records ?? filteredRows.length,
        total_qty:
          summary.total_qty ??
          filteredRows.reduce((s, r) => s + (r.qty || 0), 0),
        total_output_qty:
          summary.total_output_qty ??
          filteredRows.reduce((s, r) => s + (r.output_qty || 0), 0),
        total_balance:
          summary.total_balance ??
          filteredRows.reduce((s, r) => s + (r.balance || 0), 0),
        total_wip:
          summary.total_wip ??
          filteredRows.reduce((s, r) => s + (r.wip || 0), 0),
      };
    }
    return {
      total_records: filteredRows.length,
      total_qty: filteredRows.reduce((s, r) => s + (r.qty || 0), 0),
      total_output_qty: filteredRows.reduce(
        (s, r) => s + (r.output_qty || 0),
        0,
      ),
      total_balance: filteredRows.reduce((s, r) => s + (r.balance || 0), 0),
      total_wip: filteredRows.reduce((s, r) => s + (r.wip || 0), 0),
    };
  }, [filteredRows, summary]);

  const columns: ReportColumn<CheckingReportRow>[] = [
    {
      key: "sn",
      header: "S.No",
      render: (_, i) => (
        <span className="text-xs text-t-primary font-medium">{i + 1}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          Summary
        </span>
      ),
    },
    {
      key: "branch_name",
      header: "Branch",
      sortable: true,
      sortValue: (r) => r.branch_name || "",
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.branch_name || "—"}
        </span>
      ),
    },
    {
      key: "shift_name",
      header: "Shift",
      sortable: true,
      sortValue: (r) => r.shift_name || "",
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.shift_name || "—"}
        </span>
      ),
    },

    {
      key: "team_name",
      header: "Team",
      sortable: true,
      sortValue: (r) => r.team_name || "",
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.team_name || "—"}
        </span>
      ),
    },
    {
      key: "line_name",
      header: "Line",
      sortable: true,
      sortValue: (r) => r.line_name || String(r.line_id || ""),
      render: (r) => (
        <span className="text-xs text-t-body whitespace-nowrap">
          {r.line_name || (r.line_id ? `Line ${r.line_id}` : "—")}
        </span>
      ),
    },
    {
      key: "checker_id",
      header: "Checker ID",
      sortable: true,
      sortValue: (r) => String(r.checker_emp_code ?? ""),
      render: (r) => (
        <span className="text-xs text-t-body whitespace-nowrap">
          {r.checker_emp_code ?? "—"}
        </span>
      ),
    },
    {
      key: "checker_name",
      header: "Checker Name",
      sortable: true,
      sortValue: (r) => r.checker_name || "",
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.checker_name || "—"}
        </span>
      ),
    },
    {
      key: "buyer",
      header: "Buyer",
      sortable: true,
      sortValue: (r) => r.buyer || "",
      render: (r) => (
        <span className="text-xs text-t-body whitespace-nowrap">
          {r.buyer || "—"}
        </span>
      ),
    },
    {
      key: "order_no",
      header: "Order No",
      sortable: true,
      sortValue: (r) => r.order_no || "",
      render: (r) => (
        <span className="text-xs font-semibold text-[#007b83] dark:text-[#2dd4bf] whitespace-nowrap">
          {r.order_no || "—"}
        </span>
      ),
    },

    {
      key: "colour",
      header: "Colour",
      sortable: true,
      sortValue: (r) => r.colour || "",
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.colour || "—"}
        </span>
      ),
    },

    {
      key: "size",
      header: "Size",
      sortable: true,
      sortValue: (r) => r.size || "",
      render: (r) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-[#e8ecef] dark:bg-gray-700 text-[#4b5563] dark:text-gray-200 uppercase">
          {r.size || "—"}
        </span>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      sortable: true,
      sortValue: (r) => r.qty ?? 0,
      render: (r) => (
        <span className="text-xs text-t-body font-medium">{r.qty ?? 0}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totals.total_qty.toLocaleString()}
        </span>
      ),
    },
    // {
    //   key: 'output_qty',
    //   header: 'Output Qty',
    //   sortable: true,
    //   sortValue: (r) => r.output_qty ?? 0,
    //   render: (r) => <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{r.output_qty ?? 0}</span>,
    //   footer: () => <span className="font-bold text-white">{totals.total_output_qty.toLocaleString()}</span>,
    // },
    // {
    //   key: 'balance',
    //   header: 'Balance',
    //   sortable: true,
    //   sortValue: (r) => r.balance ?? 0,
    //   render: (r) => <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{r.balance ?? 0}</span>,
    //   footer: () => <span className="font-bold text-white">{totals.total_balance.toLocaleString()}</span>,
    // },
    {
      key: "wip",
      header: "WIP",
      sortable: true,
      sortValue: (r) => r.wip ?? 0,
      render: (r) => (
        <span className="text-xs text-t-body font-medium">{r.wip ?? 0}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totals.total_wip.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* KPI Summary Banner (commented out for now) */}
      {/*
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-card border border-table-line p-3 rounded-card shadow-xs">
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-teal-600/10 border border-teal-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">
            Total Records
          </span>
          <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
            {totals.total_records.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">
            Total Qty
          </span>
          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
            {totals.total_qty.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">
            Total Output Qty
          </span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totals.total_output_qty.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-amber-600/10 border border-amber-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">
            Total Balance
          </span>
          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
            {totals.total_balance.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-center col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-t-secondary">
            Total Sewing WIP
          </span>
          <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
            {totals.total_wip.toLocaleString()}
          </span>
        </div>
      </div>
      */}

      {/* Report Table with Toolbar Filters */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ReportTable<CheckingReportRow>
          header={
            <Toolbar
              title="Checking Report"
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search by Order, Buyer, Shift..."
              onExport={() => handleExportExcel()}
              onExportPdf={handleExportPdf}
              exporting={exportingExcel || exportingPdf}
            >
              <DateRangePicker
                startDate={fromDate}
                endDate={toDate}
                onChange={onDateRangeChange}
              />

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => onBranchFilterChange(e.target.value)}
                disabled={!isAdmin && Boolean(userBranchId)}
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.branch_name}
                  </option>
                ))}
              </select>

              {/* Shift Filter */}
              <select
                value={shiftFilter}
                onChange={(e) => onShiftFilterChange(e.target.value)}
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer"
              >
                <option value="">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.shift_name}
                  </option>
                ))}
              </select>

              {/* Team Filter */}
              <select
                value={teamFilter}
                onChange={(e) => onTeamFilterChange(e.target.value)}
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer"
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.team_name}
                  </option>
                ))}
              </select>
            </Toolbar>
          }
          columns={columns}
          data={filteredRows}
          loading={loading}
          emptyMessage="No checking report records found"
          rowKey={(r: CheckingReportRow) =>
            String(r.id || r.uuid || `${r.order_no}-${r.size_id}-${r.shift_id}`)
          }
          countLabel="record"
          countLabelPlural="records"
        />
      </div>
    </div>
  );
}
