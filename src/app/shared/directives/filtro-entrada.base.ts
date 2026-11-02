import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Base de las directivas que impiden escribir caracteres inválidos.
 * Filtra en keydown (al teclear), paste (al pegar), drop (al arrastrar texto) e input
 * (autocorrector, teclados móviles, dictado): el valor final siempre queda limpio.
 */
@Directive()
export abstract class FiltroEntradaBase {
  protected readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  /** Devuelve el texto permitido a partir de lo que se intentó escribir. */
  protected abstract limpiar(valor: string): string;

  @HostListener('keydown', ['$event'])
  protected alTeclear(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return; // atajos y teclas de control
    const { inicio, fin } = this.seleccion();
    const siguiente = this.el.value.slice(0, inicio) + e.key + this.el.value.slice(fin);
    if (this.limpiar(siguiente) !== siguiente) e.preventDefault();
  }

  @HostListener('paste', ['$event'])
  protected alPegar(e: ClipboardEvent): void {
    e.preventDefault();
    this.insertar(e.clipboardData?.getData('text') ?? '');
  }

  @HostListener('drop', ['$event'])
  protected alSoltar(e: DragEvent): void {
    e.preventDefault();
    this.insertar(e.dataTransfer?.getData('text') ?? '');
  }

  @HostListener('input')
  protected alEscribir(): void {
    const actual = this.el.value;
    const limpio = this.limpiar(actual);
    if (limpio === actual) return;
    const cursor = this.el.selectionStart ?? actual.length;
    this.asignar(limpio);
    const nuevo = Math.max(0, cursor - (actual.length - limpio.length));
    this.el.setSelectionRange(nuevo, nuevo);
  }

  /** Aplica un texto final (por ejemplo al salir del campo) y avisa al formulario. */
  protected aplicar(valor: string): void {
    if (valor === this.el.value) return;
    this.asignar(valor);
    this.el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private insertar(texto: string): void {
    const { inicio, fin } = this.seleccion();
    const antes = this.el.value.slice(0, inicio);
    const despues = this.el.value.slice(fin);
    const limpio = this.limpiar(antes + texto + despues);
    this.asignar(limpio);
    const cursor = Math.max(0, limpio.length - despues.length);
    this.el.setSelectionRange(cursor, cursor);
    this.el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private asignar(valor: string): void {
    this.el.value = valor;
    const control = this.ngControl?.control;
    if (control && control.value !== valor) control.setValue(valor);
  }

  private seleccion(): { inicio: number; fin: number } {
    const largo = this.el.value.length;
    return { inicio: this.el.selectionStart ?? largo, fin: this.el.selectionEnd ?? largo };
  }
}
