import { useState } from "react";
import { services } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { Icon } from "./ui/Icon";
import { SectionHeading } from "./ui/SectionHeading";

export function Services() {
  const [active, setActive] = useState(0);
  const iconNames = ["shield", "users", "layers", "play", "message", "git", "star", "check"];

  return (
    <section id="features" className={cn(layout.section, ui.band)}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="FEATURES" title="Servicios conectados en una sola plataforma">
          Explora como SynapseCode conecta autenticacion, colaboracion, ejecucion, IA y versionado.
        </SectionHeading>
        <div className={layout.servicesLayout}>
          <div className={cn(layout.serviceFocus, ui.panel)}>
            <span className={cn(layout.serviceIcon, ui.serviceIcon)}><Icon name={iconNames[active]} size={26} /></span>
            <small className={cn("font-mono uppercase", ui.pinkText)}>Servicio activo Â· {String(active + 1).padStart(2, "0")}</small>
            <h3 className={cn(layout.serviceTitle, ui.heading)}>{services[active].title}</h3>
            <p className={cn("leading-[1.75]", ui.mutedText)}>{services[active].desc}</p>
          </div>
          <div className={layout.serviceList}>
            {services.map((service, index) => (
              <button key={service.title} type="button" className={cn(layout.serviceButton, ui.panel, "mp-tilt-card mp-glow-card", active === index && `is-active ${ui.pinkChip}`)} onClick={() => setActive(index)} {...tiltHandlers}>
                <span className={cn(layout.iconTile, ui.iconTile)}><Icon name={iconNames[index]} size={18} /></span>
                <strong className="text-white">{service.title}</strong>
                <p className={cn("m-0 text-sm leading-[1.75]", ui.mutedText)}>{service.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
