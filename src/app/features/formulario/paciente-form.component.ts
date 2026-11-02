import { ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { FaseId, Paciente } from '../../core/models/api.models';
import { PlanStore } from '../../core/services/plan.store';
import { ServidorService } from '../../core/services/servidor.service';
import { SoloDigitosDirective } from '../../shared/directives/solo-digitos.directive';
import { SoloLetrasDirective } from '../../shared/directives/solo-letras.directive';
import { SoloPesoDirective } from '../../shared/directives/solo-peso.directive';
import { AyudaComponent } from '../../shared/ui/ayuda.component';
import { IconoComponent } from '../../shared/ui/icono.component';
import { formatearNombre, pesoANumero } from '../../shared/utils/texto';
import { LIMITES, enteroEnRango, nombreCompleto, pesoEnRango } from '../../shared/validators/paciente.validators';

type Campo = 'nombre' | 'edad' | 'peso' | 'altura' | 'sexo' | 'posicion' | 'fase';

const DESCRIPCION_FASE: Record<FaseId, string> = {
  inflamatoria: 'Primeros días tras la lesión. El menú aporta 30 kcal por cada kg de peso.',
  proliferativa: 'El cuerpo forma tejido nuevo. El menú aporta 30 kcal por cada kg de peso.',
  remodelacion: 'El tejido se fortalece y el jugador retoma el entrenamiento. El menú aporta 40 kcal por cada kg de peso.',
};

@Component({
  selector: 'app-paciente-form',
  imports: [ReactiveFormsModule, SoloLetrasDirective, SoloDigitosDirective, SoloPesoDirective, AyudaComponent, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paciente-form.component.html',
  styleUrl: './paciente-form.component.scss',
})
export class PacienteFormComponent implements OnInit {
  protected readonly store = inject(PlanStore);
  protected readonly servidor = inject(ServidorService);
  protected readonly limites = LIMITES;

  private readonly primerCampo = viewChild.required<ElementRef<HTMLInputElement>>('primerCampo');

  protected readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, nombreCompleto()] }),
    edad: new FormControl('', { nonNullable: true, validators: [Validators.required, enteroEnRango(LIMITES.edad.min, LIMITES.edad.max)] }),
    peso: new FormControl('', { nonNullable: true, validators: [Validators.required, pesoEnRango()] }),
    altura: new FormControl('', { nonNullable: true, validators: [Validators.required, enteroEnRango(LIMITES.altura.min, LIMITES.altura.max)] }),
    sexo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    posicion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    leccion: new FormControl('', { nonNullable: true }),
    fase: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly confirmando = signal(false);

  private readonly valida = toSignal(this.form.statusChanges.pipe(map((s) => s === 'VALID'), startWith(false)), { initialValue: false });
  protected readonly puedeEnviar = computed(() => this.valida() && !this.store.cargando());

  private readonly faseSeleccionada = toSignal(this.form.controls.fase.valueChanges.pipe(startWith('')), { initialValue: '' });
  protected readonly descripcionFase = computed(() => DESCRIPCION_FASE[this.faseSeleccionada() as FaseId] ?? 'Elige la fase para ver qué significa.');

  constructor() {
    // Los datos del paciente se mantienen en memoria mientras la pestaña esté abierta.
    effect(() => {
      const p = this.store.paciente();
      if (p && !this.form.dirty) this.rellenar(p);
    });
  }

  ngOnInit(): void {
    queueMicrotask(() => this.primerCampo().nativeElement.focus());
  }

  protected mostrarError(c: Campo): string | null {
    const ctrl = this.form.controls[c];
    if (!(ctrl.touched || ctrl.dirty) || !ctrl.errors) return null;
    return this.mensaje(c, ctrl.errors);
  }

  protected invalido(c: Campo): boolean {
    return this.mostrarError(c) !== null;
  }

  protected enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.store.cargando()) return;
    const v = this.form.getRawValue();
    const cat = this.servidor.catalogos();
    const nombreFase = cat?.fases.find((f) => f.id === v.fase)?.nombre ?? v.fase;
    const les = cat?.lecciones.find((l) => l.id === v.leccion);
    const paciente: Paciente = {
      nombre: formatearNombre(v.nombre),
      edad: Number(v.edad),
      peso: pesoANumero(v.peso) ?? 0,
      altura: Number(v.altura),
      sexo: v.sexo as Paciente['sexo'],
      posicion: v.posicion as Paciente['posicion'],
      leccion: v.leccion,
      leccionNombre: les?.nombre ?? '',
      fase: v.fase as FaseId,
      faseNombre: nombreFase,
    };
    this.store.generar(paciente);
  }

  protected limpiar(): void {
    if (this.form.dirty && !this.confirmando()) {
      this.confirmando.set(true);
      return;
    }
    this.confirmarLimpiar();
  }

  protected confirmarLimpiar(): void {
    this.form.reset();
    this.confirmando.set(false);
    this.primerCampo().nativeElement.focus();
  }

  protected cancelarLimpiar(): void {
    this.confirmando.set(false);
  }

  private rellenar(p: Paciente): void {
    this.form.setValue({
      nombre: p.nombre, edad: String(p.edad), peso: String(p.peso).replace('.', ','), altura: String(p.altura),
      sexo: p.sexo, posicion: p.posicion, leccion: p.leccion, fase: p.fase,
    }, { emitEvent: true });
  }

  private mensaje(c: Campo, e: Record<string, unknown>): string {
    if (e['required']) {
      return {
        nombre: 'Escribe el nombre completo. Por ejemplo: Juan Pérez.',
        edad: 'Escribe la edad en años. Por ejemplo: 24.',
        peso: 'Escribe el peso en kg. Por ejemplo: 65,5.',
        altura: 'Escribe la altura en cm. Por ejemplo: 178.',
        sexo: 'Elige una opción de la lista.',
        posicion: 'Elige la posición en el campo.',
        fase: 'Elige la fase de la lesión.',
      }[c];
    }
    if (c === 'nombre') {
      if (e['caracteres']) return 'El nombre solo puede tener letras y espacios.';
      if (e['espaciosDobles']) return 'Hay dos espacios seguidos. Deja uno solo entre palabras.';
      if (e['largo']) return 'El nombre puede tener hasta 60 caracteres.';
      return 'Escribe nombre y apellido, cada uno de al menos 2 letras. Por ejemplo: Juan Pérez.';
    }
    if (c === 'edad') return `La edad debe estar entre ${LIMITES.edad.min} y ${LIMITES.edad.max} años. Escribe solo números, por ejemplo 24.`;
    if (c === 'altura') return `La altura debe estar entre ${LIMITES.altura.min} y ${LIMITES.altura.max} cm. Escribe solo números, por ejemplo 178.`;
    if (c === 'peso') {
      if (e['formatoPeso']) return 'Usa un solo decimal. Escribe por ejemplo 65,5.';
      return `El peso debe estar entre ${LIMITES.peso.min} y ${LIMITES.peso.max} kg. Escribe por ejemplo 65,5.`;
    }
    return 'Revisa este dato.';
  }
}
