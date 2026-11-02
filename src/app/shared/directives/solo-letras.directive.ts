import { Directive, HostListener } from '@angular/core';
import { FiltroEntradaBase } from './filtro-entrada.base';
import { formatearNombre, limpiarNombre } from '../utils/texto';

/** Solo letras (con tildes, ü, ñ) y espacios. Al salir del campo recorta y pone mayúscula inicial. */
@Directive({ selector: 'input[soloLetras]' })
export class SoloLetrasDirective extends FiltroEntradaBase {
  protected limpiar(valor: string): string {
    return limpiarNombre(valor);
  }

  @HostListener('blur')
  protected alSalir(): void {
    this.aplicar(formatearNombre(this.el.value));
  }
}
