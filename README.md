# tripsmith

A personal travel planner. Tell it about how you like to travel, then ask it to plan a trip. It produces a checklist with flight options, accommodation picks, a day-by-day itinerary, and a packing list — all matched to your preferences and the destination's weather.

It does **not** book anything. It hands you deep links to Google Flights / Booking / Airbnb so you can click and confirm.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Anthropic Claude Sonnet 4.6 for reasoning + estimated prices
- OpenWeather for forecast → packing list
- localStorage for the user profile (no DB, no auth in v1)

Flight + hotel links go to Google Flights / Booking.com / Airbnb search with your dates pre-filled — click to see live prices.

## Setup

1. Copy env template and fill in keys:
   ```
   cp .env.local.example .env.local
   ```
2. Get keys:
   - **Anthropic**: https://console.anthropic.com (personal account → Plans → upgrade to Build → buy credits)
   - **OpenWeather**: https://openweathermap.org/api (free tier)
3. Install + run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## Flow
1. `/profile` — one-time form for your travel preferences
2. `/plan` — enter destination + dates + travelers
3. `/trip` — the generated checklist with prices and links

## Costs
- Anthropic: ~$0.01–0.05 per trip plan (Sonnet 4.6, prompt caching enabled)
- OpenWeather: free up to 1,000 calls/day
