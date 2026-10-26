export type SceneKind = "clear" | "partly" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export interface Forecast {
  current: {
    temp: number;
    feels: number;
    humidity: number;
    wind: number;
    code: number;
    isDay: boolean;
    time: string;
  };
  hourly: { time: string; temp: number; code: number; pop: number; isDay: boolean }[];
  daily: { date: string; max: number; min: number; code: number; pop: number }[];
}

export interface Place {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export function describe(code: number): { kind: SceneKind; label: string; emoji: string } {
  if (code === 0) return { kind: "clear", label: "Açık", emoji: "☀️" };
  if (code === 1) return { kind: "partly", label: "Çoğunlukla açık", emoji: "🌤️" };
  if (code === 2) return { kind: "partly", label: "Parçalı bulutlu", emoji: "⛅" };
  if (code === 3) return { kind: "cloudy", label: "Kapalı", emoji: "☁️" };
  if (code === 45 || code === 48) return { kind: "fog", label: "Sisli", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { kind: "rain", label: "Çisenti", emoji: "🌦️" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { kind: "rain", label: code >= 80 ? "Sağanak" : "Yağmurlu", emoji: "🌧️" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { kind: "snow", label: "Karlı", emoji: "❄️" };
  if (code >= 95) return { kind: "storm", label: "Fırtına", emoji: "⛈️" };
  return { kind: "cloudy", label: "Bulutlu", emoji: "☁️" };
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code,precipitation_probability,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Hava durumu alınamadı");
  const d = await res.json();
  const nowIdx = Math.max(0, d.hourly.time.findIndex((t: string) => t >= d.current.time.slice(0, 13)));
  return {
    current: {
      temp: d.current.temperature_2m,
      feels: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      wind: d.current.wind_speed_10m,
      code: d.current.weather_code,
      isDay: d.current.is_day === 1,
      time: d.current.time,
    },
    hourly: d.hourly.time.slice(nowIdx, nowIdx + 24).map((t: string, i: number) => ({
      time: t,
      temp: d.hourly.temperature_2m[nowIdx + i],
      code: d.hourly.weather_code[nowIdx + i],
      pop: d.hourly.precipitation_probability[nowIdx + i] ?? 0,
      isDay: d.hourly.is_day[nowIdx + i] === 1,
    })),
    daily: d.daily.time.map((t: string, i: number) => ({
      date: t,
      max: d.daily.temperature_2m_max[i],
      min: d.daily.temperature_2m_min[i],
      code: d.daily.weather_code[i],
      pop: d.daily.precipitation_probability_max[i] ?? 0,
    })),
  };
}

export async function searchPlaces(q: string): Promise<Place[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=tr`,
  );
  if (!res.ok) return [];
  const d = await res.json();
  return d.results ?? [];
}
