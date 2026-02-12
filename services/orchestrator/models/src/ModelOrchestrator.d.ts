import { ExecutionContract, ClaudeOutput } from '@companion/shared/types';
export declare class ModelOrchestrator {
    private client;
    private readonly budget_ms;
    constructor(apiKey: string);
    execute(contract: ExecutionContract, userQuery: string, safeContext?: Record<string, any>): Promise<ClaudeOutput>;
    private repairRetry;
    private buildSystemPrompt;
    private buildUserPrompt;
}
