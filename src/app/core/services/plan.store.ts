import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Alternativa, AlimentoMenu, Paciente, PlanResponse } from '../models/api.models';
import { ApiService, ErrorAmigable, traducirError } from './api.service';

export const MAX_HISTORIAL = 5;

interface Cambio { comida: number; alimento: number; previo: AlimentoMenu; }

export interface MenuGuardado {
  numero: number;
  paciente: Paciente;
  plan: PlanResponse;
  cambios: Cambio[];
}

/**
 * Estado de la pantalla: menús generados (últimos 5), petición en curso, errores e intercambios.
 * Todo vive en memoria; no se guarda nada en localStorage ni sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class PlanStore {
  private readonly api = inject(ApiService);

  /** Datos del paciente del último envío; permiten "Generar otro menú" sin reescribir nada. */
  readonly paciente = signal<Paciente | null>(null);
  readonly historial = signal<MenuGuardado[]>([]);
  readonly indice = signal(-1);
  readonly cargando = signal(false);
  readonly lento = signal(false);
  readonly error = signal<ErrorAmigable | null>(null);
  readonly cancelado = signal(false);

  readonly menu = computed(() => this.historial()[this.indice()] ?? null);
  readonly hayAnterior = computed(() => this.indice() > 0);
  readonly haySiguiente = computed(() => this.indice() < this.historial().length - 1);
  readonly hayCambios = computed(() => (this.menu()?.cambios.length ?? 0) > 0);

  private contador = 0;
  private sub?: Subscription;
  private aviso?: ReturnType<typeof setTimeout>;
  private ultimo: Paciente | null = null;

  /** Genera un menú nuevo. Sin "semilla": cada llamada devuelve un menú distinto. */
  generar(paciente: Paciente): void {
    if (this.cargando()) return; // evita doble envío
    this.ultimo = paciente;
    this.paciente.set(paciente);
    this.error.set(null);
    this.cancelado.set(false);
    this.cargando.set(true);
    this.lento.set(false);
    this.aviso = setTimeout(() => this.lento.set(true), 8000);

    this.sub = this.api
      .plan({ peso: paciente.peso, fase: paciente.fase, ...(paciente.leccion ? { leccion: paciente.leccion } : {}) })
      .subscribe({
        next: (plan) => {
          this.terminarCarga();
          this.agregar(paciente, plan);
        },
        error: (e) => {
          this.terminarCarga();
          this.error.set(traducirError(e));
        },
      });
  }

  /** "Generar otro menú": reutiliza los datos ya escritos. */
  generarOtro(): void {
    if (this.ultimo) this.generar(this.ultimo);
  }

  reintentar(): void {
    this.generarOtro();
  }

  cancelar(): void {
    if (!this.cargando()) return;
    this.sub?.unsubscribe();
    this.terminarCarga();
    this.cancelado.set(true);
  }

  descartarError(): void {
    this.error.set(null);
    this.cancelado.set(false);
  }

  anterior(): void {
    if (this.hayAnterior()) this.indice.update((i) => i - 1);
  }

  siguiente(): void {
    if (this.haySiguiente()) this.indice.update((i) => i + 1);
  }

  // ---- Intercambios --------------------------------------------------------------

  /** Reemplaza un alimento por una de sus alternativas conservando las porciones. */
  intercambiar(comida: number, alimento: number, alternativaId: string): void {
    this.modificarMenu((m) => {
      const actual = m.plan.comidas[comida]?.alimentos[alimento];
      const alt = actual?.alternativas.find((a) => a.id === alternativaId);
      if (!actual || !alt) return m;
      const comoAlternativa: Alternativa = {
        id: actual.id,
        nombre: actual.nombre,
        medidaPorPorcion: actual.medidaPorPorcion,
        pesoPorPorcionG: actual.pesoPorPorcionG,
        foto: actual.foto,
        fotoReferencia: actual.fotoReferencia,
      };
      const nuevo: AlimentoMenu = {
        ...actual,
        id: alt.id,
        nombre: alt.nombre,
        medidaPorPorcion: alt.medidaPorPorcion,
        pesoPorPorcionG: alt.pesoPorPorcionG,
        foto: alt.foto,
        fotoReferencia: alt.fotoReferencia,
        nota: null,
        alternativas: [comoAlternativa, ...actual.alternativas.filter((a) => a.id !== alt.id)],
      };
      return {
        ...this.conAlimento(m, comida, alimento, nuevo),
        cambios: [...m.cambios, { comida, alimento, previo: actual }],
      };
    });
  }

  /** Deshace el último intercambio hecho en ese alimento. */
  deshacer(comida: number, alimento: number): void {
    this.modificarMenu((m) => {
      const pos = this.ultimoCambio(m, (c) => c.comida === comida && c.alimento === alimento);
      if (pos < 0) return m;
      return this.revertir(m, pos);
    });
  }

  /** Deshace el último intercambio del menú, sea cual sea. */
  deshacerUltimo(): void {
    this.modificarMenu((m) => (m.cambios.length ? this.revertir(m, m.cambios.length - 1) : m));
  }

  intercambiado(comida: number, alimento: number): boolean {
    return !!this.menu()?.cambios.some((c) => c.comida === comida && c.alimento === alimento);
  }

  // ---- Privado -------------------------------------------------------------------

  private agregar(paciente: Paciente, plan: PlanResponse): void {
    const nuevo: MenuGuardado = { numero: ++this.contador, paciente, plan, cambios: [] };
    this.historial.update((h) => [...h, nuevo].slice(-MAX_HISTORIAL));
    this.indice.set(this.historial().length - 1);
  }

  private terminarCarga(): void {
    clearTimeout(this.aviso);
    this.cargando.set(false);
    this.lento.set(false);
  }

  private modificarMenu(fn: (m: MenuGuardado) => MenuGuardado): void {
    const i = this.indice();
    this.historial.update((h) => h.map((m, k) => (k === i ? fn(m) : m)));
  }

  private conAlimento(m: MenuGuardado, comida: number, alimento: number, nuevo: AlimentoMenu): MenuGuardado {
    return {
      ...m,
      plan: {
        ...m.plan,
        comidas: m.plan.comidas.map((c, ci) =>
          ci === comida ? { ...c, alimentos: c.alimentos.map((a, ai) => (ai === alimento ? nuevo : a)) } : c,
        ),
      },
    };
  }

  private revertir(m: MenuGuardado, pos: number): MenuGuardado {
    const cambio = m.cambios[pos];
    const base = this.conAlimento(m, cambio.comida, cambio.alimento, cambio.previo);
    return { ...base, cambios: m.cambios.filter((_, k) => k !== pos) };
  }

  private ultimoCambio(m: MenuGuardado, pred: (c: Cambio) => boolean): number {
    for (let k = m.cambios.length - 1; k >= 0; k--) if (pred(m.cambios[k])) return k;
    return -1;
  }
}
