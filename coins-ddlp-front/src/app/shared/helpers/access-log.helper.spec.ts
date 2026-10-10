import { formatDuration, formatLocation, getPeriodStart } from './access-log.helper';

describe('access-log.helper', () => {
  it('formatDuration', () => {
    expect(formatDuration(0)).toBe('0 s');
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(60)).toBe('1 min');
    expect(formatDuration(200)).toBe('3 min 20 s');
    expect(formatDuration(3900)).toBe('1 h 05 min');
    expect(formatDuration(-5)).toBe('0 s');
  });

  it('getPeriodStart', () => {
    const now = new Date(2026, 9, 10, 15, 30);
    const today = new Date(getPeriodStart('today', now));
    expect([today.getDate(), today.getHours(), today.getMinutes()]).toEqual([10, 0, 0]);
    expect(new Date(getPeriodStart('7d', now)).getDate()).toBe(3);
  });

  it('formatLocation', () => {
    expect(formatLocation({ city: 'Madrid', region: 'Madrid', country: 'Spain' })).toBe(
      'Madrid, Spain',
    );
    expect(formatLocation({ city: null, region: null, country: 'Spain' })).toBe('Spain');
    expect(formatLocation({ city: null, region: null, country: null })).toBeNull();
  });
});
