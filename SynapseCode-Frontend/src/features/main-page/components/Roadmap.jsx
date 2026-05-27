import { useState } from "react";
import { roadmapSteps } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { SectionHeading } from "./ui/SectionHeading";

export function Roadmap() {
  const [activeStep, setActiveStep] = useState("1");
  const activeData = roadmapSteps.find((step) => step.number === activeStep) ?? roadmapSteps[0];

  return (
    <section id="roadmap" className={cn(layout.section, ui.band)}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="COMO FUNCIONA" title="De cero a colaborar en 6 pasos">
          Sin instalaciones. Solo un navegador y conexion a internet para empezar a programar con tu equipo.
        </SectionHeading>
        <div className={layout.roadmap}>
          <div className={layout.roadmapRail}>
            {roadmapSteps.map((step) => (
              <button key={step.number} type="button" className={cn(layout.roadmapButton, "mp-roadmap-step border border-border-light bg-slate-950/40 text-muted", step.number === activeStep && `is-active ${ui.pinkChip}`)} onClick={() => setActiveStep(step.number)}>
                <span className="mp-roadmap-sweep mp-roadmap-sweep-1" aria-hidden="true" />
                <span className="mp-roadmap-sweep mp-roadmap-sweep-2" aria-hidden="true" />
                <span className="mp-roadmap-sweep mp-roadmap-sweep-3" aria-hidden="true" />
                <span className={cn("mp-roadmap-number font-mono", ui.cyanText)}>{step.number}</span>
                <strong className="mp-roadmap-label">{step.title}</strong>
              </button>
            ))}
          </div>
          <article className={cn(layout.roadmapFocus, ui.panel)}>
            <span className={cn("mp-roadmap-focus-number font-mono", ui.cyanText)}>{activeData.number}</span>
            <h3 className={cn(layout.roadmapTitle, ui.heading)}>{activeData.title}</h3>
            <p className={cn("leading-[1.75]", ui.mutedText)}>{activeData.desc}</p>
            <small className={cn(layout.statusBadge, "font-extrabold", activeData.status === "done" ? `is-done bg-emerald-500/10 ${ui.success}` : `bg-slate-500/20 ${ui.mutedText}`)}>{activeData.status === "done" ? "Implementado" : "En desarrollo"}</small>
          </article>
          <div className={layout.roadmapCards}>
            {roadmapSteps.map((step) => (
              <article key={step.number} className={cn(layout.roadmapCard, ui.panel, "mp-tilt-card mp-glow-card")} {...tiltHandlers}>
                <span className={cn("mp-roadmap-card-number font-mono", ui.cyanText)}>{step.number}</span>
                <h3 className="my-2 text-base text-white">{step.title}</h3>
                <p className={cn("m-0 text-sm leading-[1.75]", ui.mutedText)}>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
