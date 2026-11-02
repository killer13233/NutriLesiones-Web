// Tipos que reflejan exactamente el contrato de la API (camelCase).

export type FaseId = 'inflamatoria' | 'proliferativa' | 'remodelacion';

export interface OpcionCatalogo { id: string; nombre: string; }
export interface ComidaCatalogo { id: string; nombre: string; horario: string; }

export interface Catalogos {
  fases: OpcionCatalogo[];
  lecciones: OpcionCatalogo[];
  comidas: ComidaCatalogo[];
}

export interface PlanRequest {
  peso: number;
  fase: FaseId;
  leccion?: string;
  semilla?: number;
}

export interface Requerimientos {
  kcal: number;
  carbohidratos: number;
  proteina: number;
  grasa: number;
  kcalPorKg: number;
  pctProteina: number;
  pctCarbohidratos: number;
  pctGrasa: number;
}

export interface GrupoPorcion {
  grupo: string;
  subgrupo: string;
  porcionesTotal: number;
  porComida: number[];
}

export interface Adecuacion {
  carbohidratos: number;
  proteina: number;
  grasa: number;
  kcal: number;
  enRango90a110: boolean;
}

export interface Macros {
  kcal: number;
  cho: number;
  proteina: number;
  grasa: number;
}

export interface Alternativa {
  id: string;
  nombre: string;
  medidaPorPorcion: string;
  pesoPorPorcionG: string;
  foto: string | null;
  fotoReferencia: string | null;
}

export interface AlimentoMenu {
  id: string;
  nombre: string;
  grupo: string;
  subgrupo: string;
  porciones: number;
  medidaPorPorcion: string;
  pesoPorPorcionG: string;
  foto: string | null;
  fotoReferencia: string | null;
  nota: string | null;
  alternativas: Alternativa[];
}

export interface Comida {
  id: string;
  nombre: string;
  horario: string;
  aporte: Macros;
  alimentos: AlimentoMenu[];
}

export interface PlanResponse {
  fase: string;
  leccion: string | null;
  peso: number;
  semilla: number;
  requerimientos: Requerimientos;
  porciones: GrupoPorcion[];
  adecuacion: Adecuacion;
  comidas: Comida[];
  totalDia: Macros;
  advertencias: string[];
}

export interface ErrorApi { error: string; }

/** Datos del jugador. Solo viven en memoria; únicamente peso y fase se envían al servidor. */
export interface Paciente {
  nombre: string;
  edad: number;
  peso: number;
  altura: number;
  sexo: 'Masculino' | 'Femenino';
  posicion: 'Portero' | 'Defensa' | 'Mediocampista' | 'Delantero';
  leccion: string;
  leccionNombre: string;
  fase: FaseId;
  faseNombre: string;
}
