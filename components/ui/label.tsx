// The app's two label styles, previously copy-pasted as raw class strings ~20
// times. Spacing is a token rather than a `className` override so a caller can
// never emit two competing `mb-*` classes.

const FIELD_MARGINS = {
  "0": "",
  "1": "mb-1",
  "1.5": "mb-1.5",
  "2": "mb-2",
  "3": "mb-3",
} as const;

const FORM_MARGINS = {
  "1.5": "mb-1.5",
  "2": "mb-2",
  "3": "mb-3",
} as const;

type FieldLabelProps = {
  children: React.ReactNode;
  /** Bottom margin token. "0" for a label sitting in a tight stack. */
  mb?: keyof typeof FIELD_MARGINS;
};

/**
 * Small uppercase caption above a read-only value or a control — the dense
 * "micro-label" used in drawers, detail panels, and modal sections.
 */
export function FieldLabel({ children, mb = "2" }: FieldLabelProps) {
  return (
    <p className={`text-xs text-slate-400 uppercase tracking-wide ${FIELD_MARGINS[mb]}`}>
      {children}
    </p>
  );
}

type FormLabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  mb?: keyof typeof FORM_MARGINS;
};

/** Standard form-control label — a real `<label>`, for inputs the user edits. */
export function FormLabel({ children, htmlFor, mb = "2" }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-200 ${FORM_MARGINS[mb]}`}>
      {children}
    </label>
  );
}
