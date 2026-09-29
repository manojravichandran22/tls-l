"use client";

import { X } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface OrderViewProps {
  viewData: Record<string, unknown> | null;
  viewLoading: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}

export default function OrderView({
  viewData,
  viewLoading,
  onClose,
  footer,
}: OrderViewProps) {
  if (!viewData && !viewLoading) return null;

  const orderSizes =
    (viewData?.orderSizes as Record<string, unknown>[] | undefined) ?? [];
  const style = viewData?.style as Record<string, unknown> | undefined;

  const formatDate = (val: unknown) => {
    if (!val) return "—";
    const date = new Date(String(val));
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const renderVal = (val: unknown) => {
    if (val === undefined || val === null || val === "") return "—";
    return String(val);
  };

  const renderPer = (val: unknown) => {
    if (val === undefined || val === null || val === "") return "—";
    return `${val}%`;
  };

  const calcDaysLeft = (exFacDate: unknown): number | null => {
    if (!exFacDate) return null;
    const target = new Date(String(exFacDate));
    if (isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const daysLeft = viewData
    ? (calcDaysLeft(viewData.ex_fac_date) ??
        (viewData.days_left !== undefined && viewData.days_left !== null
          ? Number(viewData.days_left)
          : null))
    : null;
  const daysLeftLabel = daysLeft === null ? "—" : String(daysLeft);
  const todayLabel = formatDate(new Date().toISOString());

  return (
    <div className="fixed inset-0 z-[9997] flex justify-end">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-[1] bg-modal w-full max-w-[560px] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex-1 min-w-0">
            {viewLoading || !viewData ? (
              <div className="h-5 w-48 bg-table-head rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-base font-bold text-t-primary leading-snug">
                  Order #{String(viewData.order_no ?? "")}
                  {viewData.order_code
                    ? ` — ${String(viewData.order_code)}`
                    : ""}
                </h2>
                {style && (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {!!style.buyer && (
                      <div className="flex items-center text-xs border border-table-line rounded-md px-2.5 py-1.5 bg-table-head">
                        <span className="text-t-lighter font-medium mr-1.5">
                          Buyer:
                        </span>
                        <span className="font-semibold text-t-primary">
                          {String(style.buyer)}
                        </span>
                      </div>
                    )}
                    {!!style.style_no && (
                      <div className="flex items-center text-xs border border-table-line rounded-md px-2.5 py-1.5 bg-table-head">
                        <span className="text-t-lighter font-medium mr-1.5">
                          Style No:
                        </span>
                        <span className="font-semibold text-t-primary">
                          {String(style.style_no)}
                        </span>
                      </div>
                    )}
                    {!!style.style_name && (
                      <div className="flex items-center text-xs border border-table-line rounded-md px-2.5 py-1.5 bg-table-head">
                        <span className="text-t-lighter font-medium mr-1.5">
                          Style Name:
                        </span>
                        <span className="font-semibold text-t-primary">
                          {String(style.style_name)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 mt-0.5 p-1 text-t-lighter hover:text-t-body transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta badges */}
        {!viewLoading && viewData && (
          <div className="flex items-center gap-3 px-6 pb-4 shrink-0 flex-wrap">
            {!!(viewData.branch as any)?.branch_name && (
              <span className="px-2.5 py-0.5 rounded-xl text-xs2 bg-card-alt border border-input-line text-t-primary font-medium">
                Branch: {String((viewData.branch as any).branch_name)}
              </span>
            )}
            {!!viewData.colour && (
              <span className="px-2.5 py-0.5 rounded-xl text-xs2 bg-default-badge-bg text-default-badge-text font-medium">
                {String(viewData.colour)}
              </span>
            )}
            <Badge
              variant={Number(viewData.is_active) === 1 ? "success" : "default"}
            >
              {Number(viewData.is_active) === 1 ? "Active" : "Inactive"}
            </Badge>
            {daysLeft !== null && (
              <span className="px-2.5 py-0.5 rounded-xl text-xs2 font-medium bg-table-head text-t-lighter">
                Days Left: <span className="font-semibold text-t-primary">{daysLeftLabel}</span>
              </span>
            )}
          </div>
        )}

        <div className="h-px bg-table-line mx-6 shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats grid */}
          {!viewLoading && viewData && (
            <div className="grid grid-cols-3 gap-2 px-6 py-4 shrink-0">
              {(
                [
                  ["Order Qty", renderVal(viewData.order_qty)],
                  ["Prod Qty", renderVal(viewData.prod_qty)],
                  ["Total Qty", renderVal(viewData.tot_prd_ord_qty)],
                  ["Prod %", renderPer(viewData.prod_per)],
                  ["Input Qty", renderVal(viewData.input_qty)],
                  ["Output Qty", renderVal(viewData.output_qty)],
                  ["Rej Qty", renderVal(viewData.rej_qty)],
                  ["Rej %", renderPer(viewData.rej_per)],
                  ["WIP", renderVal(viewData.wip)],
                  ["Diff Qty", renderVal(viewData.diff_qty)],
                  ["Rework Qty", renderVal(viewData.rework_qty)],
                  ["Rework %", renderPer(viewData.rework_per)],
                  ["Checked Qty", renderVal(viewData.checked_qty)],
                  ["Additional Qty", renderVal(viewData.additional_qty)],
                  ["Tot Defect", renderVal(viewData.tot_defect)],
                  ["DHU", renderPer(viewData.dhu)],
                  ["Total Size", renderVal(viewData.total_size)],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col p-2.5 rounded-card border border-table-line bg-card"
                >
                  <span className="text-sm font-bold text-t-primary">
                    {value}
                  </span>
                  <span className="text-2xs text-t-lighter mt-0.5">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="h-px bg-table-line mx-6 shrink-0" />

          {/* Financial & Schedule details */}
          {!viewLoading && viewData && (
            <>
              <div className="grid grid-cols-4 gap-3 px-6 py-4 shrink-0">
                <div className="flex flex-col">
                  <span className="text-2xs text-t-lighter">
                    Ex-Factory Date
                  </span>
                  <span className="text-xs font-semibold text-t-primary mt-1">
                    {formatDate(viewData.ex_fac_date)}
                  </span>
                </div>
                {/* <div className="flex flex-col">
                  <span className="text-2xs text-t-lighter">Today</span>
                  <span className="text-xs font-semibold text-t-primary mt-1">
                    {todayLabel}
                  </span>
                </div> */}
                <div className="flex flex-col">
                  <span className="text-2xs text-t-lighter">Days Left</span>
                  <span className="text-xs font-semibold mt-1 text-t-primary">
                    {daysLeftLabel}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xs text-t-lighter">Cost/Piece</span>
                  <span className="text-xs font-semibold text-t-primary mt-1">
                    {viewData.cost_of_pic
                      ? `${viewData.currency_type ? String(viewData.currency_type) + " " : ""}${Number(viewData.cost_of_pic).toFixed(2)}`
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="h-px bg-table-line mx-6 shrink-0" />
            </>
          )}

          {/* Order Sizes */}
          <div className="px-6 py-4">
            {viewLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-10 bg-table-head rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-t-primary mb-3">
                  Order Sizes ({orderSizes.length})
                </h3>
                {orderSizes.length === 0 ? (
                  <p className="text-xs text-t-lighter py-6 text-center">
                    No sizes added.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[620px]">
                      <thead>
                        <tr className="bg-table-head">
                          <th className="px-3 py-2 text-left font-semibold text-t-lighter">
                            Size
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Ord Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Prod Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Total Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Prod %
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Input Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Output Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Rej Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Rej %
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            WIP
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Diff Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Rework Qty
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-t-lighter">
                            Rework %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderSizes.map((s, idx) => (
                          <tr
                            key={String(s.size)}
                            className={`border-t border-table-line ${idx % 2 === 0 ? "bg-card" : "bg-card-alt"}`}
                          >
                            <td className="px-3 py-2 font-semibold text-accent">
                              {renderVal(s.size)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.ord_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.prod_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.siz_prd_tot_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderPer(s.prod_per)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.input_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.output_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.rej_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderPer(s.rej_per)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.wip)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.diff_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderVal(s.rework_qty)}
                            </td>
                            <td className="px-3 py-2 text-right text-t-body">
                              {renderPer(s.rework_per)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const summaryData = Array.isArray(viewData?.summary)
                            ? (viewData.summary[0] as Record<string, unknown> | undefined)
                            : (viewData?.summary as Record<string, unknown> | undefined);

                          // Read all totals directly from backend API
                          const totalLabel = String(summaryData?.size ?? "Total");

                          const ordQty = summaryData?.order_qty ?? summaryData?.total_order_qty;
                          const prodQty = summaryData?.prod_qty ?? summaryData?.total_prod_qty;
                          const totalQty = summaryData?.siz_prd_tot_qty ?? summaryData?.tot_prd_ord_qty;
                          const prodPer = summaryData?.prod_per ?? summaryData?.avg_prod_per;
                          const inputQty = summaryData?.input_qty ?? summaryData?.total_input ?? summaryData?.input;
                          const outputQty = summaryData?.output_qty ?? summaryData?.output;
                          const rejQty = summaryData?.rej_qty ?? summaryData?.rejection_qty ?? summaryData?.rejection;
                          const rejPer = summaryData?.rej_per;
                          const wip = summaryData?.wip;
                          const diffQty = summaryData?.diff_qty;
                          const reworkQty = summaryData?.rework_qty ?? summaryData?.rework;
                          const reworkPer = summaryData?.rework_per;

                          return (
                            <tr className="border-t-2 border-table-line bg-table-head">
                              <td className="px-3 py-2 font-bold text-left text-t-primary whitespace-nowrap">
                                {totalLabel}
                              </td>
                              {/* Ord Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(ordQty)}
                              </td>
                              {/* Prod Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(prodQty)}
                              </td>
                              {/* Total Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(totalQty)}
                              </td>
                              {/* Prod % */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderPer(prodPer)}
                              </td>
                              {/* Input Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(inputQty)}
                              </td>
                              {/* Output Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(outputQty)}
                              </td>
                              {/* Rej Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(rejQty)}
                              </td>
                              {/* Rej % */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderPer(rejPer)}
                              </td>
                              {/* WIP */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(wip)}
                              </td>
                              {/* Diff Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(diffQty)}
                              </td>
                              {/* Rework Qty */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderVal(reworkQty)}
                              </td>
                              {/* Rework % */}
                              <td className="px-3 py-2 font-bold text-right text-t-primary">
                                {renderPer(reworkPer)}
                              </td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-table-line bg-card shrink-0 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
