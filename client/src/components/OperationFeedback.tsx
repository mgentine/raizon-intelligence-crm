import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function OperationFeedback() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching > 0 || mutating > 0;
  const [visible, setVisible] = useState(false);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active) {
      wasActive.current = true;
      setVisible(true);
      return;
    }
    if (!wasActive.current) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
      wasActive.current = false;
    }, 220);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  const isSaving = mutating > 0;
  return (
    <div
      className={`operation-feedback ${active ? "operation-feedback-active" : "operation-feedback-done"}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {active ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{active ? (isSaving ? "Salvando alterações…" : "Atualizando dados…") : "Operação concluída"}</span>
      {active && <span className="operation-feedback-dots" aria-hidden="true"><i /> <i /> <i /></span>}
    </div>
  );
}
