import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NOMBRE_MAX, pesoANumero } from '../utils/texto';

export const LIMITES = {
  edad: { min: 12, max: 19 },
  peso: { min: 25, max: 150 },
  altura: { min: 100, max: 230 },
} as const;

const SOLO_LETRAS = /^[A-Za-záéíóúüñÁÉÍÓÚÜÑ ]+$/;

/** Nombre completo: solo letras y espacios, mínimo 2 palabras de 2+ letras, máx. 60, sin espacios dobles. */
export function nombreCompleto(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '');
    if (v.trim() === '') return null; // "required" se encarga del vacío
    if (!SOLO_LETRAS.test(v)) return { caracteres: true };
    if (v.length > NOMBRE_MAX) return { largo: { max: NOMBRE_MAX } };
    if (/ {2,}/.test(v)) return { espaciosDobles: true };
    const palabras = v.trim().split(' ').filter(Boolean);
    if (palabras.length < 2 || palabras.some((p) => p.length < 2)) return { palabras: true };
    return null;
  };
}

/** Entero dentro de un rango. El valor llega como texto (solo dígitos). */
export function enteroEnRango(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '').trim();
    if (v === '') return null;
    if (!/^\d+$/.test(v)) return { entero: true };
    const n = Number(v);
    return n < min || n > max ? { rango: { min, max } } : null;
  };
}

/** Peso en kg: positivo, 1 decimal como máximo (coma o punto), dentro del rango del backend. */
export function pesoEnRango(min: number = LIMITES.peso.min, max: number = LIMITES.peso.max): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '').trim();
    if (v === '') return null;
    const n = pesoANumero(v);
    if (n === null) return { formatoPeso: true };
    return n < min || n > max ? { rango: { min, max } } : null;
  };
}