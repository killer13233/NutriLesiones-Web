import { FormControl } from '@angular/forms';
import { enteroEnRango, nombreCompleto, pesoEnRango } from './paciente.validators';

const prueba = (validador: ReturnType<typeof nombreCompleto>, valor: string) =>
  validador(new FormControl(valor));

describe('validadores del paciente', () => {
  describe('nombreCompleto', () => {
    it('acepta dos palabras con tildes y ñ', () => {
      expect(prueba(nombreCompleto(), 'José Núñez')).toBeNull();
    });
    it('rechaza una sola palabra o palabras de 1 letra', () => {
      expect(prueba(nombreCompleto(), 'Juan')).toEqual({ palabras: true });
      expect(prueba(nombreCompleto(), 'Juan P')).toEqual({ palabras: true });
    });
    it('rechaza números, símbolos y espacios dobles', () => {
      expect(prueba(nombreCompleto(), 'Juan 123')).toEqual({ caracteres: true });
      expect(prueba(nombreCompleto(), 'Juan  Pérez')).toEqual({ espaciosDobles: true });
    });
    it('rechaza más de 60 caracteres', () => {
      expect(prueba(nombreCompleto(), 'Ana ' + 'b'.repeat(60))).toEqual({ largo: { max: 60 } });
    });
  });

  describe('enteroEnRango', () => {
    const edad = enteroEnRango(10, 60);
    it('acepta los límites', () => {
      expect(prueba(edad, '10')).toBeNull();
      expect(prueba(edad, '60')).toBeNull();
    });
    it('rechaza fuera de rango', () => {
      expect(prueba(edad, '9')).toEqual({ rango: { min: 10, max: 60 } });
      expect(prueba(edad, '61')).toEqual({ rango: { min: 10, max: 60 } });
    });
    it('rechaza texto', () => {
      expect(prueba(edad, '2a')).toEqual({ entero: true });
    });
  });

  describe('pesoEnRango', () => {
    const peso = pesoEnRango();
    it('peso 20 -> error de rango', () => {
      expect(prueba(peso, '20')).toEqual({ rango: { min: 25, max: 150 } });
    });
    it('peso 151 -> error de rango', () => {
      expect(prueba(peso, '151')).toEqual({ rango: { min: 25, max: 150 } });
    });
    it('acepta coma y punto', () => {
      expect(prueba(peso, '65,5')).toBeNull();
      expect(prueba(peso, '65.5')).toBeNull();
    });
    it('rechaza más de un decimal', () => {
      expect(prueba(peso, '65,55')).toEqual({ formatoPeso: true });
    });
  });
});
