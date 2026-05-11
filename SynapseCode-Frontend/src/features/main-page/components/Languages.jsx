import { useMemo, useState } from "react";
import { languages } from "../data/mainPageData";
import { cn, layout, ui } from "../mainPageClasses";
import { SectionHeading } from "./ui/SectionHeading";

export function Languages() {
  const [activeType, setActiveType] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("popular");
  const types = useMemo(() => ["Todos", ...Array.from(new Set(languages.map((language) => language.type)))], []);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = languages.filter((language) => (activeType === "Todos" || language.type === activeType) && language.name.toLowerCase().includes(query));
    return sortMode === "az" ? [...matches].sort((a, b) => a.name.localeCompare(b.name)) : matches;
  }, [activeType, search, sortMode]);

  return (
    <section id="lenguajes" className={cn(layout.section, ui.band)}>
      <div className={layout.shell}>
        <SectionHeading eyebrow="LENGUAJES" title="30+ Lenguajes Soportados">
          Desde Python hasta Assembly, ejecuta cualquier lenguaje sin instalar nada.
        </SectionHeading>
        <div className={layout.toolsGrid}>
          <input className={cn(layout.input, ui.input)} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lenguaje..." />
          <div className={layout.filterGroup}>
            {types.map((type) => (
              <button key={type} type="button" className={cn(layout.filterControl, ui.filterButton, type === activeType && `is-active ${ui.cyanChip}`)} onClick={() => setActiveType(type)}>{type}</button>
            ))}
          </div>
          <button type="button" className={cn(layout.filterControl, ui.filterButton)} onClick={() => setSortMode((value) => value === "popular" ? "az" : "popular")}>{sortMode === "popular" ? "A-Z" : "Original"}</button>
        </div>
        <div className={layout.languageCloud}>
          {filtered.map((language, index) => (
            <span key={language.name} className={cn(layout.languageChip, "mp-pressable mp-language-chip border border-primary/20 bg-slate-950/50 text-white")} style={{ "--delay": `${index * 18}ms` }}>{language.name}<small className={cn("text-xs", ui.cyanText)}>{language.type}</small></span>
          ))}
        </div>
        {filtered.length === 0 && <p className={cn(layout.centerText, ui.softText)}>No encontramos ese lenguaje en la lista.</p>}
      </div>
    </section>
  );
}
