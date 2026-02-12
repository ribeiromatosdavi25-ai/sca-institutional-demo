import { NormalizedRequest } from '@companion/shared/types';
import { HashUtils } from '@companion/shared/utils/hash';

export class Normalizer {
  static normalize(rawMessage: string): NormalizedRequest {
    const text = rawMessage.trim();
    const language = this.detectLanguage(text);
    const intent_hints = this.extractIntentHints(text);

    return {
      request_hash: HashUtils.sha256(text),
      trace_id: HashUtils.generateTraceId(),
      text,
      language,
      intent_hints,
      timestamp_ms: Date.now(),
    };
  }

  private static detectLanguage(text: string): string {
    // Simple heuristic; expand as needed
    if (/[¿¡ñáéíóú]/i.test(text)) return 'es';
    if (/\b(clima|tiempo|hoy|ahora|temperatura|lluvia|sol|nublado|hora|reloj|donde|estoy|que|hace)\b/i.test(text)) return 'es';
    return 'en';
  }

  private static extractIntentHints(text: string): string[] {
    const hints: string[] = [];
    const lower = text.toLowerCase();

    if (/\b(weather|forecast|temperature|clima|tiempo|lluvia|sol)\b/.test(lower)) hints.push('weather');
    if (/\b(time|clock|timezone|hour|hora|reloj)\b/.test(lower)) hints.push('time');
    if (/\b(remember|recall|memory)\b/.test(lower)) hints.push('memory');

    return hints;
  }
}
