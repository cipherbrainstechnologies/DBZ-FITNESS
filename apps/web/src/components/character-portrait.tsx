'use client';

import { useState } from 'react';

import { characterArtworkSrc } from '@/lib/character-art';

export function CharacterPortrait({
  archetypeKey,
  artworkUrl,
  name,
  className,
}: {
  archetypeKey: string;
  artworkUrl?: string | null;
  name: string;
  className?: string;
}) {
  const primary = characterArtworkSrc({ archetypeKey, artworkUrl });
  const [src, setSrc] = useState(primary || artworkUrl || '');

  if (!src) {
    return <div className={className ? `${className} character-portrait-fallback` : 'character-portrait-fallback'} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote API fallback plus local public PNG
    <img
      className={className ?? 'character-portrait'}
      src={src}
      alt={`${name} — original product artwork`}
      width={640}
      height={853}
      onError={() => {
        if (artworkUrl && src !== artworkUrl) {
          setSrc(artworkUrl);
        }
      }}
    />
  );
}
