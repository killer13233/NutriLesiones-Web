// Funciones puras de limpieza de texto. Las usan las directivas y los validadores,
// así la misma regla se prueba una sola vez.

const NO_LETRA = /[^A-Za-záéíóúüñÁÉÍÓÚÜÑ ]/g;
const LETRA = /[A-Za-záéíóúüñÁÉÍÓÚÜÑ]/;

export const NOMBRE_MAX = 60;

/** Deja solo letras y espacios; sin espacio al inicio ni espacios dobles. */
export function limpiarNombre(valor: string, max = NOMBRE_MAX): string {
  return valor
    .replace(NO_LETRA, '')
    .replace(/^ +/, '')
    .replace(/ {2,}/g, ' ')
    .slice(0, max);
}

/** Recorta y pone mayúscula inicial a cada palabra ("juan  pérez" -> "Juan Pérez"). */
export function formatearNombre(valor: string): string {
  return limpiarNombre(valor)
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toLocaleUpperCase('es') + p.slice(1).toLocaleLowerCase('es'))
    .join(' ');
}

/** Solo dígitos, con largo máximo. */
export function limpiarEntero(valor: string, maxDigitos: number): string {
  return valor.replace(/\D/g, '').slice(0, maxDigitos);
}

/**
 * Peso: dígitos y un solo separador decimal (coma o punto), máximo 1 decimal y 3 enteros.
 * "7a" -> "7"; "65,55" -> "65,5"; "6.5.2" -> "6.5".
 */
export function limpiarPeso(valor: string): string {
  let resultado = '';
  let separador = false;
  let decimales = 0;
  let enteros = 0;
  for (const c of valor) {
    if (c >= '0' && c <= '9') {
      if (separador) {
        if (decimales >= 1) continue;
        decimales++;
      } else {
        if (enteros >= 3) continue;
        enteros++;
      }
      resultado += c;
    } else if ((c === ',' || c === '.') && !separador && enteros > 0) {
      separador = true;
      resultado += c;
    }
  }
  return resultado;
}

/** Convierte "65,5" o "65.5" en 65.5. Devuelve null si no es un número válido. */
export function pesoANumero(valor: string | null | undefined): number | null {
  if (valor == null) return null;
  const t = valor.trim().replace(',', '.');
  if (!/^\d+(\.\d)?$/.test(t)) return null;
  return Number(t);
}

export function esLetra(c: string): boolean {
  return LETRA.test(c);
}
