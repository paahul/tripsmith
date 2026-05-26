import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { listTripsForUser } from "@/lib/tripStore";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/signin?next=/trips");

  const trips = await listTripsForUser(data.user.id);

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-10 flex items-baseline justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-terracotta">
              Your trips
            </p>
            <h1 className="font-serif text-4xl font-light text-ink">
              Past plans
            </h1>
            <p className="mt-2 text-xs text-muted">
              Signed in as <span className="font-mono">{data.user.email}</span>
            </p>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-terracotta">
            ← home
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="rounded border border-line bg-paper p-8 text-center">
            <p className="font-serif text-xl italic text-muted">
              No trips yet.
            </p>
            <Link
              href="/plan"
              className="mt-4 inline-block font-serif text-lg text-ink underline-offset-[6px] decoration-terracotta decoration-2 hover:underline"
            >
              Plan your first →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trip/${trip.id}`}
                  className="block rounded border border-line bg-paper p-5 transition hover:border-terracotta"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-serif text-2xl font-light text-ink">
                      {trip.destination}
                    </h2>
                    <span className="font-mono text-xs text-muted">
                      {new Date(trip.updatedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm italic text-ink-2">
                    {trip.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex items-center gap-5 text-sm">
          <Link
            href="/plan"
            className="rounded bg-terracotta px-4 py-2 font-medium text-cream hover:bg-terracotta-deep"
          >
            Plan another trip
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-muted hover:text-terracotta"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
