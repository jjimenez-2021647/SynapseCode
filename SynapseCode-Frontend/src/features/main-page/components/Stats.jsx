import { useRef, useEffect, useState } from "react";
import { landingStats } from "../data/mainPageData";
import { useCountUp } from "../hooks/useCountUp";
import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { SectionHeading } from "./ui/SectionHeading";

export function Stats() {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className={cn(layout.section, layout.statsSection)} ref={containerRef}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="NUMEROS" title="Plataforma en cifras" />
        <div className={layout.statsGrid}>
          {landingStats.map((stat) => <StatCard key={stat.label} stat={stat} isVisible={isVisible} />)}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, isVisible }) {
  const value = useCountUp(stat.value, 1400, isVisible);
  return (
    <article className={cn(layout.statCard, ui.panel, "mp-tilt-card mp-blob-card")} {...tiltHandlers}>
      <strong className={cn(layout.statValue, ui.cyanText)}>{stat.prefix}{value}{stat.suffix}</strong>
      <span className={cn("font-bold", ui.mutedText)}>{stat.label}</span>
    </article>
  );
}
