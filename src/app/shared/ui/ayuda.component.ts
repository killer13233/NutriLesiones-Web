import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { IconoComponent } from './icono.component';

let contador = 0;

/** Botón "?" con un texto de ayuda que aparece al pasar el mouse, enfocar o tocar. */
@Component({
  selector: 'app-ayuda',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="ayuda" [attr.aria-label]="'Ayuda: ' + titulo()"
            [attr.aria-describedby]="abierta() ? id : null" [attr.aria-expanded]="abierta()"
            (click)="alternar($event)" (mouseenter)="abierta.set(true)" (mouseleave)="abierta.set(false)"
            (focus)="abierta.set(true)" (blur)="abierta.set(false)" (keydown.escape)="abierta.set(false)">
      <app-icono nombre="ayuda" />
    </button>
    @if (abierta()) {
      <span class="globo" role="tooltip" [id]="id">{{ texto() }}</span>
    }
  `,
  styleUrl: './ayuda.component.scss',
})
export class AyudaComponent {
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
  protected readonly abierta = signal(false);
  protected readonly id = `ayuda-${++contador}`;

  protected alternar(e: Event): void {
    e.preventDefault();
    this.abierta.update((v) => !v);
  }
}
