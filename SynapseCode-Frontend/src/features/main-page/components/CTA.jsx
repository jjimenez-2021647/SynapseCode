import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { Icon } from "./ui/Icon";

export function CTA() {
  return (
    <section className={cn(layout.section, layout.ctaSection)}>
      <div className={layout.shell}>
        <div className={cn(layout.cta, ui.panel, "mp-tilt-card")} {...tiltHandlers}>
          <span className={cn(layout.headingEyebrow, ui.eyebrow)}>EMPIEZA HOY</span>
          <h2 className={cn(layout.headingTitle, ui.heading)}>Listo para empezar a programar colaborativamente?</h2>
          <p className={cn(layout.headingText, ui.mutedText)}>Ãšnete a miles de desarrolladores que ya estÃ¡n usando SynapseCode para programar, aprender y colaborar.</p>
          <div className={layout.ctaActions}>
            <a href="/register" className={cn(layout.button, layout.buttonLarge, ui.buttonBase, ui.buttonPrimary)}>Crear Cuenta Gratis <Icon name="arrow" size={18} /></a>
            <a href="#features" className={cn(layout.button, layout.buttonLarge, ui.buttonBase, ui.buttonGhost)}>Ver Features</a>
          </div>
        </div>
      </div>
    </section>
  );
}
