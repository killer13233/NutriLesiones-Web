import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { PlanStore } from '../../core/services/plan.store';
import { AyudaComponent } from '../../shared/ui/ayuda.component';
import { IconoComponent } from '../../shared/ui/icono.component';
import { AlimentoItemComponent } from './alimento-item.component';
import { BarrasAdecuacionComponent } from './barras-adecuacion.component';

@Component({
  selector: 'app-resultado',
  imports: [DecimalPipe, AlimentoItemComponent, BarrasAdecuacionComponent, AyudaComponent, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resultado.component.html',
  styleUrl: './resultado.component.scss',
})
export class ResultadoComponent {
  protected readonly store = inject(PlanStore);
  private readonly encabezado = viewChild<ElementRef<HTMLElement>>('encabezado');

  protected readonly menu = this.store.menu;
  protected readonly posicionTexto = computed(() => `${this.store.indice() + 1} de ${this.store.historial().length}`);
  protected readonly anuncio = signal('');
  protected readonly cantidadCambios = computed(() => this.menu()?.cambios.length ?? 0);

  constructor() {
    // El foco pasa al encabezado solo cuando cambia el NÚMERO de menú (generar o navegar),
    // no cuando se hace un intercambio dentro del mismo menú.
    const numero = computed(() => this.menu()?.numero ?? null);
    effect(() => {
      if (numero() === null) return;
      untracked(() => {
        const m = this.menu();
        if (m) this.anuncio.set(`Menú ${m.numero} listo para ${m.paciente.nombre}.`);
      });
      queueMicrotask(() => this.encabezado()?.nativeElement.focus());
    });
  }

  protected imprimir(): void {
    window.print();
  }
}