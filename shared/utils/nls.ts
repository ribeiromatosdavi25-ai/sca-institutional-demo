import { HashUtils } from './hash';

export type LanguageCode = 'en' | 'es';

export type WeatherData = {
  location: string;
  temperature_c: number;
  weather_code: number;
};

export type TimeData = {
  location: string;
  timezone: string;
  datetime_iso: string;
};

export type FactualData = {
  text: string;
  value?: string | number;
};

const pickVariant = (seed: string, variants: string[]) => {
  const hash = HashUtils.sha256(seed);
  const number = parseInt(hash.slice(0, 8), 16);
  return variants[number % variants.length];
};

const weatherCodeToText = (code: number, lang: LanguageCode): string => {
  const es = {
    clear: 'Despejado',
    partly: 'Parcialmente nublado',
    cloudy: 'Nublado',
    fog: 'Niebla',
    drizzle: 'Llovizna',
    snow: 'Nieve',
    rain: 'Lluvia',
    storm: 'Tormenta',
    weather: 'Clima',
  };
  const en = {
    clear: 'Clear',
    partly: 'Partly cloudy',
    cloudy: 'Cloudy',
    fog: 'Fog',
    drizzle: 'Drizzle',
    snow: 'Snow',
    rain: 'Rain',
    storm: 'Thunderstorm',
    weather: 'Weather',
  };
  const dict = lang === 'es' ? es : en;
  if (code === 0) return dict.clear;
  if (code === 1 || code === 2) return dict.partly;
  if (code === 3) return dict.cloudy;
  if (code === 45 || code === 48) return dict.fog;
  if (code >= 51 && code <= 67) return dict.drizzle;
  if (code >= 71 && code <= 77) return dict.snow;
  if (code >= 80 && code <= 82) return dict.rain;
  if (code >= 95) return dict.storm;
  return dict.weather;
};

export const LanguageComposer = {
  composeWeather(data: WeatherData, lang: LanguageCode, seed: string): string {
    const description = weatherCodeToText(data.weather_code, lang);
    if (lang === 'es') {
      const variants = [
        `El clima en ${data.location} ahora mismo es ${description}, con ${data.temperature_c}°C.`,
        `Ahora en ${data.location} está ${description} y la temperatura es ${data.temperature_c}°C.`,
        `En ${data.location} se siente ${description}; temperatura actual ${data.temperature_c}°C.`,
      ];
      return pickVariant(seed, variants);
    }
    const variants = [
      `The weather right now in ${data.location} is ${description}, with ${data.temperature_c}°C.`,
      `It is ${description} in ${data.location} right now, at ${data.temperature_c}°C.`,
      `Currently in ${data.location}, it's ${description} and ${data.temperature_c}°C.`,
    ];
    return pickVariant(seed, variants);
  },

  composeTime(data: TimeData, lang: LanguageCode, seed: string): string {
    const time = new Date(data.datetime_iso);
    const formatted = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: lang === 'en',
      timeZone: data.timezone,
    }).format(time);

    if (lang === 'es') {
      const variants = [
        `En ${data.location} ahora son las ${formatted}.`,
        `La hora actual en ${data.location} es ${formatted}.`,
        `Ahora mismo, ${data.location} tiene la hora ${formatted}.`,
      ];
      return pickVariant(seed, variants);
    }
    const variants = [
      `The time in ${data.location} right now is ${formatted}.`,
      `It is currently ${formatted} in ${data.location}.`,
      `Right now, ${data.location} is at ${formatted}.`,
    ];
    return pickVariant(seed, variants);
  },

  composeFactual(data: FactualData, lang: LanguageCode, seed: string): string {
    const valueText = data.value !== undefined ? String(data.value) : data.text;
    if (lang === 'es') {
      const variants = [
        `Respuesta: ${valueText}.`,
        `Aquí tienes: ${valueText}.`,
        `Dato: ${valueText}.`,
      ];
      return pickVariant(seed, variants);
    }
    const variants = [
      `Answer: ${valueText}.`,
      `Here you go: ${valueText}.`,
      `Fact: ${valueText}.`,
    ];
    return pickVariant(seed, variants);
  },
};
