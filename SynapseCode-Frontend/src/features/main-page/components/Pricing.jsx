import { pricingPlans } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { Icon } from "./ui/Icon";
import { SectionHeading } from "./ui/SectionHeading";

export function Pricing() {
  return (
    <section id="precios" className={layout.section}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="PLANES" title="Empieza gratis, escala cuando quieras">
          Sin compromisos. El plan gratuito no tiene fecha de vencimiento.
        </SectionHeading>
        <div className={layout.pricing}>
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={cn(layout.priceCard, ui.panel, "mp-tilt-card mp-pricing-card", plan.popular ? "is-popular border-accent/50 bg-[linear-gradient(145deg,rgba(255,0,255,0.1),rgba(15,23,42,0.76))]" : "")} {...tiltHandlers}>
              <div className={layout.planHead}>
                <h3 className={cn(layout.planTitle, "text-white")}>{plan.name}</h3>
                {plan.popular && <span className={cn(layout.planBadge, "font-extrabold", ui.pinkChip)}>Popular</span>}
              </div>
              <p className={layout.price}><strong className={cn(layout.priceValue, "text-white")}>{plan.price}</strong><span className={ui.softText}>/{plan.description}</span></p>
              <p className={cn("leading-[1.75]", ui.mutedText)}>Acceso abierto para estudiantes, docentes y equipos.</p>
              <ul className={layout.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature.text} className={cn(layout.featureItem, feature.included ? "text-slate-200" : `is-muted ${ui.softText}`, feature.included ? "[&>svg]:text-emerald-400" : "[&>svg]:text-muted-foreground")}>
                    <Icon name={feature.included ? "check" : "x"} size={16} />{feature.text}
                  </li>
                ))}
              </ul>
              <a href="/register" className={cn(layout.button, ui.buttonBase, plan.popular ? ui.buttonPrimary : ui.buttonGhost)}>{plan.buttonText}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
