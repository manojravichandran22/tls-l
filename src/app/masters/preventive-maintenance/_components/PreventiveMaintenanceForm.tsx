"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import FormTextarea from "@/components/ui/FormTextarea";
import { apiUpload } from "@/services/apiClient";
import { useBranchAccess } from "@/hooks/useBranchAccess";
import { Upload, FileCode } from "lucide-react";
import type { MachineHistory, BranchOption } from "./types";

interface Props {
  machine: MachineHistory;
  branches: BranchOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

export default function PreventiveMaintenanceForm({
  machine,
  branches,
  onClose,
  onSaved,
  onError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { branchId: userBranchId, isAdmin } = useBranchAccess();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const initialBranchId = !isAdmin && userBranchId
    ? String(userBranchId)
    : (machine.branch_id ? String(machine.branch_id) : (userBranchId ? String(userBranchId) : ""));

  const [form, setForm] = useState({
    last_service_date: getTodayDate(),
    next_service_date: machine.next_maintenance || "",
    branch_id: initialBranchId,
    notes: "",
    // action_plan: '',
    // type: '',
    // priority: '',
  });

  useEffect(() => {
    if (!isAdmin && userBranchId) {
      setForm((f) => ({ ...f, branch_id: String(userBranchId) }));
    }
  }, [isAdmin, userBranchId]);

  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.last_service_date) {
      setFormError("Last Service Date is required");
      return;
    }
    if (!form.next_service_date) {
      setFormError("Next Service Date is required");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const fd = new FormData();

      const machineId = machine.id ?? (machine as any).machine_id;
      if (machineId != null && String(machineId) !== "undefined" && String(machineId) !== "") {
        fd.append("machine_id", String(machineId));
      }

      const machineTypeId = machine.machine_type_id ?? (machine as any).type_id ?? (machine as any).machine_type_id ?? (machine as any).machine_type?.id;
      if (machineTypeId != null && String(machineTypeId) !== "undefined" && String(machineTypeId) !== "") {
        fd.append("machine_type_id", String(machineTypeId));
      }

      if (form.last_service_date) {
        fd.append("last_service_date", form.last_service_date);
      }
      if (form.next_service_date) {
        fd.append("next_service_date", form.next_service_date);
      }

      const branchIdVal = form.branch_id || machine.branch_id || userBranchId;
      if (branchIdVal != null && String(branchIdVal) !== "undefined" && String(branchIdVal) !== "") {
        fd.append("branch_id", String(branchIdVal));
      }

      if (form.notes) {
        fd.append("notes", form.notes);
      }
      // fd.append('action_plan', form.action_plan)
      // fd.append('type', form.type)
      // fd.append('priority', form.priority)

      if (file) {
        fd.append("files", file);
      }

      const res = await apiUpload<{ success?: boolean; message?: string }>(
        "/history/priority",
        fd,
      );

      if (!res.success) {
        setFormError(res.message || "Failed to submit maintenance data");
        return;
      }

      onSaved(res.message || "Maintenance details recorded successfully");
      onClose();
    } catch (err) {
      console.error(err);
      setFormError("An error occurred while saving maintenance details");
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" type="button" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        form="maintenance-form"
        isLoading={saving}
      >
        Save Maintenance
      </Button>
    </>
  );

  return (
    <Modal
      title="Machine Maintenance"
      onClose={onClose}
      size="lg"
      footer={footer}
    >
      {formError && (
        <div className="mb-4 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600 bg-red-50">
          {formError}
        </div>
      )}

      {/* Machine Information (Read-only reference) */}
      <div className="mb-5 p-4 rounded-input border border-input-line bg-table-head/40">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-t-light mb-2">
          Machine Details
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm2">
          <div>
            <span className="text-t-lighter block text-xs">Machine No</span>
            <span className="text-accent font-semibold">
              {machine.machine_no}
            </span>
          </div>
          <div>
            <span className="text-t-lighter block text-xs">Brand / Model</span>
            <span className="text-t-body">
              {machine.brand || "-"} / {machine.model_no || "-"}
            </span>
          </div>
          <div>
            <span className="text-t-lighter block text-xs">Machine Type</span>
            <span className="text-t-body">
              {machine.machine_type_name || "-"}
            </span>
          </div>
          <div>
            <span className="text-t-lighter block text-xs">Serial No</span>
            <span className="text-t-body">{machine.serial_no || "-"}</span>
          </div>
        </div>
      </div>

      <form
        id="maintenance-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {/* Service Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Last Service Date"
            type="date"
            value={form.last_service_date}
            onChange={(e) => set("last_service_date", e.target.value)}
            required
          />
          <FormInput
            label="Next Service Date"
            type="date"
            value={form.next_service_date}
            onChange={(e) => set("next_service_date", e.target.value)}
            min={getTodayDate()}
            required
          />
        </div>

        {/* Branch */}
        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={(e) => set("branch_id", e.target.value)}
          options={branches.map((b) => ({ value: b.id, label: b.branch_name }))}
          placeholder="Select branch"
          disabled={!isAdmin}
        />

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Type"
            type="number"
            placeholder="e.g. 4"
            value={form.type}
            onChange={e => set('type', e.target.value)}
          />
          <FormInput
            label="Priority"
            type="number"
            placeholder="e.g. 9"
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
          />
        </div>

        <FormInput
          label="Action Plan"
          placeholder="Enter the maintenance action plan"
          value={form.action_plan}
          onChange={e => set('action_plan', e.target.value)}
        /> */}

        {/* Notes */}
        <FormTextarea
          label="Notes"
          placeholder="Describe the maintenance notes/details..."
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
        />

        {/* File Upload */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-t-body">Attachment</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 h-input-h px-btn-px rounded-input border border-input-line bg-card hover:bg-table-head text-sm2 text-t-body cursor-pointer transition-colors"
            >
              <Upload size={15} />
              Choose File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-1.5 text-xs text-success-text bg-success-bg border border-success-text/25 px-2.5 py-1 rounded-full">
                <FileCode size={13} />
                <span>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <span className="text-xs text-t-lighter">No file selected</span>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
