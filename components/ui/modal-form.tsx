// A <form> that wraps ModalBody and ModalFooter inside the library Modal.
//
// The Modal panel is a flex column capped at the viewport height, and its
// body only scrolls when it is a direct flex child. A bare <form> in between
// breaks that chain: the body grows past the panel and the bottom of a tall
// form is clipped with no way to reach it. This carries the chain through.

type ModalFormProps = React.ComponentPropsWithoutRef<"form">;

export function ModalForm({ className = "", children, ...props }: ModalFormProps) {
  return (
    <form {...props} className={`flex flex-col min-h-0 flex-1 ${className}`}>
      {children}
    </form>
  );
}
