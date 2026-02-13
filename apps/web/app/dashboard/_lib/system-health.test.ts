import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSystemHealthMachine, getSystemHealthMachine } from './system-health';

const okResponse = (status = 'ok') => ({
  ok: true,
  status: 200,
  json: async () => ({ status }),
});

const serverErrorResponse = (status = 500) => ({
  ok: false,
  status,
  json: async () => ({}),
});

describe('system health state machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-13T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts online and does not switch offline before polling', () => {
    const machine = createSystemHealthMachine({
      fetchFn: vi.fn(async () => okResponse()),
    });

    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getSnapshot().lastCheckedAt).toBeNull();
    expect(machine.getDebugState().consecutiveFailures).toBe(0);
  });

  it('stays online on successful fast health check and resets failure counter', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(okResponse());
    const machine = createSystemHealthMachine({ fetchFn });

    await machine.pollNow();
    expect(machine.getDebugState().consecutiveFailures).toBe(1);

    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getDebugState().consecutiveFailures).toBe(0);
    expect(machine.getSnapshot().latencyMs).toBeLessThan(1200);
  });

  it('transitions to degraded on slow successful response without going offline', async () => {
    const fetchFn = vi.fn(
      () =>
        new Promise<ReturnType<typeof okResponse>>((resolve) => {
          setTimeout(() => resolve(okResponse()), 1300);
        })
    );
    const machine = createSystemHealthMachine({ fetchFn });

    const poll = machine.pollNow();
    await vi.advanceTimersByTimeAsync(1300);
    await poll;

    expect(machine.getSnapshot().state).toBe('degraded');
    expect(machine.getSnapshot().latencyMs).toBeGreaterThan(1200);
    expect(machine.getDebugState().consecutiveFailures).toBe(0);
  });

  it('keeps online on a single network failure and increments failure count', async () => {
    const machine = createSystemHealthMachine({
      fetchFn: vi.fn(async () => {
        throw new Error('network down');
      }),
    });

    await machine.pollNow();

    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getDebugState().consecutiveFailures).toBe(1);
  });

  it('goes offline after 3 consecutive failures when debounce is disabled and logs once', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const machine = createSystemHealthMachine({
      fetchFn: vi.fn(async () => {
        throw new Error('network down');
      }),
      offlineDebounceMs: 0,
    });

    await machine.pollNow();
    await machine.pollNow();
    await machine.pollNow();

    expect(machine.getSnapshot().state).toBe('offline');
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]?.[0]).toContain('online -> offline');
  });

  it('logs transitions only, not repeated emissions of the same state', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const machine = createSystemHealthMachine({
      fetchFn: vi.fn(async () => {
        throw new Error('network down');
      }),
      offlineDebounceMs: 0,
    });

    await machine.pollNow();
    await machine.pollNow();
    await machine.pollNow();
    await machine.pollNow();
    await machine.pollNow();

    expect(machine.getSnapshot().state).toBe('offline');
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('recovers from offline to online after successful health check and resets failures', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(okResponse());
    const machine = createSystemHealthMachine({
      fetchFn,
      offlineDebounceMs: 0,
    });

    await machine.pollNow();
    await machine.pollNow();
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('offline');

    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getDebugState().consecutiveFailures).toBe(0);
    expect(infoSpy.mock.calls.some(([msg]) => String(msg).includes('offline -> online'))).toBe(
      true
    );
  });

  it('treats HTTP 500 as failure and applies debounce before offline transition', async () => {
    const machine = createSystemHealthMachine({
      fetchFn: vi.fn(async () => serverErrorResponse(500)),
      maxConsecutiveFailures: 99,
      offlineDebounceMs: 8000,
    });

    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getDebugState().consecutiveFailures).toBe(1);

    await vi.advanceTimersByTimeAsync(8000);
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('offline');
  });

  it('does not flip offline during a short failure burst shorter than debounce window', async () => {
    const machine = createSystemHealthMachine({
      fetchFn: vi.fn(async () => {
        throw new Error('network down');
      }),
      offlineDebounceMs: 8000,
    });

    await machine.pollNow();
    await machine.pollNow();
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');

    await vi.advanceTimersByTimeAsync(7999);
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');

    await vi.advanceTimersByTimeAsync(1);
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('offline');
  });

  it('counts request timeout (AbortController) as a failure', async () => {
    const fetchFn = vi.fn(
      (_input: string, init?: RequestInit) =>
        new Promise<never>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          signal?.addEventListener('abort', () => {
            const abortError = new Error('aborted');
            (abortError as Error & { name: string }).name = 'AbortError';
            reject(abortError);
          });
        })
    );
    const machine = createSystemHealthMachine({ fetchFn });

    const poll = machine.pollNow();
    await vi.advanceTimersByTimeAsync(5000);
    await poll;

    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getDebugState().consecutiveFailures).toBe(1);
  });

  it('ignores external AbortError that is not caused by machine timeout', async () => {
    const fetchFn = vi.fn(async () => {
      const abortError = new Error('aborted');
      (abortError as Error & { name: string }).name = 'AbortError';
      throw abortError;
    });
    const machine = createSystemHealthMachine({ fetchFn });

    await machine.pollNow();

    expect(machine.getSnapshot().state).toBe('online');
    expect(machine.getDebugState().consecutiveFailures).toBe(0);
  });

  it('prevents offline flicker during rapid success/failure toggling', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(okResponse())
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(okResponse())
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(okResponse());
    const machine = createSystemHealthMachine({
      fetchFn,
      offlineDebounceMs: 0,
    });

    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
    await machine.pollNow();
    expect(machine.getSnapshot().state).toBe('online');
  });

  it('returns the same global machine instance across calls', () => {
    const one = getSystemHealthMachine();
    const two = getSystemHealthMachine();
    expect(one).toBe(two);
  });
});
