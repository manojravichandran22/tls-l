"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { apiCall } from "@/services/apiClient";
import type { LinkOrder, StyleOption } from "./types";
import { useBranchAccess } from "@/hooks/useBranchAccess";

interface Props {
  row: LinkOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LinkOrderModal({ row, onClose, onSuccess }: Props) {
  const orderBuyer = row.buyer ?? "";
  const { branchId: userBranchId, isAdmin } = useBranchAccess();
  const effectiveBranchId =
    !isAdmin && userBranchId
      ? String(userBranchId)
      : userBranchId
        ? String(userBranchId)
        : "";
  const [styleId, setStyleId] = useState("");
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStylesLoading(true);
    const payload: Record<string, unknown> = {
      page: 1,
      per_page: 500,
      status: "all",
      search: "",
      buyer: orderBuyer,
    };
    if (effectiveBranchId) payload.branch_id = effectiveBranchId;
    apiCall<{ data?: { styles?: StyleOption[]; records?: StyleOption[] } }>(
      "/styles/list",
      { method: "GET", encrypt: false, payload },
    )
      .then((res) => {
        const d = res.data as unknown as
          | { styles?: StyleOption[]; records?: StyleOption[] }
          | undefined;
        const fetchedStyles = d?.styles ?? d?.records ?? [];
        const filteredStyles = orderBuyer
          ? fetchedStyles.filter((s) => s.buyer === orderBuyer)
          : fetchedStyles;
        setStyles(filteredStyles);
      })
      .catch(() => {})
      .finally(() => setStylesLoading(false));
  }, [effectiveBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleId) {
      setError("Please select a style");
      return;
    }

    const selectedStyle = styles.find(
      (s) => s.id.toString() === styleId.toString(),
    );

    setSaving(true);
    setError("");
    try {
      const linkPayload: Record<string, unknown> = {
        order_no: String(row.order_no),
        colour: row.colour ?? "",
        order_buyer: orderBuyer,
        style_id: styleId,
        style_buyer: selectedStyle?.buyer ?? "",
        order_id: String(row.id),
      };
      const targetBranchId =
        (row as any).branch_id ?? (row as any).branch?.id ?? effectiveBranchId;
      if (targetBranchId) linkPayload.branch_id = String(targetBranchId);

      const res = await apiCall<{ success?: boolean; message?: string }>(
        "/order/linkorder",
        {
          method: "POST",
          encrypt: false,
          payload: linkPayload,
        },
      );
      if (res.success === false) {
        setError(res.message || "Link failed");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Failed to link order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const INPUT_CLS =
    "w-full h-10 px-3 text-sm text-t-secondary bg-input border border-input-line rounded-input outline-none focus:border-accent appearance-none";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-modal rounded-card shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-table-line">
          <h2 className="text-sm font-bold text-t-primary">
            Add New — Order &amp; OB Style Linking
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-t-lighter hover:text-t-body transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form
          id="link-order-form"
          onSubmit={handleSubmit}
          className="px-6 py-5 flex flex-col gap-4"
        >
          {/* Server / validation error banner */}
          {error && (
            <div className="px-3 py-2 border border-red-300 rounded-input text-xs text-red-600 dark:border-red-900/40 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Order Number — read-only pre-filled */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">
              Order Number
            </label>
            <div className="relative">
              <select
                disabled
                className={`${INPUT_CLS} opacity-60 cursor-not-allowed`}
              >
                <option>{row.order_no}</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-t-lighter text-xs">
                ▾
              </span>
            </div>
          </div>

          {/* Colour — read-only pre-filled */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">Colour</label>
            <div className="relative">
              <select
                disabled
                className={`${INPUT_CLS} opacity-60 cursor-not-allowed`}
              >
                <option>{row.colour || "—"}</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-t-lighter text-xs">
                ▾
              </span>
            </div>
          </div>

          {/* Order Buyer — read-only pre-filled */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">
              Order Buyer
            </label>
            <div className="relative">
              <select
                disabled
                className={`${INPUT_CLS} opacity-60 cursor-not-allowed`}
              >
                <option>{orderBuyer || "—"}</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-t-lighter text-xs">
                ▾
              </span>
            </div>
          </div>

          {/* Buyer & Style */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">
              Buyer &amp; Style
            </label>
            <div className="relative">
              <select
                value={styleId}
                onChange={(e) => {
                  setStyleId(e.target.value);
                  setError("");
                }}
                className={`${INPUT_CLS} cursor-pointer ${error ? "border-red-500" : ""}`}
              >
                <option value="">
                  {stylesLoading ? "Loading styles..." : "e.g. Kaibi, M&S"}
                </option>
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.buyer} — {s.style_name} ({s.style_no})
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-t-lighter text-xs">
                ▾
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-table-line">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="link-order-form"
            isLoading={saving}
          >
            Add OB Style
          </Button>
        </div>
      </div>
    </div>
  );
}
