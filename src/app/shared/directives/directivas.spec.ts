import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SoloLetrasDirective } from './solo-letras.directive';
import { SoloDigitosDirective } from './solo-digitos.directive';
import { SoloPesoDirective } from './solo-peso.directive';

@Component({
  imports: [ReactiveFormsModule, SoloLetrasDirective, SoloDigitosDirective, SoloPesoDirective],
  template: `
    <input id="n" soloLetras [formControl]="nombre" />
    <input id="e" soloDigitos [maxDigitos]="2" [formControl]="edad" />
    <input id="p" soloPeso [formControl]="peso" />
  `,
})
class Anfitrion {
  nombre = new FormControl('', { nonNullable: true });
  edad = new FormControl('', { nonNullable: true });
  peso = new FormControl('', { nonNullable: true });
}

function montar() {
  const fixture = TestBed.createComponent(Anfitrion);
  fixture.detectChanges();
  const q = (id: string) => fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
  return { fixture, c: fixture.componentInstance, n: q('n'), e: q('e'), p: q('p') };
}

function escribir(el: HTMLInputElement, texto: string) {
  el.value = texto;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function tecla(el: HTMLInputElement, key: string): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
  el.dispatchEvent(ev);
  return ev;
}

function pegar(el: HTMLInputElement, texto: string) {
  const ev = new Event('paste', { cancelable: true, bubbles: true });
  Object.defineProperty(ev, 'clipboardData', { value: { getData: () => texto } });
  el.dispatchEvent(ev);
  return ev;
}

function soltar(el: HTMLInputElement, texto: string) {
  const ev = new Event('drop', { cancelable: true, bubbles: true });
  Object.defineProperty(ev, 'dataTransfer', { value: { getData: () => texto } });
  el.dispatchEvent(ev);
  return ev;
}

describe('directivas de entrada', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Anfitrion] }));

  describe('soloLetras', () => {
    it('bloquea teclas que no son letras', () => {
      const { n } = montar();
      expect(tecla(n, '5').defaultPrevented).toBe(true);
      expect(tecla(n, '#').defaultPrevented).toBe(true);
      expect(tecla(n, 'ñ').defaultPrevented).toBe(false);
      expect(tecla(n, 'a').defaultPrevented).toBe(false);
    });
    it('"Juan123" -> "Juan"', () => {
      const { n, c } = montar();
      escribir(n, 'Juan123');
      expect(n.value).toBe('Juan');
      expect(c.nombre.value).toBe('Juan');
    });
    it('pegar "María #1" -> "María "', () => {
      const { n, c } = montar();
      const ev = pegar(n, 'María #1');
      expect(ev.defaultPrevented).toBe(true);
      expect(c.nombre.value).toBe('María ');
    });
    it('arrastrar texto con números lo limpia', () => {
      const { n, c } = montar();
      soltar(n, 'Luis9');
      expect(c.nombre.value).toBe('Luis');
    });
    it('no permite espacio inicial ni doble', () => {
      const { n } = montar();
      expect(tecla(n, ' ').defaultPrevented).toBe(true);
      escribir(n, 'Ana');
      n.setSelectionRange(3, 3);
      escribir(n, 'Ana ');
      n.setSelectionRange(4, 4);
      expect(tecla(n, ' ').defaultPrevented).toBe(true);
    });
    it('al salir recorta y capitaliza', () => {
      const { n, c } = montar();
      escribir(n, 'juan perez ');
      n.dispatchEvent(new Event('blur'));
      expect(c.nombre.value).toBe('Juan Perez');
    });
  });

  describe('soloDigitos', () => {
    it('bloquea letras, "e", "+", "-" y "."', () => {
      const { e } = montar();
      for (const k of ['a', 'e', '+', '-', '.']) expect(tecla(e, k).defaultPrevented).toBe(true);
      expect(tecla(e, '7').defaultPrevented).toBe(false);
    });
    it('respeta el máximo de dígitos', () => {
      const { e, c } = montar();
      escribir(e, '2345');
      expect(c.edad.value).toBe('23');
    });
    it('al pegar quita lo que no es dígito', () => {
      const { e, c } = montar();
      pegar(e, '2a');
      expect(c.edad.value).toBe('2');
    });
  });

  describe('soloPeso', () => {
    it('"7a" -> "7"', () => {
      const { p, c } = montar();
      escribir(p, '7a');
      expect(c.peso.value).toBe('7');
    });
    it('permite un solo separador y un decimal', () => {
      const { p, c } = montar();
      escribir(p, '65,5');
      p.setSelectionRange(4, 4);
      expect(tecla(p, ',').defaultPrevented).toBe(true);
      expect(tecla(p, '3').defaultPrevented).toBe(true);
      expect(c.peso.value).toBe('65,5');
    });
    it('no permite empezar con separador ni signo', () => {
      const { p } = montar();
      expect(tecla(p, ',').defaultPrevented).toBe(true);
      expect(tecla(p, '-').defaultPrevented).toBe(true);
    });
  });
});
