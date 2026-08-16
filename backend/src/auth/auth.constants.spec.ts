import { durationToMilliseconds } from './auth.constants';

describe('durationToMilliseconds', () => {
  it.each([
    ['10m', 600_000],
    ['12h', 43_200_000],
    ['30d', 2_592_000_000],
  ])('parses %s', (value, expected) => {
    expect(durationToMilliseconds(value)).toBe(expected);
  });

  it('rejects ambiguous duration values', () => {
    expect(() => durationToMilliseconds('3600')).toThrow('Invalid duration');
  });
});
