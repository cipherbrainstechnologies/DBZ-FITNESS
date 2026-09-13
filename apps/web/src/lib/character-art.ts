/** Same-origin original portraits — not licensed Dragon Ball Z stills. */
export const ORIGINAL_CHARACTER_ART: Record<string, string> = {
  explorer: '/characters/explorer.png',
  strategist: '/characters/strategist.png',
  scholar: '/characters/scholar.png',
  guardian: '/characters/guardian.png',
  titan: '/characters/titan.png',
};

export const ORIGINAL_THEME_INSPIRATION: Record<string, string> = {
  explorer: 'Goku',
  strategist: 'Vegeta',
  scholar: 'Gohan',
  guardian: 'Trunks',
  titan: 'Broly',
};

export function characterArtworkSrc(input: {
  archetypeKey: string;
  artworkUrl?: string | null | undefined;
}): string {
  const local = ORIGINAL_CHARACTER_ART[input.archetypeKey];
  if (local) return local;
  return input.artworkUrl ?? '';
}
