"use client";

import { useState } from "react";
import { Button, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "@kwyw/kayv-glass-ui";
import { FieldLabel } from "@/components/ui/label";
import { AVATARS, type AvatarId } from "@/lib/scene";
import { WORLD_NAME_MAX } from "@/lib/game";
import type { GameProfile } from "@/lib/api/game";
import { AvatarSprite } from "./avatar-sprite";

type CustomiseModalProps = {
  open: boolean;
  onClose: () => void;
  profile: GameProfile;
  /** Saves and reports success; the dialog closes itself on true. */
  onSave: (profile: GameProfile) => Promise<boolean>;
};

/** Pick a starter and name the world. Both are cosmetic; XP is untouched. */
export function CustomiseModal({ open, onClose, profile, onSave }: CustomiseModalProps) {
  const [avatar, setAvatar] = useState<AvatarId>(profile.avatar_id);
  const [name, setName] = useState(profile.world_name);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  // Counted in characters, as the database counts, so emoji are not penalised.
  const length = Array.from(trimmed).length;
  const valid = length > 0 && length <= WORLD_NAME_MAX;
  const chosen = AVATARS.find((a) => a.id === avatar);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const ok = await onSave({ avatar_id: avatar, world_name: trimmed });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader>Customise your world</ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            <div>
              <FieldLabel mb="3">Who lives here</FieldLabel>
              <div role="group" aria-label="Avatar" className="grid grid-cols-3 gap-2">
                {AVATARS.map((a) => {
                  const selected = a.id === avatar;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAvatar(a.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-colors ${
                        selected ? "border-white/40 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <AvatarSprite avatar={a.id} size={56} label={a.label} />
                      <span className="text-sm text-slate-100">{a.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">{chosen?.blurb}</p>
            </div>

            <Input
              label="World name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={
                length > WORLD_NAME_MAX
                  ? `That is ${length - WORLD_NAME_MAX} over the ${WORLD_NAME_MAX}-character limit.`
                  : undefined
              }
              hint={`Up to ${WORLD_NAME_MAX} characters. Shown on this page and the Today card.`}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving} disabled={!valid}>
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
