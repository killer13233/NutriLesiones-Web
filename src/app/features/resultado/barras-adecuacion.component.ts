import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Adecuacion, Macros, Requerimientos } from '../../core/models/api.models';
import { AyudaComponent } from '../../shared/ui/ayuda.component';

interface Barra {
  clave: string;
  nombre: string;
  tooltip: string | null;
  unidad: string;
  obtenido: number;
  requerido: number;
  pct: number;
  enRango: boolean;
  posicion: number;
}

const ESCALA_MAX = 130; // la barra llega hasta 130 % para que se vea la zona 90-110 %

@Component({
  selector: 'app-barras-adecuacion',
  imports: [DecimalPipe, AyudaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barras-adecuacion.component.html',
  styleUrl: './barras-adecuacion.component.scss',
})
export class BarrasAdecuacionComponent {
  readonly adecuacion = input.required<Adecuacion>();
  readonly requerimientos = input.required<Requerimientos>();
  readonly total = input.required<Macros>();

  protected readonly zonaInicio = (90 / ESCALA_MAX) * 100;
  protected readonly zonaAncho = ((110 - 90) / ESCALA_MAX) * 100;

  protected readonly barras = computed<Barra[]>(() => {
    const a = this.adecuacion();
    const r = this.requerimientos();
    const t = this.total();
    const fila = (clave: string, nombre: string, tooltip: string | null, unidad: string, obtenido: number, requerido: number, pct: number): Barra => ({
      clave, nombre, tooltip, unidad, obtenido, requerido, pct,
      enRango: pct >= 90 && pct <= 110,
      posicion: Math.min(Math.max(pct, 0), ESCALA_MAX) / ESCALA_MAX * 100,
    });
    return [
      fila('cho', 'Carbohidratos', 'También se escribe CHO.', 'g', t.cho, r.carbohidratos, a.carbohidratos),
      fila('prot', 'Proteína', null, 'g', t.proteina, r.proteina, a.proteina),
      fila('grasa', 'Grasa', null, 'g', t.grasa, r.grasa, a.grasa),
      fila('kcal', 'Calorías', null, 'kcal', t.kcal, r.kcal, a.kcal),
    ];
  });
}
