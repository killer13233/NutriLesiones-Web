import { Directive, input } from '@angular/core';
import { FiltroEntradaBase } from './filtro-entrada.base';
import { limpiarEntero } from '../utils/texto';

/** Solo dígitos (bloquea letras, "e", "+", "-" y "."), con un máximo de dígitos. */
@Directive({ selector: 'input[soloDigitos]' })
export class SoloDigitosDirective extends FiltroEntradaBase {
  readonly maxDigitos = input<number>(3);

  protected limpiar(valor: string): string {
    return limpiarEntero(valor, this.maxDigitos());
  }
}
