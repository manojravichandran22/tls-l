"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { apiCall } from "@/services/apiClient";
import { PER_PAGE } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Toolbar from "@/components/ui/Toolbar";
import { MoreVertical, GripVertical } from "lucide-react";
import { useSortableData } from "@/hooks/useSortableData";

interface CheckinRecord {
  user_id: number;
  user_name: string;
  employee_id: string;
  //employee_name: string
  role_id: number;
  role_name: string;
  line_id: number[];
  line_name: string;
  shift_id: number;
  shift_name: string;
  start_time: string;
  end_time: string | null;
  status: number;
}

export default function LineLoginStatusPage() {
  //const [data, setData] = useState<CheckinRecord[]>([])
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(PER_PAGE);
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">(
    "today",
  );

  const { sortedData, sortState, setSortState } = useSortableData(records);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall<{
        data?: {
          checkins?: CheckinRecord[];
          pagination?: { total: number; total_pages: number };
        };
      }>("/mobilecheckin/list", {
        method: "POST",
        payload: {
          from_date: "", // Future: calculate based on timeFilter
          to_date: "",
          search,
          page: String(page),
          per_page: String(perPage),
        },
      });

      const responseData = res.data;
      setRecords(responseData?.checkins ?? []);
      setTotalCount(responseData?.pagination?.total ?? 0);
      setTotalPages(responseData?.pagination?.total_pages ?? 1);
    } catch (error) {
      console.error("Failed to fetch line login status:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    {
      key: "shift_name",
      header: "Shift",
      sortable: true,
      render: (row: CheckinRecord) => (
        <Badge
          variant="success"
          className="bg-[#E6F9F4] text-[#00A781] border border-[#BFF0E5] px-2 py-0.5"
        >
          {row.shift_name}
        </Badge>
      ),
    },
    {
      key: "role_name",
      header: "Role",
      sortable: true,
      render: (row: CheckinRecord) => (
        <span className="text-sm font-medium text-t-primary">
          {row.role_name}
        </span>
      ),
    },
    {
      key: "employee_id",
      header: "Emp ID",
      sortable: true,
      render: (row: CheckinRecord) => (
        <span className="text-sm text-t-secondary">{row.employee_id}</span>
      ),
    },
    {
      key: "user_name",
      header: "Name",
      sortable: true,
      render: (row: CheckinRecord) => (
        <span className="text-sm font-medium text-t-primary">
          {row.user_name}
        </span>
      ),
    },
    {
      key: "line_name",
      header: "Lines",
      sortable: true,
      render: (row: CheckinRecord) => {
        const lines = row.line_name
          ? row.line_name.split(",").map((l) => l.trim())
          : [];
        return (
          <div className="flex gap-2 flex-wrap">
            {lines.map((line, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded text-[11px] text-[#6C757D]"
              >
                <span className="w-1.5 h-1.5 bg-[#ADB5BD] rounded-full"></span>
                {line}
              </span>
            ))}
          </div>
        );
      },
    },
    // {
    //   key: 'employee_name',
    //   header: 'Employee Name',
    //   sortable: true,
    //   render: (row: CheckinRecord) => (
    //     <span className="text-sm text-t-secondary">{row.employee_name}</span>
    //   ),
    // },
    {
      key: "status",
      header: "Status",
      render: (row: CheckinRecord) => (
        <Badge
          variant={row.status === 1 ? "success" : "default"}
          className="flex items-center gap-1.5 w-fit bg-transparent border-none"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${row.status === 1 ? "bg-[#00A781]" : "bg-gray-400"}`}
          ></span>
          <span
            className={row.status === 1 ? "text-[#00A781]" : "text-gray-500"}
          >
            {row.status === 1 ? "Active" : "Inactive"}
          </span>
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors text-t-lighter">
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  return (
    <AppLayout fixedHeight>
      <div className="flex flex-col h-full bg-table-bg">
        <PageHeader
          title="Line Login Status"
          description="Real-time operator check-in status per line and shift"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2.5 gap-4 flex-wrap border-b border-table-line bg-card">
            <div className="flex items-center bg-[#F1F3F5] p-1 rounded-lg">
              {(["today", "week", "month"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                    timeFilter === t
                      ? "bg-white text-t-primary shadow-sm"
                      : "text-t-lighter hover:text-t-body"
                  }`}
                >
                  {t === "today"
                    ? "Today"
                    : t === "week"
                      ? "This week"
                      : "This Month"}
                </button>
              ))}
            </div>

            <div className="flex-1 flex justify-end">
              <Toolbar
                search={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                showExport={true}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <DataTable
              columns={columns}
              data={sortedData}
              sortState={sortState}
              onSortChange={setSortState}
              loading={loading}
              emptyMessage="No operator check-in records found"
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              countLabel="record"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
