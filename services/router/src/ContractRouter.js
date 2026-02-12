"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractRouter = void 0;
const time_1 = require("@companion/shared/utils/time");
class ContractRouter {
    route(request, sessionStart, lastTurn, options = {}) {
        const path = this.determinePath(request, options);
        const risk_score = this.computeRisk(request);
        return {
            contract_version: '0.1',
            time_anchor: {
                now_iso: time_1.TimeUtils.nowISO(),
                session_age_s: time_1.TimeUtils.deltaSeconds(sessionStart),
                last_turn_delta_s: lastTurn ? time_1.TimeUtils.deltaSeconds(lastTurn) : 0,
            },
            path,
            risk_score,
            max_tokens: path === 'MODEL' ? 2048 : 0,
            allowed_tools: ['none'],
            confined_access: {
                allowed: false,
                allowed_rpcs: [],
            },
            fallback_id: this.selectFallback(path, risk_score),
            trace: {
                decision_reason: this.explainDecision(path, request, options.devModeAllowed),
            },
        };
    }
    determinePath(request, options) {
        // Offline-first heuristic
        if (this.isOfflineCapable(request))
            return 'OFFLINE';
        // Dev mode: allow external APIs
        if (options.devModeAllowed && this.isCacheablePublic(request)) {
            return 'EXTERNAL_API';
        }
        if (this.isCacheablePublic(request))
            return 'SAFE_CACHE';
        if (this.requiresPrivateData(request))
            return 'DENY';
        return 'MODEL';
    }
    isOfflineCapable(request) {
        return request.intent_hints.includes('time');
    }
    isCacheablePublic(request) {
        return request.intent_hints.includes('weather');
    }
    requiresPrivateData(request) {
        return request.intent_hints.includes('memory');
    }
    computeRisk(request) {
        if (this.requiresPrivateData(request))
            return 1.0;
        return 0.0;
    }
    selectFallback(path, risk) {
        if (risk >= 0.8)
            return 'FALLBACK_DENY_PRIVATE';
        if (path === 'SAFE_CACHE' || path === 'EXTERNAL_API')
            return 'FALLBACK_STALE_CACHE';
        return 'FALLBACK_PUBLIC_SAFE';
    }
    explainDecision(path, request, devMode) {
        const prefix = devMode ? 'dev_mode.' : '';
        return `${prefix}router.${path.toLowerCase()}.${request.intent_hints[0] || 'default'}`;
    }
}
exports.ContractRouter = ContractRouter;
