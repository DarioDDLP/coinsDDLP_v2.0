export interface PesetaType {
  idNum: number;
  title: string;
  minYear: number;
  maxYear: number;
  category: string;
  faceValueESP: number | null;
  faceValueLabel: string;
  composition: string;
  weightG: number | null;
  diameterMm: number | null;
  shape: string;
  orientation: string | null;
  ruler: string | null;
  demonetized: string | null;
  kmRef: string | null;
  mint: string | null;
  imageObverse: string;
  imageReverse: string;
  imageEdge: string | null;
  engraverObverse: string | null;
  engraverReverse: string | null;
  comments: string | null;
  descriptionObverse: string | null;
  descriptionReverse: string | null;
  edgeDescription: string | null;
}

export interface Peseta {
  id: string;
  peseta_type_id: number;
  designYear: number;
  mintYear: number;
  mintage: number | null;
  label: string;
  uds: number;
  conservation: string | null;
  observations: string | null;
  peseta_type: PesetaType;
}
