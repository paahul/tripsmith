import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-terracotta">
          A personal travel planner
        </p>
        <h1 className="font-serif text-6xl font-light leading-[1.05] tracking-tight text-ink">
          tripsmith
        </h1>
        <p className="mt-5 max-w-md font-serif text-2xl font-light italic leading-snug text-ink-2">
          Tell it how you travel. It plans the trip.
        </p>

        <hr className="my-12 border-line" />

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

        <p className="mt-16 text-xs italic text-muted">
          tripsmith doesn&apos;t book anything. It hands you deep links so you click and confirm.
        </p>
      </div>
    </main>
  );
}
