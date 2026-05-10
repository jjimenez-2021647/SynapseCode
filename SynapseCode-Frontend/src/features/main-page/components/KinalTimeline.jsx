import { useState } from "react";
import { beforeAfterItems, impactTabs } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { SectionHeading } from "./ui/SectionHeading";

export function KinalTimeline() {
  const [activeTab, setActiveTab] = useState("comunidad");
  const selectedTab = impactTabs.find((tab) => tab.id === activeTab) ?? impactTabs[0];

  return (
    <section id="kinal" className={layout.section}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="EXPO KINAL 2026" title="Kinal en el Tiempo: antes y ahora">
          SynapseCode representa el salto que la institucion puede dar en la forma en que sus estudiantes aprenden a programar.
        </SectionHeading>
        <div className={layout.beforeAfter}>
          {beforeAfterItems.map((item, index) => (
            <article key={item.before} className={cn(layout.beforeAfterCard, ui.panel, "mp-tilt-card mp-glow-card")} {...tiltHandlers}>
              <span className={cn(layout.beforeAfterNumber, "font-mono", ui.iconTile)}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <small className={cn(layout.beforeAfterLabel, "font-mono uppercase", ui.softText)}>Antes</small>
                <p className={cn("leading-[1.75]", ui.mutedText)}>{item.before}</p>
              </div>
              <div className={layout.nowColumn}>
                <small className={cn(layout.beforeAfterLabel, "font-mono uppercase", ui.pinkText)}>Ahora</small>
                <p className="text-foreground leading-[1.75]">{item.after}</p>
              </div>
            </article>
          ))}
        </div>
        <div className={cn(layout.impact, ui.panel)}>
          <div className={layout.tabs} role="tablist" aria-label="Impacto">
            {impactTabs.map((tab) => (
              <button key={tab.id} type="button" className={cn(layout.filterControl, ui.filterButton, tab.id === activeTab && `is-active ${ui.cyanChip}`)} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className={layout.impactGrid}>
            {selectedTab.points.map((point) => (
              <article key={point.title} className={cn(layout.impactCard, ui.darkPanel, "mp-tilt-card mp-blob-card")} {...tiltHandlers}>
                <h3 className="mb-2 text-base text-white">{point.title}</h3>
                <p className={cn("leading-[1.75]", ui.mutedText)}>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
