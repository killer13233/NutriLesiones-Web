import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
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
  private readonly resumen = viewChild<ElementRef<HTMLDetailsElement>>('resumen');
  private resumenEstabaAbierto = false;

  protected readonly guiaRespaldo =
    'Cada tiempo de comida muestra los alimentos y cantidades correspondientes. Puedes cambiar un alimento por otra opción equivalente dentro del mismo grupo.';

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

  /** Al imprimir, el resumen del día debe salir abierto; después vuelve a como estaba. */
  @HostListener('window:beforeprint')
  protected antesDeImprimir(): void {
    const d = this.resumen()?.nativeElement;
    if (!d) return;
    this.resumenEstabaAbierto = d.open;
    d.open = true;
  }

  @HostListener('window:afterprint')
  protected despuesDeImprimir(): void {
    const d = this.resumen()?.nativeElement;
    if (d) d.open = this.resumenEstabaAbierto;
  }

  protected imprimir(): void {
    window.print();
  }
}