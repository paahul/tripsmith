import { TRAVEL_PHOTOS, type TravelPhoto } from "./travelImages";

export type HeroImage = {
  url: string;
  authorName: string;
  authorUrl: string;
  photoUrl: string;
};

// Destination keyword → curated photo id. First match wins.
const KEYWORD_MAP: Array<[RegExp, string]> = [
  [/tokyo|japan|kyoto|osaka|seoul|asia/i, "1480796927426-f609979314bd"],
  [/santorini|greek|greece|mykonos|athens/i, "1533105079780-92b9be482077"],
  [/marrakech|morocco|fez|casablanca|sahara/i, "1539020140153-e479b8c61bf5"],
  [/cinque|italy|italian|rome|florence|amalfi|mediterranean|coast|portugal|lisbon|spain|barcelona/i, "1530841377377-3ff06c0ca713"],
  [/dolomite|alps|swiss|switzerland|mountain|hike|lake|patagonia|norway|iceland/i, "1506905925346-21bda4d32df4"],
  [/germany|bavaria|black forest|forest|autumn|prague|vienna|austria/i, "1497436072909-60f360e1d4b1"],
];

function toHero(photo: TravelPhoto): HeroImage {
  // No authorName: we don't track the photographer for curated images,
  // so the credit chip on the trip page stays hidden.
  return {
    url: photo.url,
    authorName: "",
    authorUrl: "",
    photoUrl: `https://unsplash.com/photos/${photo.id}`,
  };
}

function curatedFallback(query: string): HeroImage {
  for (const [re, id] of KEYWORD_MAP) {
    if (re.test(query)) {
      const photo = TRAVEL_PHOTOS.find((p) => p.id === id);
      if (photo) return toHero(photo);
    }
  }
  // Deterministic pick so the same destination always gets the same image.
  let h = 0;
  for (let i = 0; i < query.length; i++) h = (h * 31 + query.charCodeAt(i)) | 0;
  return toHero(TRAVEL_PHOTOS[Math.abs(h) % TRAVEL_PHOTOS.length]);
}

export async function getHeroImage(query: string): Promise<HeroImage> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return curatedFallback(query);

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query,
    )}&orientation=landscape&per_page=5&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      // 30-day edge cache; destination photos don't need to be fresh
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return curatedFallback(query);
    const data = (await res.json()) as {
      results?: Array<{
        urls: { regular: string; full: string };
        user: { name: string; links: { html: string } };
        links: { html: string };
      }>;
    };
    const first = data.results?.[0];
    if (!first) return curatedFallback(query);
    return {
      url: first.urls.regular,
      authorName: first.user.name,
      authorUrl: first.user.links.html,
      photoUrl: first.links.html,
    };
  } catch {
    return curatedFallback(query);
  }
}
