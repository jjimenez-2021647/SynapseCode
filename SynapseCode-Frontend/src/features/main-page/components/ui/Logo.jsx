import { cn, layout, ui } from "../../mainPageClasses";

export function Logo() {
  return (
    <div className={cn(layout.logo, ui.logoText)} aria-label="SynapseCode">
      <span className={cn(layout.logoMark, ui.logoMark)}>{"</>"}</span>
      <span><span className={ui.logoSynapse}>Synapse</span><strong className={ui.logoCode}>Code</strong></span>
    </div>
  );
}
