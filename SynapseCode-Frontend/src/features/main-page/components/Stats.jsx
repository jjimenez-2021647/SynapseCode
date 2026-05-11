import { landingStats } from "../data/mainPageData";
import { useCountUp } from "../hooks/useCountUp";
import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { SectionHeading } from "./ui/SectionHeading";

export function Stats() {
  return (
    <section className={cn(layout.section, layout.statsSection)}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="NUMEROS" title="Plataforma en cifras" />
        <div className={layout.statsGrid}>
          {landingStats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat }) {
  const value = useCountUp(stat.value);
  return (
    <article className={cn(layout.statCard, ui.panel, "mp-tilt-card mp-blob-card")} {...tiltHandlers}>
      <strong className={cn(layout.statValue, ui.cyanText)}>{stat.prefix}{value}{stat.suffix}</strong>
      <span className={cn("font-bold", ui.mutedText)}>{stat.label}</span>
    </article>
  );
}
