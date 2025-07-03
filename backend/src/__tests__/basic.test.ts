// Basic test to ensure testing framework works
describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
}); 