"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import FormTextarea from "@/components/ui/FormTextarea";
import { ChevronDown, X } from "lucide-react";
import { apiCall } from "@/services/apiClient";
import { validateField, validateAll, hasErrors } from "@/lib/validation";
import { useBranchAccess } from "@/hooks/useBranchAccess";
import type {
  Operation,
  MachineTypeOption,
  MachineSpec,
  DefectOption,
  OperationFormData,
  FormField,
  FormErrors,
  Touched,
} from "./types";
import { rules } from "./types";

// ── MultiSelectDefects ─────────────────────────────────────────────────────────

function MultiSelectDefects({
  selected,
  onChange,
  options,
  loading = false,
  disabled = false,
  error,
  touched,
}: {
  selected: number[];
  onChange: (ids: number[]) => void;
  options: DefectOption[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const showError = error && touched !== false;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: number) => {
    if (disabled) return;
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };

  const remove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selected.filter((x) => x !== id));
  };

  const selectedOptions = options.filter((o) => selected.includes(o.id));
  const filteredOptions = search
    ? options.filter(
        (o) =>
          o.defect_name.toLowerCase().includes(search.toLowerCase()) ||
          o.code.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-xs font-medium text-t-body">Defects</label>
      <div
        className={`min-h-input-h px-2.5 py-1.5 flex flex-wrap gap-1.5 items-center
          bg-input border rounded-input transition-colors
          ${disabled ? "opacity-60 cursor-not-allowed bg-card-alt" : "cursor-pointer"}
          ${showError ? "border-red-500" : "border-input-line"}
          ${open && !disabled ? "border-accent ring-2 ring-focus-ring/15" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        {selectedOptions.length === 0 && (
          <span className="text-sm2 text-t-lighter select-none">
            {disabled
              ? "Select branch first"
              : loading
              ? "Loading defects..."
              : "Select defects…"}
          </span>
        )}
        {selectedOptions.map((o) => (
          <span
            key={o.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent border border-accent/20"
          >
            {o.defect_name}
            {!disabled && (
              <X
                size={10}
                className="cursor-pointer hover:text-danger"
                onClick={(e) => remove(o.id, e)}
              />
            )}
          </span>
        ))}
        <ChevronDown
          size={13}
          className={`ml-auto shrink-0 text-t-lighter transition-transform ${open && !disabled ? "rotate-180" : ""}`}
        />
      </div>
      {showError && (
        <span className="text-xs text-red-500 mt-0.5">{error}</span>
      )}

      {open && !disabled && (
        <div className="absolute z-[200] top-full left-0 right-0 mt-1 bg-dropdown border border-table-line rounded-card shadow-lg max-h-64 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-dropdown border-b border-table-line p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search defects..."
              className="w-full px-3 py-2 text-sm border border-input-line rounded-input outline-none focus:border-accent"
              autoFocus
            />
          </div>

          {loading ? (
            <p className="px-3 py-3 text-xs text-t-lighter">Loading defects...</p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-xs text-t-lighter">
              No defects available for selected branch
            </p>
          ) : (
            filteredOptions.map((o) => (
              <label
                key={o.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-card-alt cursor-pointer select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  className="accent-accent w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs font-mono text-t-lighter w-14 shrink-0">
                  {o.code}
                </span>
                <span className="text-sm2 text-t-body">{o.defect_name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── OperationForm ──────────────────────────────────────────────────────────────

interface OperationFormProps {
  editOperation: Operation | null;
  machineTypes: MachineTypeOption[];
  defectOptions: DefectOption[];
  branches: { id: number; branch_name: string }[];
  onClose: () => void;
  onSave: (msg: string) => void;
}

export default function OperationForm({
  editOperation,
  machineTypes,
  defectOptions,
  branches,
  onClose,
  onSave,
}: OperationFormProps) {
  const isEdit = !!editOperation;
  const { branchId: userBranchId, isAdmin } = useBranchAccess();

  const [form, setForm] = useState<OperationFormData>({
    operation_name: editOperation?.operation_name ?? "",
    code: editOperation?.code ?? "",
    sam: editOperation?.sam ? String(editOperation.sam) : "",
    notes: editOperation?.notes ?? "",
    machine_type_id: editOperation?.machine_type_id
      ? String(editOperation.machine_type_id)
      : "",
    machine_id: editOperation?.machine_id
      ? String(editOperation.machine_id)
      : "",
    branch_id: (editOperation as any)?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ""),
    defect_ids: editOperation?.defect_details?.map((d) => d.id) ?? [],
  });

  const [defects, setDefects] = useState<DefectOption[]>(defectOptions);
  const [defectsLoading, setDefectsLoading] = useState(false);
  const [formMachineTypes, setFormMachineTypes] = useState<MachineTypeOption[]>(machineTypes);
  const [machineTypesLoading, setMachineTypesLoading] = useState(false);
  const [machineSpecs, setMachineSpecs] = useState<MachineSpec[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [formError, setFormError] = useState("");

  const fetchDefects = useCallback(async (bId: string) => {
    setDefectsLoading(true);
    try {
      const res = await apiCall<{ success?: boolean; data?: DefectOption[] }>(
        "/dropdown/defectList",
        {
          method: "GET",
          encrypt: false,
          payload: bId ? { branch_id: bId } : {},
        }
      );
      setDefects(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDefects([]);
    } finally {
      setDefectsLoading(false);
    }
  }, []);

  const fetchMachineTypes = useCallback(async (bId: string) => {
    setMachineTypesLoading(true);
    try {
      const res = await apiCall<{ success?: boolean; data?: MachineTypeOption[] }>(
        "/dropdown/machineTypeList",
        {
          method: "GET",
          encrypt: false,
          payload: bId ? { branch_id: bId } : {},
        }
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setFormMachineTypes(list.length > 0 ? list : machineTypes);
    } catch {
      setFormMachineTypes(machineTypes);
    } finally {
      setMachineTypesLoading(false);
    }
  }, [machineTypes]);

  useEffect(() => {
    fetchDefects(form.branch_id);
    fetchMachineTypes(form.branch_id);
  }, [form.branch_id, fetchDefects, fetchMachineTypes]);

  const handleBranchChange = (newBranchId: string) => {
    setForm(f => ({
      ...f,
      branch_id: newBranchId,
      machine_type_id: "",
      machine_id: "",
      defect_ids: [],
    }));
    setMachineSpecs([]);
  };

  const fetchSpecs = useCallback(async (machineTypeId: string) => {
    if (!machineTypeId) {
      setMachineSpecs([]);
      return;
    }
    setSpecsLoading(true);
    try {
      const res = await apiCall<{
        data?: { rows?: MachineSpec[] } | MachineSpec[];
      }>("/machine/machinespecificationlist", {
        method: "GET",
        encrypt: false,
        payload: { machine_id: machineTypeId },
      });
      const rows = Array.isArray(res.data)
        ? res.data
        : ((res.data as { rows?: MachineSpec[] })?.rows ?? []);
      setMachineSpecs(rows);
    } catch {
      setMachineSpecs([]);
    } finally {
      setSpecsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecs(form.machine_type_id);
  }, [form.machine_type_id, fetchSpecs]);

  const setField = (key: keyof OperationFormData, val: string | number[]) => {
    if (key === "machine_type_id") {
      setForm((f) => ({
        ...f,
        machine_type_id: val as string,
        machine_id: "",
      }));
      setMachineSpecs([]);
    } else {
      setForm((f) => ({ ...f, [key]: val }));
    }
    if (key in rules && touched[key as FormField]) {
      setErrors((e) => ({
        ...e,
        [key]: validateField(val as string, rules[key as FormField]),
      }));
    }
  };

  const handleBlur = (key: FormField) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({
      ...e,
      [key]: validateField(form[key] as string, rules[key]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Touched = {
      operation_name: true,
      sam: true,
      machine_type_id: true,
    };
    setTouched(allTouched);

    const allErrors = validateAll(
      {
        operation_name: form.operation_name,
        sam: form.sam,
        machine_type_id: form.machine_type_id,
      },
      rules,
    );
    setErrors(allErrors as FormErrors);
    if (hasErrors(allErrors)) return;

    setSaving(true);
    setFormError("");
    try {
      const payload: Record<string, unknown> = {
        operation_name: form.operation_name,
        sam: form.sam,
        notes: form.notes,
        machine_type_id: form.machine_type_id,
        machine_id: form.machine_id,
        branch_id: form.branch_id,
        defects: form.defect_ids,
      };
      let res: { success?: boolean; message?: string };
      if (isEdit) {
        payload.uuid = editOperation.uuid;
        if (editOperation.code || form.code) {
          payload.code = editOperation.code || form.code;
        }
        res = await apiCall("/operation/update", { payload });
      } else {
        if (form.code) {
          payload.code = form.code;
        }
        res = await apiCall("/operation/create", { payload });
      }
      if (res.success === false) {
        setFormError(res.message || "Save failed");
        return;
      }
      onSave(
        res.message || (isEdit ? "Operation updated" : "Operation created"),
      );
      onClose();
    } catch {
      setFormError("Failed to save operation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Operation" : "Add Operation"}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="operation-form"
            isLoading={saving}
          >
            {isEdit ? "Update Operation" : "Add Operation"}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form
        id="operation-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <FormInput
          label="Operation Name"
          value={form.operation_name}
          onChange={(e) => setField("operation_name", e.target.value)}
          onBlur={() => handleBlur("operation_name")}
          placeholder="e.g. Sleeve Attach"
          error={errors.operation_name}
          touched={touched.operation_name}
          required
        />

        <FormInput
          label="SAM (Minutes)"
          value={form.sam}
          onChange={(e) => setField("sam", e.target.value)}
          onBlur={() => handleBlur("sam")}
          placeholder="e.g. 02:30"
          error={errors.sam}
          touched={touched.sam}
          required
        />

        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={(e) => handleBranchChange(e.target.value)}
          options={branches.map((b) => ({
            value: String(b.id),
            label: b.branch_name,
          }))}
          placeholder="Select branch"
          disabled={!isAdmin}
        />

        <FormSelect
          label="Machine Type"
          value={form.machine_type_id}
          onChange={(e) => {
            setField("machine_type_id", e.target.value);
            if (touched.machine_type_id)
              setErrors((er) => ({
                ...er,
                machine_type_id: e.target.value
                  ? ""
                  : "Machine type is required",
              }));
          }}
          onBlur={() => handleBlur("machine_type_id")}
          options={formMachineTypes.map((t) => ({
            value: t.id,
            label: t.type_name,
          }))}
          placeholder={
            machineTypesLoading
              ? "Loading machine types..."
              : form.branch_id
              ? "Select machine type"
              : "Select branch first"
          }
          disabled={machineTypesLoading || !form.branch_id}
          error={errors.machine_type_id}
          touched={touched.machine_type_id}
          required
        />

        <MultiSelectDefects
          selected={form.defect_ids}
          onChange={(ids) => setField("defect_ids", ids)}
          options={defects}
          loading={defectsLoading}
          disabled={!form.branch_id}
        />

        <FormTextarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Optional notes"
          rows={2}
        />
      </form>
    </Modal>
  );
}
