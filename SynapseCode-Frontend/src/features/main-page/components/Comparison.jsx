import { comparisonRows } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { Icon } from "./ui/Icon";
import { SectionHeading } from "./ui/SectionHeading";

export function Comparison() {
  const platforms = [
    ["synapse", "SynapseCode"],
    ["replit", "Replit"],
    ["together", "CodeTogether"],
    ["codespaces", "Codespaces"],
  ];

  return (
    <section id="comparativa" className={cn(layout.section, ui.band)}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="COMPARATIVA" title="Por que SynapseCode?">
          Comparativa con las principales plataformas del mercado.
        </SectionHeading>
        <div className={cn(layout.comparison, ui.panel)}>
          <div className={cn(layout.comparisonGrid, "border-b border-border-light/60", ui.tableHead)}>
            <span className={cn(layout.comparisonCell, "justify-start")}>Caracteristica</span>
            {platforms.map(([, label]) => <span className={layout.comparisonCell} key={label}>{label}</span>)}
          </div>
          {comparisonRows.map((row) => (
            <div className={cn(layout.comparisonGrid, "border-b border-border-light/40")} key={row.feature}>
              <strong className={cn(layout.comparisonCell, "justify-start text-slate-200 font-bold")}>{row.feature}</strong>
              {platforms.map(([key]) => (
                <span key={key} className={cn(layout.comparisonCell, "[&>svg]:h-7 [&>svg]:w-7 [&>svg]:rounded-full [&>svg]:p-1.5", row[key] === true ? `yes ${ui.success} [&>svg]:bg-emerald-500/15` : row[key] === false ? `no ${ui.danger} [&>svg]:bg-red-500/15` : `partial ${ui.warning} [&>svg]:bg-amber-500/15`)}>
                  <Icon name={row[key] === true ? "check" : row[key] === false ? "x" : "minus"} size={15} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
