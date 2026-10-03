"use client";

import { useEffect, useRef, useState } from "react";

type Props = { percent: number; onPercent: (percent: number) => void; disabled?: boolean };

export function AmountAllocationControl({ percent, onPercent, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, [open]);
  return <div className="amount-allocation" ref={ref}><button className="amount-allocation-max" disabled={disabled} onClick={() => onPercent(100)}>MAX</button><button className="amount-allocation-settings" aria-label="Choose amount percentage" aria-expanded={open} disabled={disabled} onClick={() => setOpen((visible) => !visible)}>⚙</button>{open && <div className="amount-allocation-panel"><input aria-label="Amount percentage" type="range" min="0" max="100" step="1" value={percent} onChange={(event) => onPercent(Number(event.target.value))} /><div>{[25, 50, 75, 100].map((value) => <button className={percent === value ? "active" : ""} key={value} onClick={() => onPercent(value)}>{value}%</button>)}</div></div>}</div>;
}
