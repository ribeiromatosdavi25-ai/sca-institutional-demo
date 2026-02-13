'use client';

import { useSyncExternalStore } from 'react';

export type HealthVisualState = 'online' | 'degraded' | 'offline';

export type HealthSnapshot = {
  state: HealthVisualState;
  lastCheckedAt: string | null;
  latencyMs: number | null;
};

type HealthErrorKind = 'http' | 'network';

type HealthCheckError = Error & {
  kind: HealthErrorKind;
  status?: number;
};

type HealthResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<{ status?: string }>;
};

type MachineOptions = {
  pollIntervalMs: number;
  requestTimeoutMs: number;
  maxConsecutiveFailures: number;
  networkFailureGraceMs: number;
  offlineDebounceMs: number;
  degradedLatencyMs: number;
  fetchFn: (input: string, init?: RequestInit) => Promise<HealthResponse>;
  nowFn: () => number;
  setIntervalFn: typeof setInterval;
  clearIntervalFn: typeof clearInterval;
  logFn: (message: string) => void;
};

type HealthDebugState = {
  consecutiveFailures: number;
  firstNetworkFailureAt: number | null;
  offlineCandidateAt: number | null;
};

const DEFAULTS = {
  pollIntervalMs: 20000,
  requestTimeoutMs: 5000,
  maxConsecutiveFailures: 3,
  networkFailureGraceMs: 10000,
  offlineDebounceMs: 8000,
  degradedLatencyMs: 1200,
} satisfies Omit<
  MachineOptions,
  'fetchFn' | 'nowFn' | 'setIntervalFn' | 'clearIntervalFn' | 'logFn'
>;

export function createSystemHealthMachine(customOptions: Partial<MachineOptions> = {}) {
  const options: MachineOptions = {
    ...DEFAULTS,
    fetchFn: (input, init) => fetch(input, init) as Promise<HealthResponse>,
    nowFn: () => Date.now(),
    setIntervalFn: setInterval,
    clearIntervalFn: clearInterval,
    logFn: (message) => console.info(message),
    ...customOptions,
  };

  let snapshot: HealthSnapshot = {
    state: 'online',
    lastCheckedAt: null,
    latencyMs: null,
  };

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let isPolling = false;
  let consecutiveFailures = 0;
  let firstNetworkFailureAt: number | null = null;
  let offlineCandidateAt: number | null = null;

  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const logTransition = (nextState: HealthVisualState, reason: string) => {
    if (snapshot.state !== nextState) {
      options.logFn(`[system-health] ${snapshot.state} -> ${nextState} (${reason})`);
    }
  };

  const commitState = (nextState: HealthVisualState, reason: string, latencyMs: number | null) => {
    logTransition(nextState, reason);
    snapshot = {
      state: nextState,
      lastCheckedAt: new Date(options.nowFn()).toISOString(),
      latencyMs,
    };
    emit();
  };

  const classifyError = (err: unknown) => {
    const error = err as Partial<HealthCheckError>;
    const statusCode = typeof error.status === 'number' ? error.status : null;
    const isNetworkError =
      error.kind === 'network' ||
      error.name === 'AbortError' ||
      (statusCode === null && error.kind !== 'http');
    return { statusCode, isNetworkError };
  };

  const resetFailureState = () => {
    consecutiveFailures = 0;
    firstNetworkFailureAt = null;
    offlineCandidateAt = null;
  };

  const fetchHealth = async () => {
    const controller = new AbortController();
    let timeoutTriggered = false;
    const timeout = setTimeout(() => {
      timeoutTriggered = true;
      controller.abort();
    }, options.requestTimeoutMs);
    const startedAt = options.nowFn();

    try {
      const response = await options.fetchFn('/api/health', {
        cache: 'no-store',
        signal: controller.signal,
      });
      const latencyMs = options.nowFn() - startedAt;

      if (!response.ok) {
        const error = new Error(`Health check failed: ${response.status}`) as HealthCheckError;
        error.kind = 'http';
        error.status = response.status;
        throw error;
      }

      const payload = await response.json();
      if (payload.status !== 'ok') {
        const error = new Error('Health check returned invalid status') as HealthCheckError;
        error.kind = 'http';
        error.status = 500;
        throw error;
      }

      resetFailureState();

      const nextState: HealthVisualState =
        latencyMs > options.degradedLatencyMs ? 'degraded' : 'online';
      commitState(nextState, nextState === 'degraded' ? 'high latency' : 'healthy', latencyMs);
    } catch (err) {
      const now = options.nowFn();
      const maybeError = err as Partial<Error>;
      if (maybeError?.name === 'AbortError' && !timeoutTriggered) {
        return;
      }

      const { statusCode, isNetworkError } = classifyError(err);

      consecutiveFailures += 1;
      offlineCandidateAt = offlineCandidateAt ?? now;

      if (isNetworkError) {
        firstNetworkFailureAt = firstNetworkFailureAt ?? now;
      } else {
        firstNetworkFailureAt = null;
      }

      const networkFailurePersisted =
        firstNetworkFailureAt !== null &&
        now - firstNetworkFailureAt >= options.networkFailureGraceMs;

      const shouldGoOffline =
        consecutiveFailures >= options.maxConsecutiveFailures ||
        (statusCode !== null && statusCode >= 500) ||
        networkFailurePersisted;

      if (!shouldGoOffline) {
        return;
      }

      if (now - offlineCandidateAt < options.offlineDebounceMs) {
        return;
      }

      const reason =
        statusCode !== null && statusCode >= 500
          ? `server error ${statusCode}`
          : networkFailurePersisted
            ? 'network failure persisted'
            : `consecutive failures (${consecutiveFailures})`;

      commitState('offline', reason, null);
    } finally {
      clearTimeout(timeout);
    }
  };

  const ensurePollingStarted = () => {
    if (isPolling) {
      return;
    }
    isPolling = true;
    void fetchHealth();
    pollTimer = options.setIntervalFn(() => {
      void fetchHealth();
    }, options.pollIntervalMs);
  };

  const stop = () => {
    if (pollTimer) {
      options.clearIntervalFn(pollTimer);
      pollTimer = null;
    }
    isPolling = false;
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      ensurePollingStarted();
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    getDebugState(): HealthDebugState {
      return {
        consecutiveFailures,
        firstNetworkFailureAt,
        offlineCandidateAt,
      };
    },
    pollNow() {
      return fetchHealth();
    },
    stop,
  };
}

type GlobalSystemHealth = {
  __scaSystemHealthMachine?: ReturnType<typeof createSystemHealthMachine>;
};

function getGlobalScope(): GlobalSystemHealth | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  return globalThis as GlobalSystemHealth;
}

export function getSystemHealthMachine() {
  const scope = getGlobalScope();
  if (!scope) {
    return createSystemHealthMachine();
  }
  if (!scope.__scaSystemHealthMachine) {
    scope.__scaSystemHealthMachine = createSystemHealthMachine();
  }
  return scope.__scaSystemHealthMachine;
}

const defaultMachine = getSystemHealthMachine();

export function useSystemHealth() {
  return useSyncExternalStore(
    defaultMachine.subscribe,
    defaultMachine.getSnapshot,
    defaultMachine.getSnapshot
  );
}
