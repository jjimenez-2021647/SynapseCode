import { cn, layout, ui } from "../../mainPageClasses";

export function SectionHeading({ eyebrow, title, children, align = "center" }) {
  return (
    <div className={cn(layout.heading, align === "left" && layout.headingLeft)}>
      <span className={cn(layout.headingEyebrow, ui.eyebrow)}>{eyebrow}</span>
      <h2 className={cn(layout.headingTitle, ui.heading)}>{title}</h2>
      {children && <p className={cn(layout.headingText, ui.mutedText)}>{children}</p>}
    </div>
  );
}
