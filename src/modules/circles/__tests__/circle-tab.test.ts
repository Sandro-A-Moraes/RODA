import { parseCircleTab } from '../presentation/circle-tab';

describe('parseCircleTab (CIR-01 show the invite code after creating)', () => {
  it.each(['pacts', 'stories', 'meetups', 'members'] as const)(
    'keeps the known tab %p',
    (tab) => {
      expect(parseCircleTab(tab)).toBe(tab);
    },
  );

  it.each([undefined, '', 'Members', 'admin'])(
    'falls back to pacts for %p',
    (value) => {
      expect(parseCircleTab(value)).toBe('pacts');
    },
  );
});
