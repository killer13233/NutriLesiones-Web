import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="hoja" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 27C6 15 13 6 28 4c0 15-9 23-20 23" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M6 27c3-6 8-11 14-14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="24" cy="9" r="1.6" fill="var(--verde-lima)" />
    </svg>
    <span class="nombre">NutriLesiones</span>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: .55rem; color: var(--verde-bosque); }
    .hoja { width: 1.9rem; height: 1.9rem; }
    .nombre { font-family: var(--fuente-titulo); font-weight: 600; font-size: 1.45rem; letter-spacing: -.01em; }
  `,
})
export class LogoComponent {}
