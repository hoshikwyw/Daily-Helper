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
import { PRESET_COLORS } from "@/lib/expenses";
import type { CustomCategory } from "@/lib/types";

type ManageCategoriesModalProps = {
  open: boolean;
  onClose: () => void;
  defaultCategories: { name: string; color: string }[];
  customCategories: CustomCategory[];
  /** Adds a category; returns true on success (e.g. non-duplicate). */
  onAddCategory: (name: string, color: string) => Promise<boolean>;
  onDeleteCategory: (id: string) => void;
};

export function ManageCategoriesModal({
  open,
  onClose,
  defaultCategories,
  customCategories,
  onAddCategory,
  onDeleteCategory,
}: ManageCategoriesModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const ok = await onAddCategory(name.trim(), color);
    setSaving(false);
    if (ok) setName("");
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>Manage Categories</ModalHeader>
      <ModalBody>
        <div className="space-y-5">
          {/* Add new category */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Add New Category</p>
            <form onSubmit={handleAdd} className="space-y-3">
              <Input
                label="Category name"
                placeholder="e.g. Subscriptions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <ColorPicker label="Color" colors={PRESET_COLORS} value={color} onChange={setColor} size="sm" />
              <Button variant="primary" type="submit" size="sm" disabled={saving}>
                {saving ? "Adding…" : "Add Category"}
              </Button>
            </form>
          </div>

          <div className="border-t border-white/10" />

          {/* Default categories (read-only) */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Default</p>
            <div className="space-y-1.5">
              {defaultCategories.map((c) => (
                <div key={c.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-300 text-sm flex-1">{c.name}</span>
                  <span className="text-slate-600 text-xs">built-in</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom categories */}
          {customCategories.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Custom</p>
              <div className="space-y-1.5">
                {customCategories.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/5 group">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-300 text-sm flex-1">{c.name}</span>
                    <button
                      onClick={() => onDeleteCategory(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-base leading-none px-1"
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
