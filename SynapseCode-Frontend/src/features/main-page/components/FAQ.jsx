import { useMemo, useState } from "react";
import { faqs } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { Icon } from "./ui/Icon";
import { SectionHeading } from "./ui/SectionHeading";

export function FAQ() {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? faqs.filter(({ q, a }) => `${q} ${a}`.toLowerCase().includes(query)) : faqs;
  }, [search]);

  return (
    <section className={layout.section}>
      <div className={cn(layout.shell, layout.faqShell)}>
        <SectionHeading eyebrow="FAQ" title="Preguntas Frecuentes">
          Respuestas a las dudas mas comunes sobre SynapseCode.
        </SectionHeading>
        <div className={layout.faqTools}>
          <input className={cn(layout.input, ui.input)} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setOpen(null); }} placeholder="Buscar pregunta..." />
          <button type="button" className={cn(layout.filterControl, ui.filterButton)} onClick={() => setOpen((value) => value === "all" ? null : "all")}>{open === "all" ? "Cerrar todo" : "Expandir todo"}</button>
        </div>
        <div className={layout.faqList}>
          {filtered.map(({ q, a }, index) => {
            const isOpen = open === "all" || open === index;
            return (
              <article key={q} className={cn(layout.faqCard, ui.panel, "mp-faq-card", isOpen ? "is-open border-primary/40" : "")}>
                <button type="button" className={cn(layout.faqButton, "mp-faq-button text-white font-extrabold")} onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen}>
                  <span className="mp-faq-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mp-faq-question">{q}</span>
                  <span className="mp-faq-icon"><Icon name="chevron" size={17} /></span>
                </button>
                <div className="mp-faq-answer-wrap">
                  <p className={cn(layout.faqAnswer, "leading-[1.75]", ui.mutedText)}>{a}</p>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && <p className={cn(layout.centerText, ui.softText)}>No encontramos una pregunta con ese texto.</p>}
      </div>
    </section>
  );
}
