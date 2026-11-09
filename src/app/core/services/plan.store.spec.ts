import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Paciente, PlanResponse } from '../models/api.models';
import { MAX_HISTORIAL, PlanStore } from './plan.store';

const paciente: Paciente = {
  nombre: 'Juan Pérez', edad: 16, peso: 70, altura: 178, sexo: 'Masculino', posicion: 'Defensa',
  leccion: '', leccionNombre: '', fase: 'inflamatoria', faseNombre: 'Inflamatoria',
};

function plan(semilla: number): PlanResponse {
  const alt = (id: string) => ({ id, nombre: id, medidaPorPorcion: '1 u', pesoPorPorcionG: '50', foto: null, fotoReferencia: null });
  return {
    fase: 'inflamatoria', leccion: null, peso: 70, semilla,
    requerimientos: { kcal: 2100, carbohidratos: 262, proteina: 105, grasa: 70, kcalPorKg: 30, pctProteina: 20, pctCarbohidratos: 50, pctGrasa: 30 },
    porciones: [], adecuacion: { carbohidratos: 100, proteina: 100, grasa: 100, kcal: 100, enRango90a110: true },
    comidas: [{
      id: 'desayuno', nombre: 'Desayuno', horario: '07:00–08:00', indicacion: 'Texto original', aporte: { kcal: 500, cho: 60, proteina: 20, grasa: 15 },
      alimentos: [{
        id: 'pan', nombre: 'Pan', grupo: 'Cereales', subgrupo: 'x', porciones: 2, medidaPorPorcion: '1 rebanada',
        pesoPorPorcionG: '30', foto: null, fotoReferencia: null, nota: 'nota', alternativas: [alt('tostada'), alt('galleta')],
      }],
    }],
    totalDia: { kcal: 2100, cho: 262, proteina: 105, grasa: 70 }, advertencias: [],
  };
}

describe('PlanStore', () => {
  let store: PlanStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(PlanStore);
    http = TestBed.inject(HttpTestingController);
  });

  function generar(semilla = 1) {
    store.generar(paciente);
    http.expectOne((r) => r.url.endsWith('/api/plan')).flush(plan(semilla));
  }

  it('envía peso, fase y edad (nada de nombre ni altura)', () => {
    store.generar(paciente);
    const req = http.expectOne((r) => r.url.endsWith('/api/plan'));
    expect(req.request.body).toEqual({ peso: 70, fase: 'inflamatoria', edad: 16 });
    req.flush(plan(1));
    expect(store.menu()?.numero).toBe(1);
  });

  it('evita el doble envío mientras carga', () => {
    store.generar(paciente);
    store.generar(paciente);
    expect(http.match((r) => r.url.endsWith('/api/plan')).length).toBe(1);
  });

  it('guarda solo los últimos 5 menús y permite ir atrás y adelante', () => {
    for (let i = 1; i <= 7; i++) generar(i);
    expect(store.historial().length).toBe(MAX_HISTORIAL);
    expect(store.menu()?.numero).toBe(7);
    store.anterior();
    expect(store.menu()?.numero).toBe(6);
    store.siguiente();
    expect(store.menu()?.numero).toBe(7);
    expect(store.haySiguiente()).toBe(false);
  });

  it('cancelar una petición en curso no agrega menú', () => {
    store.generar(paciente);
    store.cancelar();
    expect(store.cargando()).toBe(false);
    expect(store.cancelado()).toBe(true);
    expect(store.historial().length).toBe(0);
  });

  it('error 400 muestra el mensaje del servidor', () => {
    store.generar(paciente);
    http.expectOne((r) => r.url.endsWith('/api/plan')).flush({ error: 'El peso debe estar entre 25 y 150 kg.' }, { status: 400, statusText: 'Bad Request' });
    expect(store.error()?.mensaje).toBe('El peso debe estar entre 25 y 150 kg.');
  });

  it('sin conexión muestra un mensaje claro', () => {
    store.generar(paciente);
    http.expectOne((r) => r.url.endsWith('/api/plan')).error(new ProgressEvent('error'));
    expect(store.error()?.tipo).toBe('conexion');
    expect(store.error()?.mensaje).toContain('Revisa tu conexión a internet');
  });

  it('intercambiar conserva las porciones y se puede deshacer', () => {
    generar();
    store.intercambiar(0, 0, 'tostada');
    const cambiado = store.menu()!.plan.comidas[0].alimentos[0];
    expect(cambiado.id).toBe('tostada');
    expect(cambiado.porciones).toBe(2);
    expect(cambiado.nota).toBeNull();
    expect(cambiado.alternativas.map((a) => a.id)).toEqual(['pan', 'galleta']);
    expect(store.intercambiado(0, 0)).toBe(true);

    store.deshacer(0, 0);
    const original = store.menu()!.plan.comidas[0].alimentos[0];
    expect(original.id).toBe('pan');
    expect(original.nota).toBe('nota');
    expect(store.intercambiado(0, 0)).toBe(false);
  });

  it('deshacerUltimo revierte el último intercambio', () => {
    generar();
    store.intercambiar(0, 0, 'tostada');
    store.deshacerUltimo();
    expect(store.menu()!.plan.comidas[0].alimentos[0].id).toBe('pan');
  });

  describe('indicación de la comida', () => {
    const pedir = () => http.expectOne((r) => r.url.endsWith('/api/indicacion'));

    it('tras intercambiar pide la indicación de esa comida con los alimentos actuales', () => {
      generar();
      store.intercambiar(0, 0, 'tostada');
      const req = pedir();
      expect(req.request.body).toEqual({ comida: 'desayuno', alimentos: ['tostada'] });
      req.flush({ indicacion: 'Puedes preparar tostada.' });
      expect(store.menu()!.plan.comidas[0].indicacion).toBe('Puedes preparar tostada.');
    });

    it('tras deshacer vuelve a pedirla con los alimentos originales', () => {
      generar();
      store.intercambiar(0, 0, 'tostada');
      pedir().flush({ indicacion: 'otra' });
      store.deshacer(0, 0);
      const req = pedir();
      expect(req.request.body).toEqual({ comida: 'desayuno', alimentos: ['pan'] });
      req.flush({ indicacion: 'Texto de pan' });
      expect(store.menu()!.plan.comidas[0].indicacion).toBe('Texto de pan');
    });

    it('si responde null no queda texto', () => {
      generar();
      store.intercambiar(0, 0, 'tostada');
      pedir().flush({ indicacion: null });
      expect(store.menu()!.plan.comidas[0].indicacion).toBeNull();
    });

    it('si falla deja el texto anterior y no muestra error', () => {
      generar();
      store.intercambiar(0, 0, 'tostada');
      pedir().flush({ error: 'x' }, { status: 500, statusText: 'Server Error' });
      expect(store.menu()!.plan.comidas[0].indicacion).toBe('Texto original');
      expect(store.error()).toBeNull();
    });

    it('el texto se conserva al volver a un menú del historial', () => {
      generar(1);
      store.intercambiar(0, 0, 'tostada');
      pedir().flush({ indicacion: 'Nueva' });
      generar(2);
      store.anterior();
      expect(store.menu()!.plan.comidas[0].indicacion).toBe('Nueva');
    });

    it('una respuesta vieja no pisa a una más nueva', () => {
      generar();
      store.intercambiar(0, 0, 'tostada');
      const primera = pedir();
      store.deshacer(0, 0);
      expect(primera.cancelled).toBe(true);
      pedir().flush({ indicacion: 'Final' });
      expect(store.menu()!.plan.comidas[0].indicacion).toBe('Final');
    });
  });
});