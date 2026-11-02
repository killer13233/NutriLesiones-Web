import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AlimentoMenu } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { PlanStore } from '../../core/services/plan.store';
import { IconoComponent } from '../../shared/ui/icono.component';
import { textoPeso, textoPorciones } from './formato';

let contador = 0;

@Component({
  selector: 'app-alimento-item',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alimento-item.component.html',
  styleUrl: './alimento-item.component.scss',
})
export class AlimentoItemComponent {
  private readonly api = inject(ApiService);
  protected readonly store = inject(PlanStore);

  readonly alimento = input.required<AlimentoMenu>();
  readonly comida = input.required<number>();
  readonly posicion = input.required<number>();

  protected readonly id = `intercambio-${++contador}`;
  protected readonly abierto = signal(false);
  protected readonly fotoFallida = signal(false);
  protected readonly miniaturasFallidas = signal<ReadonlySet<string>>(new Set());

  protected readonly foto = computed(() => {
    const a = this.alimento();
    return a.foto && !this.fotoFallida() ? this.api.fotoUrl(a.foto) : null;
  });
  protected readonly porciones = computed(() => textoPorciones(this.alimento().porciones));
  protected readonly peso = computed(() => textoPeso(this.alimento().pesoPorPorcionG));
  protected readonly intercambiado = computed(() => this.store.intercambiado(this.comida(), this.posicion()));

  protected urlMiniatura(ruta: string | null): string | null {
    return ruta ? this.api.fotoUrl(ruta) : null;
  }

  protected miniaturaFallo(id: string): void {
    this.miniaturasFallidas.update((s) => new Set(s).add(id));
  }

  protected elegir(id: string): void {
    this.store.intercambiar(this.comida(), this.posicion(), id);
    this.fotoFallida.set(false);
    this.abierto.set(false);
  }

  protected deshacer(): void {
    this.store.deshacer(this.comida(), this.posicion());
    this.fotoFallida.set(false);
  }
}
