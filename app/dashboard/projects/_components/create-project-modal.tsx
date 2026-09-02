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
import { PROJECT_COLORS } from "@/lib/constants";
import { parseTechStack } from "@/lib/projects";
import type { NewProject } from "@/lib/api/projects";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  /** Persists the project; returns true on success. */
  onSubmit: (values: NewProject) => Promise<boolean>;
};

export function CreateProjectModal({ open, onClose, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [techStack, setTechStack] = useState("");
  const [repository, setRepository] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      status: "active",
      color,
      tech_stack: parseTechStack(techStack),
      repository_url: repository.trim() || null,
      notes: null,
    });
    setSaving(false);
    if (!ok) return;

    setName("");
    setDescription("");
    setColor(PROJECT_COLORS[0]);
    setTechStack("");
    setRepository("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader>New Project</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="My Awesome Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Tech stack (comma-separated)"
              placeholder="React, TypeScript, Supabase"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
            />
            <Input
              label="Repository URL"
              placeholder="https://github.com/..."
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
            />
            <ColorPicker
              label="Color"
              colors={PROJECT_COLORS}
              value={color}
              onChange={setColor}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create Project"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
