export default {
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts', 'apps/web/app/**/*.test.ts'],
    clearMocks: true,
  },
};
