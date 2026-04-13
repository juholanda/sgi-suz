/**
 * Converts a camelCase key to a CSS custom property name.
 * e.g. "cardForeground" → "--card-foreground"
 */
export function tokenKeyToCssVar(key: string): string {
  const kebab = key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
  return `--${kebab}`;
}

/**
 * Converts a sidebar token key to a sidebar-prefixed CSS custom property.
 * e.g. "primary" → "--sidebar-primary"
 */
export function sidebarKeyToCssVar(key: string): string {
  const kebab = key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
  return `--sidebar-${kebab}`;
}

/**
 * Converts a hex color string to space-separated RGB channel values.
 * e.g. "#0038A8" → "0 56 168"
 * This format is useful for CSS custom properties used with rgba().
 */
export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}
