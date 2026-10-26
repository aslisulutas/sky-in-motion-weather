import { createFileRoute, useNavigate, ClientOnly } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, lazy, useState } from "react";
import { describe, fetchForecast, searchPlaces } from "@/lib/weather";

const WeatherScene = lazy(() => import("@/components/WeatherScene"));

type Search = { lat?: number | undefined; lon?: number | undefined; name?: string | undefined };

const forecastQuery = (lat: number, lon: number) =>
  queryOptions({
    queryKey: ["forecast", lat, lon],
    queryFn: () => fetchForecast(lat, lon),
    staleTime: 10 * 60_000,
  });

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lat: Number(s["lat"]) || undefined,
    lon: Number(s["lon"]) || undefined,
    name: typeof s["name"] === "string" && s["name"] ? s["name"] : undefined,
  }),
  loaderDeps: ({ search }) => ({ lat: search.lat ?? 41.0082, lon: search.lon ?? 28.9784 }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(forecastQuery(deps.lat, deps.lon)),
  head: () => ({
    meta: [
      { title: "Gökyüzü — 3D Animasyonlu Hava Durumu" },
      { name: "description", content: "Bulutların süzüldüğü, güneşin parladığı eğlenceli 3D hava durumu." },
      { property: "og:title", content: "Gökyüzü — 3D Animasyonlu Hava Durumu" },
      { property: "og:description", content: "Bulutların süzüldüğü, güneşin parladığı eğlenceli 3D hava durumu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="sky-cloudy flex min-h-screen items-center justify-center p-6 text-on-sky">
      <div className="toy-card p-8 text-center text-xl">☁️ {error instanceof Error ? error.message : "Bir hata oluştu"}</div>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Bulunamadı</div>,
});

const dayName = (d: string, i: number) =>
  i === 0 ? "Bugün" : new Date(d + "T12:00").toLocaleDateString("tr-TR", { weekday: "long" });

function Index() {
  const { lat = 41.0082, lon = 28.9784, name = "İstanbul" } = Route.useSearch();
  const { data } = useSuspenseQuery(forecastQuery(lat, lon));
  const info = describe(data.current.code);
  const isDay = data.current.isDay;
  const skyClass = isDay ? `sky-${info.kind}` : "sky-night";

  return (
    <main className={`${skyClass} relative min-h-screen overflow-hidden text-on-sky transition-colors duration-700`}>
      <div className="pointer-events-none fixed inset-0">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <WeatherScene kind={info.kind} isDay={isDay} />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:py-10">
        <SearchBar />

        <section className="flex flex-col items-start pt-6 md:pt-16">
          <h1 className="text-3xl font-semibold md:text-4xl">📍 {name}</h1>
          <div className="temp-3d text-[7rem] font-bold leading-none md:text-[10rem]">
            {Math.round(data.current.temp)}°
          </div>
          <p className="bob text-2xl font-medium md:text-3xl">
            {info.emoji} {info.label}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon="🌡️" label="Hissedilen" value={`${Math.round(data.current.feels)}°`} />
          <Stat icon="💧" label="Nem" value={`%${data.current.humidity}`} />
          <Stat icon="🍃" label="Rüzgar" value={`${Math.round(data.current.wind)} km/s`} />
          <Stat icon="☔" label="Yağış ihtimali" value={`%${data.hourly[0]?.pop ?? 0}`} />
        </section>

        <section className="toy-card p-4">
          <h2 className="mb-3 px-1 text-lg font-semibold">Saatlik</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.hourly.map((h, i) => {
              const d = describe(h.code);
              return (
                <div key={h.time} className="flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl bg-glass px-3 py-3">
                  <span className="text-sm text-on-sky-muted">{i === 0 ? "Şimdi" : h.time.slice(11, 16)}</span>
                  <span className="bob text-3xl" style={{ animationDelay: `${i * 0.12}s` }}>
                    {!h.isDay && (d.kind === "clear" || d.kind === "partly") ? "🌙" : d.emoji}
                  </span>
                  <span className="text-lg font-semibold">{Math.round(h.temp)}°</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="toy-card p-4">
          <h2 className="mb-2 px-1 text-lg font-semibold">7 Gün</h2>
          <ul>
            {data.daily.map((d, i) => {
              const di = describe(d.code);
              return (
                <li key={d.date} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 capitalize hover:bg-glass">
                  <span className="w-28 font-medium">{dayName(d.date, i)}</span>
                  <span className="text-2xl">{di.emoji}</span>
                  <span className="flex-1 text-sm text-on-sky-muted">{d.pop > 0 ? `☔ %${d.pop}` : ""}</span>
                  <span className="text-on-sky-muted">{Math.round(d.min)}°</span>
                  <span className="w-10 text-right font-semibold">{Math.round(d.max)}°</span>
                </li>
              );
            })}
          </ul>
        </section>
        <p className="text-center text-xs text-on-sky-muted">Veriler: Open-Meteo</p>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="toy-card flex flex-col gap-1 p-4 transition-transform hover:-translate-y-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-on-sky-muted">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

function SearchBar() {
  const navigate = useNavigate({ from: "/" });
  const [q, setQ] = useState("");
  const [locating, setLocating] = useState(false);
  const { data: results = [] } = useQuery({
    queryKey: ["places", q],
    queryFn: () => searchPlaces(q),
    enabled: q.trim().length >= 2,
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        navigate({ search: { lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), name: "Konumum" } });
      },
      () => setLocating(false),
    );
  };

  return (
    <div className="relative flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔎 Şehir ara..."
        className="toy-card w-full px-5 py-3 text-lg text-on-sky outline-none placeholder:text-on-sky-muted focus:bg-glass-strong"
      />
      <button
        onClick={useMyLocation}
        className="toy-card shrink-0 px-4 text-lg font-medium transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        aria-label="Konumumu kullan"
      >
        {locating ? "⏳" : "📍"}<span className="ml-1 hidden sm:inline">Konumum</span>
      </button>
      {results.length > 0 && q && (
        <ul className="toy-card absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden bg-glass-strong p-2">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                className="w-full rounded-xl px-3 py-2 text-left hover:bg-glass"
                onClick={() => {
                  setQ("");
                  navigate({ search: { lat: r.latitude, lon: r.longitude, name: r.name } });
                }}
              >
                <span className="font-semibold">{r.name}</span>
                <span className="text-sm text-on-sky-muted"> {[r.admin1, r.country].filter(Boolean).join(", ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
