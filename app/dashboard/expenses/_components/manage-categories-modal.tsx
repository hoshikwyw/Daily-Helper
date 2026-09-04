"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@kwyw/kayv-glass-ui";
import { ColorPicker } from "@/components/ui/color-picker";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/label";
import { DEFAULT_CATEGORIES, ENTRY_KINDS, PRESET_COLORS } from "@/lib/expenses";
import type { CustomCategory, EntryKind } from "@/lib/types";

type ManageCategoriesModalProps = {
  open: boolean;
  onClose: () => void;
  customCategories: CustomCategory[];
  /** Adds a category; returns true on success (e.g. non-duplicate). */
  onAddCategory: (kind: EntryKind, name: string, color: string) => Promise<boolean>;
  onDeleteCategory: (id: string) => void;
};

export function ManageCategoriesModal({
  open,
  onClose,
  customCategories,
  onAddCategory,
  onDeleteCategory,
}: ManageCategoriesModalProps) {
  const [kind, setKind] = useState<EntryKind>("expense");
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const custom = customCategories.filter((c) => c.kind === kind);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const ok = await onAddCategory(kind, name.trim(), color);
    setSaving(false);
    if (ok) setName("");
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>Manage Categories</ModalHeader>
      <ModalBody>
        <div className="space-y-5">
          {/* Categories are per-ledger, so pick which one you're editing */}
          <NativeSelect
            label="Ledger"
            value={kind}
            onChange={(v) => setKind(v as EntryKind)}
            options={ENTRY_KINDS.map((k) => ({
              value: k.value,
              label: `${k.label} categories`,
            }))}
          />

          <div>
            <FieldLabel mb="3">Add New Category</FieldLabel>
            <form onSubmit={handleAdd} className="space-y-3">
              <Input
                label="Category name"
                placeholder={kind === "income" ? "e.g. Bonus" : "e.g. Subscriptions"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <ColorPicker
                label="Color"
                colors={PRESET_COLORS}
                value={color}
                onChange={setColor}
                size="sm"
              />
              <Button variant="primary" type="submit" size="sm" disabled={saving}>
                {saving ? "Adding…" : "Add Category"}
              </Button>
            </form>
          </div>

          <div className="border-t border-white/10" />

          {/* Built-in categories (read-only) */}
          <div>
            <FieldLabel>Default</FieldLabel>
            <div className="space-y-1.5">
              {DEFAULT_CATEGORIES[kind].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/5"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-slate-200 text-sm flex-1">{c.name}</span>
                  <span className="text-slate-500 text-xs">built-in</span>
                </div>
              ))}
            </div>
          </div>

          {custom.length > 0 && (
            <div>
              <FieldLabel>Custom</FieldLabel>
              <div className="space-y-1.5">
                {custom.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg bg-white/5 group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-slate-200 text-sm flex-1">{c.name}</span>
                    <button
                      onClick={() => onDeleteCategory(c.id)}
                      className="hover-reveal transition-opacity text-slate-400 hover:text-red-400 text-xl leading-none h-10 w-10 flex items-center justify-center rounded-lg shrink-0"
                      aria-label="Delete category"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
}
