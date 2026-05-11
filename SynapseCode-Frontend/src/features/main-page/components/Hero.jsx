import { cn, layout, ui } from "../mainPageClasses";
import { tiltHandlers } from "../utils/tiltHandlers";
import { Icon } from "./ui/Icon";

export function Hero() {
  return (
    <section className={cn(layout.section, layout.hero)}>
      <div className="mp-hero-bg" aria-hidden="true">
        <span className="mp-hero-orb mp-hero-orb-cyan" />
        <span className="mp-hero-orb mp-hero-orb-pink" />
        <span className="mp-hero-scan" />
        <span className="mp-hero-circuit" />
      </div>
      <div className={cn(layout.shell, layout.heroGrid)}>
        <div className={layout.heroCopy}>
          <span className={cn(layout.liveBadge, ui.badge)}>Plataforma en vivo para · Expo Kinal 2026</span>
          <h1 className={cn(layout.heroTitle, "font-extrabold")}><span className={cn("block", ui.cyanText)}>Synapse</span><strong className={cn("block", ui.pinkText)}>Code</strong></h1>
          <p className={cn(layout.heroText, ui.mutedText)}>Plataforma colaborativa inteligente para programar, ejecutar y aprender codigo en tiempo real.</p>
          <div className={cn(layout.flexWrapGap, layout.heroCenterMobile)}>
            <span className={cn(layout.pill, ui.chip)}><Icon name="users" size={16} />Colaboracion en tiempo real</span>
            <span className={cn(layout.pill, ui.chip)}><Icon name="play" size={16} />Ejecucion instantanea</span>
            <span className={cn(layout.pill, ui.chip)}><Icon name="code" size={16} />30+ lenguajes</span>
          </div>
          <div className={cn(layout.flexWrapGap, layout.heroCenterMobile)}>
            <a href="/register" className={cn(layout.button, layout.buttonLarge, ui.buttonBase, ui.buttonPrimary)}>Empieza Gratis <Icon name="arrow" size={17} /></a>
            <a href="#features" className={cn(layout.button, layout.buttonLarge, ui.buttonBase, ui.buttonGhost)}>Ver Features</a>
          </div>
        </div>
        <div className={cn(layout.workspace, "mp-tilt-card mp-workspace-card border border-primary/20 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.82)),radial-gradient(circle_at_15%_0%,rgba(0,217,255,0.16),transparent_20rem)] shadow-[0_34px_90px_rgba(0,0,0,0.35)]")} aria-label="Vista previa de workspace" {...tiltHandlers}>
          <div className={cn(layout.windowBar, "border-b border-border-light/60")}>
            <span className={cn(layout.windowDot, "bg-rose-400")} />
            <span className={cn(layout.windowDot, "bg-yellow-400")} />
            <span className={cn(layout.windowDot, "bg-emerald-400")} />
            <strong className={cn("font-mono", ui.cyanText)}>room-kinal-65</strong>
          </div>
          <div className={layout.editorPreview}>
            <div className={cn(layout.codeLines, "bg-slate-950 font-mono")}>
              <span className="text-slate-700">01</span><code className="text-violet-300">const room = await sync("kinal-65");</code>
              <span className="text-slate-700">02</span><code className="text-violet-300">runTests(files).then(shareOutput);</code>
              <span className="text-slate-700">03</span><code className="text-violet-300">ai.explain(error).sendToChat();</code>
              <span className="text-slate-700">04</span><code className="text-violet-300">git.commit("avance colaborativo");</code>
            </div>
            <aside className={cn(layout.previewAside, "border border-primary/20 bg-primary/10")}>
              <b className={ui.cyanText}>Live</b>
              <p className={ui.mutedText}>3 estudiantes editando</p>
              <p className={ui.mutedText}>Socket sync: 18 ms</p>
              <p className={ui.mutedText}>Tests: 8 passed</p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
