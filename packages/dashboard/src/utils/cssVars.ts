import type { CSSProperties } from 'react';

/**
 * Creates a CSS custom property style object for a single variable.
 * Use with Tailwind arbitrary values: className="w-[var(--name)]"
 *
 * @example
 * <div style={cssVar('progress', '75%')} className="w-[var(--progress)]" />
 */
export function cssVar(name: string, value: string | number): CSSProperties {
  return { [`--${name}`]: value } as CSSProperties;
}

/**
 * Creates a CSS custom property style object for multiple variables.
 * Use with Tailwind arbitrary values.
 *
 * @example
 * <div
 *   style={cssVars({ width: '50%', color: '#3b82f6' })}
 *   className="w-[var(--width)] text-[var(--color)]"
 * />
 */
export function cssVars(vars: Record<string, string | number>): CSSProperties {
  const result: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(vars)) {
    result[`--${name}`] = value;
  }
  return result as CSSProperties;
}
