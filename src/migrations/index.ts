import * as migration_20261024_014342_initial from './20261024_014342_initial';
import * as migration_20261024_055156_artists from './20261024_055156_artists';
import * as migration_20261105_223912_music_features from './20261105_223912_music_features';

export const migrations = [
  {
    up: migration_20261024_014342_initial.up,
    down: migration_20261024_014342_initial.down,
    name: '20261024_014342_initial',
  },
  {
    up: migration_20261024_055156_artists.up,
    down: migration_20261024_055156_artists.down,
    name: '20261024_055156_artists',
  },
  {
    up: migration_20261105_223912_music_features.up,
    down: migration_20261105_223912_music_features.down,
    name: '20261105_223912_music_features'
  },
];
