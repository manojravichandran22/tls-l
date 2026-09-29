"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  AlertTriangle,
  QrCode,
  WifiOff,
  UserPlus,
  Eye,
  Check,
  X as CloseIcon,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import OrderView from "@/app/masters/order-master/_components/OrderView";
import Button from "@/components/ui/Button";
import { apiCall } from "@/services/apiClient";
import Toast, { ToastData } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

import { usePermissions } from "@/hooks/usePermissions";
import { useBranchAccess } from "@/hooks/useBranchAccess";

interface ApprovalRecord {
  id: number;
  module_name: string;
  record_id: number;
  status: number;
  created_by: number;
  approved_by: number | null;
  created_at: string;
  record_details: Record<string, any>;
  branch_id?: number | string;
}

type TabType = "All" | "Pending" | "Approved" | "Rejected";

export default function ApprovalPage() {
  const { branchId: userBranchId, isAdmin } = useBranchAccess();
  const effectiveBranchId =
    !isAdmin && userBranchId
      ? String(userBranchId)
      : userBranchId
        ? String(userBranchId)
        : "";

  const { can } = usePermissions("Approval");
  const canList = can("approval.list");
  const canShow = can("approval.show");
  const canAction = can("approval.action");

  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [toast, setToast] = useState<ToastData | null>(null);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {};
      if (effectiveBranchId) payload.branch_id = effectiveBranchId;

      const res = await apiCall<{
        success: boolean;
        data: { records: ApprovalRecord[] };
      }>("/approval/list", {
        method: "GET",
        encrypt: false,
        payload,
      });
      if (res.success && res.data?.records) {
        setRecords(res.data.records);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveBranchId]);

  useEffect(() => {
    if (canList) fetchList();
  }, [fetchList, canList]);

  const handleAction = async (record: any, action: "approve" | "decline") => {
    if (!canAction) {
      setToast({
        message: "You do not have permission to perform this action",
        type: "error",
      });
      return;
    }
    try {
      const recBranchId =
        record.branch_id ||
        record.approval?.branch_id ||
        record.record_details?.branch_id ||
        record.baseDetails?.branch_id ||
        userBranchId;

      const payload: Record<string, unknown> = {
        module_name: record.module_name || record.approval?.module_name,
        record_id: String(record.record_id || record.approval?.record_id),
        action,
      };
      if (recBranchId) {
        payload.branch_id = String(recBranchId);
      }

      const res = await apiCall<{ success: boolean; message: string }>(
        "/approval/action",
        {
          payload,
        },
      );
      if (res.success) {
        setToast({
          message:
            res.message ||
            `Successfully ${action === "approve" ? "approved" : "declined"}`,
          type: "success",
        });
        fetchList();
        if (viewRecord) {
          setViewRecord((prev: any) => ({
            ...prev,
            approval: {
              ...prev.approval,
              status: action === "approve" ? 1 : 0,
            },
          }));
        }
      } else {
        setToast({ message: res.message || "Operation failed", type: "error" });
      }
    } catch {
      setToast({ message: "Something went wrong", type: "error" });
    }
  };

  const handleView = async (item: ApprovalRecord) => {
    if (!canShow) {
      setToast({
        message: "You do not have permission to view details",
        type: "error",
      });
      return;
    }
    setViewLoading(true);
    setViewRecord({ approval: item });
    try {
      const itemBranchId =
        item.record_details?.branch_id ||
        (item as any).branch_id ||
        effectiveBranchId;
      const showPayload: Record<string, unknown> = { id: String(item.id) };
      if (itemBranchId) showPayload.branch_id = String(itemBranchId);

      const res = await apiCall<{ success: boolean; data: any }>(
        "/approval/show",
        {
          method: "GET",
          encrypt: false,
          payload: showPayload,
        },
      );
      if (res.success && res.data) {
        let fullData = res.data;
        const moduleName = res.data.approval?.module_name || item.module_name;
        if (
          moduleName?.toLowerCase().includes("order") &&
          res.data.baseDetails?.uuid
        ) {
          try {
            const ordBranchId = res.data.baseDetails?.branch_id || itemBranchId;
            const orderPayload: Record<string, unknown> = {
              uuid: res.data.baseDetails.uuid,
            };
            if (ordBranchId) orderPayload.branch_id = String(ordBranchId);

            const orderRes = await apiCall<{ success?: boolean; data?: any }>(
              "/order/show",
              {
                method: "GET",
                encrypt: false,
                payload: orderPayload,
              },
            );
            if (orderRes.data) {
              fullData = {
                ...res.data,
                baseDetails: orderRes.data,
              };
            }
          } catch (err) {
            console.error(
              "Failed to fetch order sizes for approval view:",
              err,
            );
          }
        }
        setViewRecord(fullData);
      }
    } catch (err) {
      console.error("View error:", err);
      setToast({ message: "Failed to fetch details", type: "error" });
    } finally {
      setViewLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 2:
        return "Pending";
      case 1:
        return "Approved";
      case 0:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getModuleIcon = (moduleName: string) => {
    const name = moduleName.toLowerCase();
    if (name.includes("employee"))
      return { icon: <UserPlus size={14} />, bg: "bg-success-bg" };
    if (name.includes("defect"))
      return { icon: <AlertTriangle size={14} />, bg: "bg-warning-bg" };
    if (name.includes("qr"))
      return { icon: <QrCode size={14} />, bg: "bg-info-bg" };
    if (name.includes("device"))
      return { icon: <WifiOff size={14} />, bg: "bg-error-bg" };
    return { icon: <AlertTriangle size={14} />, bg: "bg-secondary-bg" };
  };

  const filtered = records.filter((r) => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending") return r.status === 2;
    if (activeTab === "Approved") return r.status === 1;
    if (activeTab === "Rejected") return r.status === 0;
    return true;
  });

  const stats = [
    {
      label: "Pending",
      value: records.filter((r) => r.status === 2).length,
      color: "text-stat-orange",
    },
    {
      label: "Approved",
      value: records.filter((r) => r.status === 1).length,
      color: "text-success-text",
    },
    {
      label: "Rejected",
      value: records.filter((r) => r.status === 0).length,
      color: "text-error-text",
    },
  ];

  const getRecordTitle = (item: ApprovalRecord) => {
    const details = item.record_details || {};
    if (item.module_name === "company")
      return details.company_name || details.name || "Company Request";
    if (item.module_name === "employee")
      return details.employee_name || details.name || "Employee Request";
    if (item.module_name === "defect")
      return details.defect_name || details.name || "Defect Request";
    //order request in approval list
    return `${item.module_name.replace(/_/g, " ")} Request`;
  };
  //view module details function
  const renderDetails = (obj: any, level = 0) => {
    if (!obj || typeof obj !== "object") return String(obj);

    return Object.entries(obj).map(([key, value]) => {
      // Skip internal keys
      if (
        [
          "id",
          "uuid",
          "created_at",
          "updated_at",
          "status",
          "created_by",
          "updated_by",
          "is_active",
          "location",
        ].includes(key)
      )
        return null;

      const label = key.replace(/_/g, " ");

      if (value && typeof value === "object" && !Array.isArray(value)) {
        return (
          <div key={key} className="mb-4">
            <p
              className={`text-xs2 text-t-lighter uppercase font-bold mb-2 ${level > 0 ? "ml-4" : ""}`}
            >
              {label}
            </p>
            <div className="space-y-2 ml-4">
              {renderDetails(value, level + 1)}
            </div>
          </div>
        );
      }

      return (
        <div
          key={key}
          className={`flex justify-between items-center py-2 border-b border-sidebar-line/50 last:border-0 ${level > 0 ? "ml-4" : ""}`}
        >
          <span className="text-xs font-semibold text-t-light capitalize">
            {label}
          </span>
          <span className="text-sm font-medium text-t-secondary">
            {Array.isArray(value) ? value.join(", ") : String(value ?? "—")}
          </span>
        </div>
      );
    });
  };

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Approval"
        description="Review and approve or reject pending requests from all modules."
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 max-w-[400px]">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-lg px-4 py-3.5 shadow-sm text-center border border-sidebar-line"
          >
            <p className={`m-0 mb-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="m-0 text-xs2 text-t-lighter uppercase tracking-wider font-semibold">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-header-line mb-4">
        {(["All", "Pending", "Approved", "Rejected"] as TabType[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-cell-py-sm border-none bg-transparent cursor-pointer text-sm font-inherit -mb-px transition-all
              ${
                activeTab === tab
                  ? "font-semibold text-accent border-b-2 border-b-accent"
                  : "font-normal text-t-light border-b-2 border-b-transparent hover:text-accent"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Items — only this list scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-card rounded-lg shadow-sm border border-sidebar-line">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-t-lighter text-sm">
            <Loader2 className="animate-spin" size={20} />
            Loading approvals...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-t-lighter text-sm">
            No {activeTab.toLowerCase()} items found
          </div>
        ) : (
          filtered.map((item, i) => {
            const { icon, bg } = getModuleIcon(item.module_name);
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-btn-px py-3.5 transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01] ${i < filtered.length - 1 ? "border-b border-table-line" : ""}`}
              >
                <div
                  className={`w-[34px] h-[34px] rounded-full ${bg} flex items-center justify-center shrink-0 text-t-body`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 mb-0.5 text-sm font-semibold text-t-secondary capitalize">
                    {getRecordTitle(item)}
                  </p>
                  <p className="m-0 mb-1 text-xs text-t-light line-clamp-1">
                    Module:{" "}
                    <span className="capitalize">{item.module_name}</span>
                  </p>
                  <p className="m-0 text-xs2 text-t-lighter">
                    Submitted on {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0 items-center">
                  {item.status === 2 ? (
                    <>
                      {canAction && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAction(item, "approve")}
                        >
                          Approve
                        </Button>
                      )}
                      {canAction && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAction(item, "decline")}
                        >
                          Decline
                        </Button>
                      )}
                    </>
                  ) : item.status === 1 ? (
                    <Button
                      variant="success"
                      size="sm"
                      disabled
                      className="disabled:opacity-100"
                    >
                      Approved
                    </Button>
                  ) : item.status === 0 ? (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled
                      className="disabled:opacity-100"
                    >
                      Declined
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => canShow && handleView(item)}
                    disabled={!canShow}
                  >
                    View &rarr;
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Modal */}
      {viewRecord &&
        (viewRecord.approval?.module_name?.toLowerCase().includes("order") ||
        viewRecord.module_name?.toLowerCase().includes("order") ? (
          <OrderView
            viewData={
              viewRecord.baseDetails ||
              (viewRecord.approval?.record_details ?? viewRecord.record_details)
            }
            viewLoading={viewLoading}
            onClose={() => setViewRecord(null)}
            footer={
              <>
                {viewRecord.approval?.status === 2 ? (
                  <>
                    {canAction && (
                      <>
                        <Button
                          variant="danger"
                          className="px-6"
                          onClick={() => handleAction(viewRecord, "decline")}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="success"
                          className="px-6"
                          onClick={() => handleAction(viewRecord, "approve")}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                  </>
                ) : viewRecord.approval?.status === 1 ? (
                  <Button
                    variant="success"
                    className="px-6 disabled:opacity-100"
                    disabled
                  >
                    Approved
                  </Button>
                ) : viewRecord.approval?.status === 0 ? (
                  <Button
                    variant="danger"
                    className="px-6 disabled:opacity-100"
                    disabled
                  >
                    Declined
                  </Button>
                ) : null}
              </>
            }
          />
        ) : (
          <Modal
            onClose={() => setViewRecord(null)}
            title={`${(viewRecord.approval?.module_name || "").replace(/_/g, " ")} Details`}
            size="md"
          >
            {viewLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-t-lighter text-sm">
                <Loader2 className="animate-spin" size={24} />
                Fetching details...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-page rounded-lg">
                    <p className="text-xs2 text-t-lighter uppercase font-bold mb-1">
                      Module
                    </p>
                    <p className="text-sm font-medium text-t-secondary capitalize">
                      {viewRecord.approval?.module_name}
                    </p>
                  </div>
                  <div className="p-3 bg-page rounded-lg">
                    <p className="text-xs2 text-t-lighter uppercase font-bold mb-1">
                      Status
                    </p>
                    <p className="text-sm font-medium text-t-secondary">
                      {getStatusLabel(viewRecord.approval?.status)}
                    </p>
                  </div>
                  <div className="p-3 bg-page rounded-lg">
                    <p className="text-xs2 text-t-lighter uppercase font-bold mb-1">
                      Created At
                    </p>
                    <p className="text-sm font-medium text-t-secondary">
                      {new Date(
                        viewRecord.approval?.created_at,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-sidebar-line pt-4">
                  <p className="text-xs2 text-t-lighter uppercase font-bold mb-3 tracking-widest">
                    Record Details
                  </p>
                  <div className="bg-page p-4 rounded-lg overflow-auto max-h-[50vh] space-y-1">
                    {renderDetails(
                      viewRecord.baseDetails ||
                        viewRecord.approval?.record_details,
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  {viewRecord.approval?.status === 2 ? (
                    <>
                      {canAction && (
                        <>
                          <Button
                            variant="danger"
                            className="px-6"
                            onClick={() => handleAction(viewRecord, "decline")}
                          >
                            Decline
                          </Button>
                          <Button
                            variant="success"
                            className="px-6"
                            onClick={() => handleAction(viewRecord, "approve")}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </>
                  ) : viewRecord.approval?.status === 1 ? (
                    <Button
                      variant="success"
                      className="px-6 disabled:opacity-100"
                      disabled
                    >
                      Approved
                    </Button>
                  ) : viewRecord.approval?.status === 0 ? (
                    <Button
                      variant="danger"
                      className="px-6 disabled:opacity-100"
                      disabled
                    >
                      Declined
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </Modal>
        ))}
    </AppLayout>
  );
}
