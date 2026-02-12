import { NormalizedRequest } from '@companion/shared/types';
import { ResolutionResult } from '@companion/resolver-offline';
export declare class ExternalResolver {
    private readonly budget_ms;
    private readonly timeout_ms;
    resolve(request: NormalizedRequest): Promise<ResolutionResult>;
    private fetchWeatherLive;
}
