import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NombreIcono =
  | 'hoja' | 'ayuda' | 'abajo' | 'deshacer' | 'izquierda' | 'derecha' | 'imprimir'
  | 'actualizar' | 'cerrar' | 'aviso' | 'ok' | 'reloj' | 'intercambio' | 'basura';

const TRAZOS: Record<NombreIcono, string> = {
  hoja: 'M5 19C5 11 10 5 20 4c0 10-6 15-14 15M5 19c2-4 5-7 9-9',
  ayuda: 'M9.5 9.2a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.2 1-1.2 1.9M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  abajo: 'M6 9l6 6 6-6',
  deshacer: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  izquierda: 'M15 6l-6 6 6 6',
  derecha: 'M9 6l6 6-6 6',
  imprimir: 'M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z',
  actualizar: 'M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4',
  cerrar: 'M6 6l12 12M18 6L6 18',
  aviso: 'M12 4l9 16H3L12 4zM12 10v4M12 17h.01',
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  intercambio: 'M4 8h14l-3-3M20 16H6l3 3',
  basura: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
};

/** Íconos SVG en línea, de trazo fino. Heredan el color del texto. */
@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path [attr.d]="trazo()" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; width: var(--icono, 1.15em); height: var(--icono, 1.15em); flex: none; }
    svg { width: 100%; height: 100%; }
  `,
})
export class IconoComponent {
  readonly nombre = input.required<NombreIcono>();
  protected readonly trazo = computed(() => TRAZOS[this.nombre()]);
}
