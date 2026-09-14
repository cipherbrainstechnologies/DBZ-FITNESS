import type { ImageSourcePropType } from 'react-native';

export function localCharacterArt(archetypeKey: string): ImageSourcePropType | undefined {
  switch (archetypeKey) {
    case 'explorer':
      return require('../../assets/characters/explorer.png');
    case 'strategist':
      return require('../../assets/characters/strategist.png');
    case 'scholar':
      return require('../../assets/characters/scholar.png');
    case 'guardian':
      return require('../../assets/characters/guardian.png');
    case 'titan':
      return require('../../assets/characters/titan.png');
    default:
      return undefined;
  }
}
