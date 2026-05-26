import Link from "next/link";
import { TRAVEL_PHOTOS } from "@/lib/travelImages";

export default function Home() {
  // Four-up collage from the curated set. Stable across renders.
  const photos = [
    TRAVEL_PHOTOS.find((p) => p.credit === "Dolomites"),
    TRAVEL_PHOTOS.find((p) => p.credit === "Cinque Terre"),
    TRAVEL_PHOTOS.find((p) => p.credit === "Tokyo"),
    TRAVEL_PHOTOS.find((p) => p.credit === "Marrakech"),
  ];

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-terracotta">
            A personal travel planner
          </p>
          <h1 className="font-serif text-6xl font-light leading-[1.05] tracking-tight text-ink sm:text-7xl">
            tripsmith
          </h1>
          <p className="mt-5 max-w-md font-serif text-2xl font-light italic leading-snug text-ink-2">
            Tell it how you travel. It plans the trip.
          </p>

          <hr className="my-10 border-line" />

          <ol className="space-y-6 text-ink-2">
            <li className="flex gap-5">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">01</span>
              <div className="flex-1">
                <Link
                  href="/profile"
                  className="font-serif text-2xl text-ink underline-offset-[6px] decoration-terracotta decoration-2 hover:underline"
                >
                  Set up your profile
                </Link>
                <p className="mt-1 text-sm text-muted">One time, ~3 minutes.</p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">02</span>
              <div className="flex-1">
                <Link
                  href="/plan"
                  className="font-serif text-2xl text-ink underline-offset-[6px] decoration-terracotta decoration-2 hover:underline"
                >
                  Plan a trip
                </Link>
                <p className="mt-1 text-sm text-muted">Destination, dates, who&apos;s coming.</p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">03</span>
              <div className="flex-1">
                <p className="font-serif text-2xl text-ink">Get a checklist</p>
                <p className="mt-1 text-sm text-muted">
                  Flights, stays, day-by-day, packing — tailored to you.
                </p>
              </div>
            </li>
          </ol>

          <p className="mt-12 text-xs italic text-muted">
            tripsmith doesn&apos;t book anything. It hands you deep links so you click and confirm.
          </p>
        </div>

        <div className="hidden gap-3 lg:grid lg:grid-cols-2">
          {photos.map((photo, i) => {
            const aspect =
              i === 0 ? "aspect-[4/5]" : i === 1 ? "aspect-[4/3]" : i === 2 ? "aspect-[4/3]" : "aspect-[4/5]";
            if (!photo) {
              return (
                <div
                  key={i}
                  className={`${aspect} rounded bg-gradient-to-br from-cream-2 via-terracotta-soft/40 to-cream-2`}
                  aria-hidden="true"
                />
              );
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={photo.url}
                alt={photo.alt}
                loading="lazy"
                className={`h-full w-full rounded object-cover shadow-sm ${aspect}`}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
