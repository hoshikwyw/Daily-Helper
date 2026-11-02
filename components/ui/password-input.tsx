"use client";

import { useState } from "react";
import { Input, type InputProps } from "@kwyw/kayv-glass-ui";

type PasswordInputProps = Omit<InputProps, "type" | "rightIcon">;

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {/* A slash across the eye while the password is hidden. */}
      {!open && <path d="M4 4l16 16" />}
    </svg>
  );
}

/**
 * A password field with a show/hide toggle in its right edge.
 *
 * The library Input renders `rightIcon` inside a `pointer-events-none` span,
 * so the button opts back in with `pointer-events-auto`. The toggle is a
 * button, not a tabbable icon, so it reads correctly to assistive tech and
 * is reachable from the keyboard after the field.
 */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="pointer-events-auto -m-2 p-2 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
        >
          <EyeIcon open={visible} />
        </button>
      }
    />
  );
}
