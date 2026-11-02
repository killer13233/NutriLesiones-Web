import { Directive } from '@angular/core';
import { FiltroEntradaBase } from './filtro-entrada.base';
import { limpiarPeso } from '../utils/texto';

/** Solo dígitos y un separador decimal (coma o punto), con un máximo de 1 decimal. */
@Directive({ selector: 'input[soloPeso]' })
export class SoloPesoDirective extends FiltroEntradaBase {
  protected limpiar(valor: string): string {
    return limpiarPeso(valor);
  }
}
