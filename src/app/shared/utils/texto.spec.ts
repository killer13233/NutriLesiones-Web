import { formatearNombre, limpiarEntero, limpiarNombre, limpiarPeso, pesoANumero } from './texto';

describe('texto: limpieza de entradas', () => {
  it('nombre: quita números y símbolos', () => {
    expect(limpiarNombre('Juan123')).toBe('Juan');
    expect(limpiarNombre('María #1')).toBe('María ');
    expect(limpiarNombre('Peña_Núñez!')).toBe('PeñaNúñez');
  });

  it('nombre: sin espacio inicial ni espacios dobles, máximo 60', () => {
    expect(limpiarNombre('  Ana   Paz')).toBe('Ana Paz');
    expect(limpiarNombre('a'.repeat(80)).length).toBe(60);
  });

  it('nombre: recorta y pone mayúscula inicial', () => {
    expect(formatearNombre('  juan   pérez ')).toBe('Juan Pérez');
    expect(formatearNombre('MARÍA de la CRUZ')).toBe('María De La Cruz');
  });

  it('entero: solo dígitos y largo máximo', () => {
    expect(limpiarEntero('2e5+-.', 3)).toBe('25');
    expect(limpiarEntero('12345', 3)).toBe('123');
  });

  it('peso: un separador y un decimal', () => {
    expect(limpiarPeso('7a')).toBe('7');
    expect(limpiarPeso('65,55')).toBe('65,5');
    expect(limpiarPeso('6.5.2')).toBe('6.5');
    expect(limpiarPeso(',5')).toBe('5');
    expect(limpiarPeso('-70')).toBe('70');
    expect(limpiarPeso('1234')).toBe('123');
  });

  it('peso: conversión a número', () => {
    expect(pesoANumero('65,5')).toBe(65.5);
    expect(pesoANumero('70')).toBe(70);
    expect(pesoANumero('65,55')).toBeNull();
    expect(pesoANumero('')).toBeNull();
  });
});
