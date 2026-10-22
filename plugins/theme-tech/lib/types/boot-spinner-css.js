/**
 * Boot-page spinner correction shared by both halves.
 *
 * The official spinner pairs `corner-shape: round` with its 50% radius on the
 * element, but the `::after` arc that paints the ring only inherits the radius
 * — the theme's universal `*::after { corner-shape: superellipse(1.5) }` then
 * deforms that circle into a squircle. At 20px the ring also cuts both arc ends
 * along a radius, so at 1x each end lands as a 2px square block and the whole
 * ring reads as a bracketed square. Restore the circular curve and cap the arc
 * ends with 1px round heads, keeping the official 2px stroke width (softening
 * the mask instead thins the ring and loses its weight).
 *
 * The extra `[data-dsh-boot]` ancestor keeps these declarations above the
 * plugin-injected theme sheet; the ring stays round regardless of injection
 * order. Round caps need CSS trigonometry and degrade to the official arc
 * elsewhere, where only the corner-shape pairing applies.
 *
 * The node half injects this into the served index head, so a fresh page is
 * correct from the first paint. The client half re-injects it once the bundle
 * activates, so a page served by an older node half still corrects itself.
 */
export const BOOT_SPINNER_CSS = `[data-dsh-boot] [data-dsh-boot-spinner],
[data-dsh-boot] [data-dsh-boot-spinner]::after {
  corner-shape: round;
}
@supports (width: calc(1px * sin(1deg))) {
  [data-dsh-boot] [data-dsh-boot-spinner]::after {
    background:
      radial-gradient(circle at 50% calc(50% - 11px), var(--dsw-alias-brand-primary, var(--dsh-boot-brand, #1f6feb)) 0 1px, transparent 1.2px),
      radial-gradient(circle at calc(50% + 11px * sin(var(--dsh-boot-arc, 72deg))) calc(50% - 11px * cos(var(--dsh-boot-arc, 72deg))), var(--dsw-alias-brand-primary, var(--dsh-boot-brand, #1f6feb)) 0 1px, transparent 1.2px),
      conic-gradient(var(--dsw-alias-brand-primary, var(--dsh-boot-brand, #1f6feb)) var(--dsh-boot-arc, 72deg), transparent 0);
  }
}`;
//# sourceMappingURL=boot-spinner-css.js.map