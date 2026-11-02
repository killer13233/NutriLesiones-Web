import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { PlanStore } from './core/services/plan.store';
import { ServidorService } from './core/services/servidor.service';
import { PacienteFormComponent } from './features/formulario/paciente-form.component';
import { ResultadoComponent } from './features/resultado/resultado.component';
import { IconoComponent } from './shared/ui/icono.component';
import { LogoComponent } from './shared/ui/logo.component';

@Component({
  selector: 'app-root',
  imports: [PacienteFormComponent, ResultadoComponent, LogoComponent, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly store = inject(PlanStore);
  protected readonly servidor = inject(ServidorService);

  protected readonly comidasEjemplo = [
    ['Desayuno', '07:00'], ['Media mañana', '10:00'], ['Almuerzo', '12:30'], ['Media tarde', '16:00'], ['Cena', '19:00'],
  ];

  ngOnInit(): void {
    // Ping silencioso: despierta al servidor gratuito mientras se llena el formulario.
    this.servidor.iniciar();
  }

  /** Atajo "G": generar otro menú, solo cuando el foco no está en un campo. */
  @HostListener('document:keydown', ['$event'])
  protected atajo(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 'g') return;
    const t = e.target as HTMLElement | null;
    if (t && (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(t.tagName) || t.isContentEditable)) return;
    if (!this.store.menu() || this.store.cargando()) return;
    e.preventDefault();
    this.store.generarOtro();
  }
}
