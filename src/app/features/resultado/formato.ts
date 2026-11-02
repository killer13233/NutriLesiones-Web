/** Ayudas de formato para mostrar cantidades en español. */
export function textoPorciones(n: number): string {
  const num = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 }).format(n);
  return `${num} ${n === 1 ? 'porción' : 'porciones'}`;
}

/** El peso llega como texto: "240" o "crudo: 60 / cocido: 55". */
export function textoPeso(v: string): string {
  return `${v} g`;
}
