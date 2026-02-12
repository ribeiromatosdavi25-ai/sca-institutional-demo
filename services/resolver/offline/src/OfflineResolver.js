"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineResolver = void 0;
class OfflineResolver {
    budget_ms = 80;
    async resolve(request) {
        const start = Date.now();
        // Time queries - fully offline
        if (request.intent_hints.includes('time')) {
            const answer = this.resolveTime();
            if (answer)
                return answer;
        }
        // Budget check
        if (Date.now() - start > this.budget_ms) {
            return 'MISS';
        }
        return 'MISS';
    }
    resolveTime() {
        const now = new Date();
        return {
            answer: `Current time: ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}`,
            confidence: 1.0,
            source: 'offline.system_clock',
            timestamp_ms: Date.now(),
        };
    }
}
exports.OfflineResolver = OfflineResolver;
