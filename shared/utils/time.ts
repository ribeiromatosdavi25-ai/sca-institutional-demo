export const TimeUtils = {
  nowISO(): string {
    return new Date().toISOString();
  },

  deltaSeconds(from: Date, to: Date = new Date()): number {
    const deltaMs = to.getTime() - from.getTime();
    return Math.max(0, Math.floor(deltaMs / 1000));
  },
};
