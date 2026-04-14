export interface NumistaCoin {
  id: number;
  url: string;
  title: string;
  category: string;
  issuer: {
    code: string;
    name: string;
  };
  min_year: number;
  max_year: number;
  type: string;
  value?: {
    text: string;
    numeric_value: number;
    currency: {
      id: number;
      name: string;
      full_name: string;
    };
  };
  demonetization?: {
    is_demonetized: boolean;
  };
  shape?: string;
  composition?: {
    text: string;
  };
  technique?: {
    text: string;
  };
  weight?: number;
  size?: number;
  thickness?: number;
  orientation?: string;
  obverse?: {
    description?: string;
    lettering?: string;
    picture?: string;
    thumbnail?: string;
    picture_copyright?: string;
  };
  reverse?: {
    description?: string;
    lettering?: string;
    picture?: string;
    thumbnail?: string;
    picture_copyright?: string;
  };
  edge?: {
    description?: string;
    picture?: string;
    thumbnail?: string;
    picture_copyright?: string;
  };
  references?: {
    catalogue: {
      id: number;
      code: string;
    };
    number: string;
  }[];
  mints?: {
    id: string;
    name: string;
  }[];
}
