export type HeroImage = {
  url: string;
  authorName: string;
  authorUrl: string;
  photoUrl: string;
};

export async function getHeroImage(query: string): Promise<HeroImage | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query,
    )}&orientation=landscape&per_page=5&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      // 30-day edge cache; destination photos don't need to be fresh
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        urls: { regular: string; full: string };
        user: { name: string; links: { html: string } };
        links: { html: string };
      }>;
    };
    const first = data.results?.[0];
    if (!first) return null;
    return {
      url: first.urls.regular,
      authorName: first.user.name,
      authorUrl: first.user.links.html,
      photoUrl: first.links.html,
    };
  } catch {
    return null;
  }
}
