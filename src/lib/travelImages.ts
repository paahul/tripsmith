// Curated travel imagery. Direct Unsplash CDN URLs — stable, no API key needed
// to serve. Each entry has a 'tall' (portrait) and 'wide' (landscape) crop.
export type TravelPhoto = {
  id: string;
  alt: string;
  credit: string;
  url: string;
};

const U = (id: string, w: number = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const TRAVEL_PHOTOS: TravelPhoto[] = [
  {
    id: "1530841377377-3ff06c0ca713",
    alt: "Mediterranean coastline at golden hour",
    credit: "Cinque Terre",
    url: U("1530841377377-3ff06c0ca713", 900),
  },
  {
    id: "1480796927426-f609979314bd",
    alt: "Tokyo street at night",
    credit: "Tokyo",
    url: U("1480796927426-f609979314bd", 900),
  },
  {
    id: "1569383746724-6f1b882b8f46",
    alt: "Chefchaouen blue street",
    credit: "Chefchaouen",
    url: U("1569383746724-6f1b882b8f46", 900),
  },
  {
    id: "1506905925346-21bda4d32df4",
    alt: "Mountain lake at dawn",
    credit: "Dolomites",
    url: U("1506905925346-21bda4d32df4", 900),
  },
  {
    id: "1497436072909-60f360e1d4b1",
    alt: "Forest road in autumn",
    credit: "Black Forest",
    url: U("1497436072909-60f360e1d4b1", 900),
  },
  {
    id: "1533105079780-92b9be482077",
    alt: "Greek island whitewash and blue",
    credit: "Santorini",
    url: U("1533105079780-92b9be482077", 900),
  },
];

export const COVER_PHOTO_URL = U("1506905925346-21bda4d32df4", 1800);
