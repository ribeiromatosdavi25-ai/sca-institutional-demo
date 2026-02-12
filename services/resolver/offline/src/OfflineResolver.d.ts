import { NormalizedRequest } from '@companion/shared/types';
export interface ResolvedAnswer {
    answer: string;
    confidence: number;
    source: string;
    timestamp_ms: number;
}
export type ResolutionResult = ResolvedAnswer | 'MISS';
export declare class OfflineResolver {
    private readonly budget_ms;
    resolve(request: NormalizedRequest): Promise<ResolutionResult>;
    private resolveTime;
}
