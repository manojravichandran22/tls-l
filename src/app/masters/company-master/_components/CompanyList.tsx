"use client";

import Badge from "@/components/ui/Badge";
import AdvancedTable, {
  type AdvancedColumn,
  type ActionItem,
} from "@/components/ui/AdvancedTable";
import { useExportPdf } from "@/hooks/useExportPdf";
import Toolbar from "@/components/ui/Toolbar";
import { Pencil, Trash2, Eye, MapPin } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchAccess } from "@/hooks/useBranchAccess";

import type { Company } from "./types";
import { useState } from "react";


const PDF_HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: "company_name", label: "Company Name" },
  { key: "company_code", label: "Company Code" },
  { key: "address", label: "Address" },
  { key: "company_type", label: "Type" },
  { key: "max_slot", label: "Max Slot" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface Props {
  companies: Company[];
  loading: boolean;
  page: number;
  perPage: number;
  totalPages: number;
  totalCount: number;
  search: string;
  statusFilter: string;
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onAdd: () => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onView: (id: number) => void;
  onExport?: (extraPayload?: Record<string, any>) => void;
  exporting?: boolean;
}

export default function CompanyList({
  companies,
  loading,
  page,
  perPage,
  totalPages,
  totalCount,
  search,
  statusFilter,
  selected,
  onSelectionChange,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onPerPageChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onExport,
  exporting = false,
}: Props) {
  const { can } = usePermissions("Company");
  const { branchId } = useBranchAccess();
  const canView = can("company.show");
  const canCreate = can("company.create");
  const canEdit = can("company.edit");
  const canDelete = can("company.delete");

  // Selected column headings state for PDF export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    PDF_HEADING_OPTIONS.map((h) => h.key)
  );

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const allHeadingsSelected =
    selectedHeadings.length === PDF_HEADING_OPTIONS.length;
  const toggleAllHeadings = () => {
    setSelectedHeadings(
      allHeadingsSelected ? [] : PDF_HEADING_OPTIONS.map((h) => h.key)
    );
  };

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer"
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
  );

  // pdf export
  const selectedUuids = companies
    .filter((company) => selected.includes(String(company.id)))
    .map((company) => company.uuid);

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: "/company/companyList",
    payload: {
      search: search ?? "",
      status: statusFilter,
      ...(branchId ? { branch_id: String(branchId) } : {}),
      check_uuid: selectedUuids,
      check_box_heading: selectedHeadings,
    },
    filename: "companies",
  });

  const columns: AdvancedColumn<Company>[] = [
    {
      key: "#",
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer"
          title="Select all column headings for PDF export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>#</span>
        </div>
      ),
      render: (_: Company, i: number) => (
        <span className="text-t-lighter text-xs">
          {(page - 1) * perPage + i + 1}
        </span>
      ),
    },
    {
      key: "company_name",
      header: renderHeader("company_name", "Company Name"),
      sortable: true,
      sortValue: (row: Company) => row.company_name,
      className: "max-w-[200px]",
      render: (row: Company) => (
        <span
          className="text-accent font-semibold block truncate"
          title={row.company_name}
        >
          {row.company_name}
        </span>
      ),
    },
    {
      key: "company_code",
      header: renderHeader("company_code", "Company Code"),
      sortable: true,
      sortValue: (row: Company) => row.company_code ?? "",
      render: (row: Company) => (
        <span className="text-xs text-t-body">{row.company_code || "—"}</span>
      ),
    },
    {
      key: "address",
      header: renderHeader("address", "Address"),
      sortable: true,
      sortValue: (row: Company) => row.address,
      className: "max-w-[240px]",
      render: (row: Company) => (
        <span className="text-t-body block truncate" title={row.address}>
          {row.address}
        </span>
      ),
    },
    {
      key: "company_type",
      header: renderHeader("company_type", "Type"),
      sortable: true,
      sortValue: (row: Company) => row.company_type,
      render: (row: Company) => (
        <Badge variant="info">{row.company_type}</Badge>
      ),
    },
    {
      key: "max_slot",
      header: renderHeader("max_slot", "Max Slot"),
      sortable: true,
      sortValue: (row: Company) => row.max_slot,
      render: (row: Company) => (
        <span className="text-t-body font-semibold">{row.max_slot}</span>
      ),
    },
    {
      key: "location",
      header: renderHeader("location", "Location"),
      sortable: true,
      sortValue: (row: Company) => row.location?.lat ?? null,
      render: (row: Company) => {
        const lat = row.location?.lat;
        const lng = row.location?.lng;

        if (lat == null || lng == null) {
          return <span className="text-t-body text-xs">—</span>;
        }

        return (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Coordinates: ${lat}, ${lng} (Open in Google Maps)`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent/10 hover:bg-accent hover:text-white transition-all duration-150 border border-accent/20 cursor-pointer select-none"
          >
            <MapPin size={13} className="shrink-0" />
            <span>View Map</span>
          </a>
        );
      },
    },
    {
      key: "status",
      header: renderHeader("status", "Status"),
      sortable: true,
      sortValue: (row: Company) => row.status,
      render: (row: Company) => (
        <Badge variant={row.status === 1 ? "success" : "default"}>
          {row.status === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const getActions = (row: Company): ActionItem[] => {
    const actions: ActionItem[] = [];

    if (canView) {
      actions.push({
        label: "View",
        icon: <Eye size={13} />,
        onClick: () => onView((row as unknown as { id: number }).id),
      });
    }

    if (canEdit) {
      actions.push({
        label: "Edit",
        icon: <Pencil size={13} />,
        onClick: () => onEdit(row),
      });
    }

    if (canDelete) {
      actions.push({
        label: "Delete",
        icon: <Trash2 size={13} />,
        onClick: () => onDelete(row),
        variant: "danger",
      });
    }

    return actions;
  };

  return (
    <AdvancedTable<Company>
      header={
        <Toolbar
          title="All Companies"
          search={search}
          onSearchChange={(val) => {
            onSearchChange(val);
            onPageChange(1);
          }}
          searchPlaceholder="Search by Company Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Company"
          onExport={() => onExport?.({ check_box_heading: selectedHeadings })}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          <select
            value={statusFilter}
            onChange={(e) => {
              onStatusChange(e.target.value);
              onPageChange(1);
            }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Toolbar>
      }
      columns={columns}
      data={companies}
      loading={loading}
      emptyMessage="No companies found"
      rowKey={(row) => String((row as unknown as { id: number }).id)}
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="company"
      countLabelPlural="companies"
    />
  );
}
