import * as migration_20260708_011402 from './20260708_011402';

export const migrations = [
  {
    up: migration_20260708_011402.up,
    down: migration_20260708_011402.down,
    name: '20260708_011402'
  },
];
