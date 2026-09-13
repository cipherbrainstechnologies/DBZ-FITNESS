const KEYS = ['explorer', 'strategist', 'scholar', 'guardian', 'titan'] as const;

/** Marketing strip of original product portraits — not licensed stills. */
export function CharacterStrip() {
  return (
    <ul className="character-strip" aria-hidden="true">
      {KEYS.map((key) => (
        <li key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/characters/${key}.png`} alt="" width={240} height={320} />
        </li>
      ))}
    </ul>
  );
}
