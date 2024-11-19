// Adapted from https://github.com/vercel/next.js/tree/canary/examples/with-portals

import {useEffect, useState, PropsWithChildren} from "react";
import {createPortal} from "react-dom";

interface ClientOnlyPortalProps {
  targetId: string;
}

export default function ClientOnlyPortal({
  children,
  targetId,
}: PropsWithChildren<ClientOnlyPortalProps>) {
  const [targetEl, setTargetEl] = useState<Element | null>(null);

  useEffect(() => {
    setTargetEl(document.getElementById(targetId));
  }, [targetId]);

  return targetEl ? createPortal(children, targetEl) : null;
}
