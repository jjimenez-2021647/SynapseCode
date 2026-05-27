import { useEffect, useMemo, useState } from "react";
import { CTA } from "../CTA";
import { Comparison } from "../Comparison";
import { FAQ } from "../FAQ";
import { Hero } from "../Hero";
import { KinalTimeline } from "../KinalTimeline";
import { Languages } from "../Languages";
import { Pricing } from "../Pricing";
import { Roadmap } from "../Roadmap";
import { Services } from "../Services";
import { Stats } from "../Stats";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { navLinks } from "../../data/mainPageData";
import { useActiveSection } from "../../hooks/useActiveSection";
import { cn, layout, ui } from "../../mainPageClasses";
import "../../../../styles/main-page.css";

function Navbar({ activeSection }) {
  const [open, setOpen] = useState(false);

  return (
    <header className={cn(layout.nav, ui.navbar)}>
      <a href="#" className={layout.navLogo}><Logo /></a>
      <nav className={layout.navLinks} aria-label="Navegacion principal">
        {navLinks.map((link) => (
          <a key={link.id} href={link.href} className={cn(layout.navLink, ui.navLink, activeSection === link.id && `is-active ${ui.navLinkActive}`)}>{link.label}</a>
        ))}
      </nav>
      <div className={layout.navActions}>
        <a href="/auth" className={cn(layout.button, ui.buttonBase, ui.buttonGhost)}><Icon name="login" size={16} />Iniciar Sesion</a>
        <a href="/register" className={cn(layout.button, ui.buttonBase, ui.buttonPrimary)}><Icon name="plus" size={16} />Registrarse</a>
      </div>
      <button className={cn(layout.menuButton, "border border-border-light bg-slate-900/70 text-white")} type="button" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu">
        <Icon name="menu" size={22} />
      </button>
      {open && (
        <div className={cn(layout.mobileMenu, ui.panel)}>
          {navLinks.map((link) => (
            <a key={link.id} href={link.href} className={cn(layout.mobileMenuLink, "text-muted hover:bg-primary/10 hover:text-white")} onClick={() => setOpen(false)}>{link.label}</a>
          ))}
          <a href="/auth" className={cn(layout.mobileMenuLink, "text-muted hover:bg-primary/10 hover:text-white")}>Iniciar Sesion</a>
          <a href="/register" className={cn(layout.mobileMenuLink, "text-muted hover:bg-primary/10 hover:text-white")}>Registrarse</a>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const groups = [
    { title: "Producto", items: [["Features", "#features"], ["Lenguajes", "#lenguajes"], ["Gratis", "#precios"], ["Roadmap", "#roadmap"]] },
    { title: "Recursos", items: [["Documentacion", "/docs"], ["API", "/api"], ["Blog", "/blog"], ["Tutoriales", "/tutorials"]] },
    { title: "Legal", items: [["Terminos", "/terms"], ["Privacidad", "/privacy"], ["Cookies", "/cookies"]] },
  ];
  const socialLinks = [
    { label: "GitHub", icon: "github", href: "https://github.com", tone: "github" },
    { label: "Facebook", icon: "facebook", href: "https://facebook.com", tone: "facebook" },
    { label: "Twitter", icon: "twitter", href: "https://twitter.com", tone: "twitter" },
    { label: "Instagram", icon: "instagram", href: "https://instagram.com", tone: "instagram" },
    { label: "LinkedIn", icon: "linkedin", href: "https://linkedin.com", tone: "linkedin" },
    { label: "YouTube", icon: "youtube", href: "https://youtube.com", tone: "youtube" },
  ];

  return (
    <footer className={cn(layout.footer, ui.footer)}>
      <div className={cn(layout.shell, layout.footerGrid)}>
        <div>
          <Logo />
          <p className={cn("leading-[1.75]", ui.mutedText)}>Plataforma colaborativa inteligente para programar, ejecutar y aprender codigo en tiempo real.</p>
          <div className={layout.socials}>
            {socialLinks.map((item) => (
              <a key={item.label} className={cn(layout.socialLink, "mp-social-link border border-border-light bg-slate-900/70 text-muted")} data-social={item.tone} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                <span className="mp-social-tooltip">{item.label}</span>
                <Icon name={item.icon} size={19} />
              </a>
            ))}
          </div>
        </div>
        {groups.map((group) => (
          <nav key={group.title} className={layout.footerNav}>
            <h3 className={cn(layout.footerTitle, "text-white")}>{group.title}</h3>
            {group.items.map(([label, href]) => <a key={label} className="text-muted hover:text-primary" href={href}>{label}</a>)}
          </nav>
        ))}
      </div>
      <div className={layout.techList}>
        {["Next.js", "Zustand", "MongoDB", "Judge0", "Socket.io", "Groq AI"].map((tech) => <span key={tech} className={cn(layout.techChip, "border border-border-light bg-slate-900/70 text-muted")}>{tech}</span>)}
      </div>
      <p className={cn(layout.centerText, ui.softText)}>&copy; 2026 SynapseCode. Todos los derechos reservados.</p>
    </footer>
  );
}

export function MainPage() {
  const sectionIds = useMemo(() => ["features", "kinal", "lenguajes", "precios", "comparativa", "roadmap"], []);
  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    const root = document.documentElement;
    const update = (event) => {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", update, { passive: true });
    return () => window.removeEventListener("pointermove", update);
  }, []);

  return (
    <div className={cn(layout.page, ui.page)}>
      <Navbar activeSection={activeSection} />
      <main>
        <Hero />
        <Services />
        <KinalTimeline />
        <Languages />
        <Pricing />
        <Comparison />
        <Stats />
        <Roadmap />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default MainPage;
