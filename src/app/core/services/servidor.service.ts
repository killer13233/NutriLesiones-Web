import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Catalogos } from '../models/api.models';
import { ApiService } from './api.service';

export type EstadoServidor = 'conectando' | 'despertando' | 'listo' | 'sin-conexion';

/**
 * Despierta al servidor gratuito apenas se abre la página (GET /api/salud),
 * mientras la persona llena el formulario, y carga los catálogos de los selects.
 */
@Injectable({ providedIn: 'root' })
export class ServidorService implements OnDestroy {
  private readonly api = inject(ApiService);

  readonly estado = signal<EstadoServidor>('conectando');
  readonly catalogos = signal<Catalogos | null>(null);
  readonly errorCatalogos = signal(false);

  private sub?: Subscription;
  private temporizador?: ReturnType<typeof setTimeout>;
  private intentos = 0;

  iniciar(): void {
    this.sub?.unsubscribe();
    clearTimeout(this.temporizador);
    this.estado.set('conectando');
    this.errorCatalogos.set(false);
    const aviso = setTimeout(() => {
      if (this.estado() === 'conectando') this.estado.set('despertando');
    }, 4000);

    this.sub = this.api.salud().subscribe({
      next: () => {
        clearTimeout(aviso);
        this.estado.set('listo');
        this.intentos = 0;
        this.cargarCatalogos();
      },
      error: () => {
        clearTimeout(aviso);
        this.estado.set('sin-conexion');
        // Reintento automático y silencioso (máx. 5 veces) mientras la persona escribe.
        if (this.intentos++ < 5) this.temporizador = setTimeout(() => this.iniciar(), 6000);
      },
    });
  }

  reintentar(): void {
    this.intentos = 0;
    this.iniciar();
  }

  private cargarCatalogos(): void {
    this.api.catalogos().subscribe({
      next: (c) => { this.catalogos.set(c); this.errorCatalogos.set(false); },
      error: () => this.errorCatalogos.set(true),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearTimeout(this.temporizador);
  }
}
