import { useEffect, useState } from "react";

export function useActiveSection(ids) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const updateActiveSection = () => {
      if (window.scrollY < window.innerHeight * 0.55) {
        setActive("");
        return;
      }

      const anchor = window.scrollY + window.innerHeight * 0.38;
      const current = ids.reduce((selected, id) => {
        const element = document.getElementById(id);
        if (!element || element.offsetTop > anchor) return selected;
        return id;
      }, "");

      setActive(current);
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [ids]);

  return active;
}
