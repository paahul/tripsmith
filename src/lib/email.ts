import type { TripPlan } from "./types";

export function tripPlanToHtml(plan: TripPlan): string {
  const flights = plan.flights
    .map(
      (f) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600;">${escape(f.airline)}</div>
          <div style="font-size: 13px; color: #666; margin-top: 4px;">
            ${escape(f.departure)} → ${escape(f.arrival)} · ${escape(f.duration)} ·
            ${f.stops === 0 ? "nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">
          <div>${escape(f.price)}</div>
          <a href="${escape(f.bookingLink)}" style="font-size: 12px; color: #2563eb;">book →</a>
        </td>
      </tr>`,
    )
    .join("");

  const stays = plan.accommodations
    .map(
      (a) => `
      <div style="padding: 14px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <strong>${escape(a.name)}</strong>
          <span style="font-family: monospace; font-size: 13px;">${escape(a.pricePerNight)}</span>
        </div>
        <div style="font-size: 13px; color: #666; margin: 4px 0;">${escape(a.style)}</div>
        <div style="font-size: 14px; margin: 8px 0;">${escape(a.whyItFits)}</div>
        <a href="${escape(a.bookingLink)}" style="font-size: 12px; color: #2563eb;">book →</a>
      </div>`,
    )
    .join("");

  const itinerary = plan.itinerary
    .map((day) => {
      const activities = day.activities
        .map(
          (act) =>
            `<li style="margin-bottom: 6px;"><span style="font-family: monospace; color: #888; margin-right: 8px;">${escape(act.time)}</span>${escape(act.description)}${act.tip ? ` <span style="color: #888;">— ${escape(act.tip)}</span>` : ""}</li>`,
        )
        .join("");
      const meals = day.meals
        .map(
          (m) =>
            `<li style="margin-bottom: 4px;"><strong>${escape(m.meal)}:</strong> ${escape(m.suggestion)} <span style="color: #888;">— ${escape(m.why)}</span></li>`,
        )
        .join("");
      return `
      <div style="padding: 16px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <strong>${escape(day.title)}</strong>
          <span style="font-family: monospace; font-size: 12px; color: #888;">${escape(day.date)}</span>
        </div>
        <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px;">${activities}</ul>
        ${meals ? `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #f3f3f3;"><div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 6px;">Meals</div><ul style="margin: 0; padding-left: 20px; font-size: 14px;">${meals}</ul></div>` : ""}
      </div>`;
    })
    .join("");

  const packing = plan.packingList
    .map(
      (cat) => `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px;">${escape(cat.category)}</div>
        <div style="font-size: 14px;">${cat.items.map(escape).join(" · ")}</div>
      </div>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; max-width: 640px; margin: 0 auto; padding: 24px;">
  <div style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: #888;">Your trip</div>
  <h1 style="margin: 4px 0 16px; font-size: 28px;">${escape(plan.destination)}</h1>
  <p style="font-size: 16px; line-height: 1.5; color: #333;">${escape(plan.summary)}</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 4px;">✈️ Flights</h2>
  <p style="font-size: 13px; color: #888; margin-top: 0;">Click through to book — prices are estimates.</p>
  <table style="width: 100%; border-collapse: collapse;">${flights}</table>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">🏨 Where to stay</h2>
  ${stays}

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px;">🚕 Getting around</h2>
  <p style="font-size: 14px; line-height: 1.5;">${escape(plan.localTransport)}</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">📅 Day by day</h2>
  ${itinerary}

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 4px;">🌤️ Weather</h2>
  <p style="font-size: 14px; line-height: 1.5;">${escape(plan.weatherSummary)}</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">🧥 Packing list</h2>
  ${packing}

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="font-size: 12px; color: #888;">Sent by tripsmith.</p>
</body>
</html>`;
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
