import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          tripsmith
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Tell it how you travel. It plans the trip.
        </p>

        <ol className="mt-10 space-y-4 text-zinc-700 dark:text-zinc-300">
          <li className="flex gap-3">
            <span className="font-mono text-sm text-zinc-400">01</span>
            <div>
              <Link
                href="/profile"
                className="font-medium text-black underline-offset-4 hover:underline dark:text-zinc-50"
              >
                Set up your profile
              </Link>
              <span className="text-zinc-500"> — one time, ~3 min</span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-sm text-zinc-400">02</span>
            <div>
              <Link
                href="/plan"
                className="font-medium text-black underline-offset-4 hover:underline dark:text-zinc-50"
              >
                Plan a trip
              </Link>
              <span className="text-zinc-500"> — destination, dates, who&apos;s coming</span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-sm text-zinc-400">03</span>
            <div>
              <span className="font-medium text-black dark:text-zinc-50">
                Get a checklist
              </span>
              <span className="text-zinc-500"> — flights, stays, itinerary, packing</span>
            </div>
          </li>
        </ol>

        <p className="mt-12 text-sm text-zinc-500">
          tripsmith doesn&apos;t book anything. It hands you deep links so you click and confirm.
        </p>
      </div>
    </main>
  );
}
