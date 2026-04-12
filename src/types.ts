export interface Game {
  name: string;
  url: string;
  image?: string;
  usesProxy?: boolean;
}

export interface App {
  name: string;
  url: string;
  image?: string;
}

export interface CloakEntry { title: string; icon: string; }
