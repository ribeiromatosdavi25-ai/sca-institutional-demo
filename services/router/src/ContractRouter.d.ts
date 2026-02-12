import { ExecutionContract, NormalizedRequest } from '@companion/shared/types';
export interface RouterOptions {
    devModeAllowed?: boolean;
}
export declare class ContractRouter {
    route(request: NormalizedRequest, sessionStart: Date, lastTurn: Date | null, options?: RouterOptions): ExecutionContract;
    private determinePath;
    private isOfflineCapable;
    private isCacheablePublic;
    private requiresPrivateData;
    private computeRisk;
    private selectFallback;
    private explainDecision;
}
