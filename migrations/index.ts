import * as migration_20260708_011402 from './20260708_011402';
import * as migration_20260717_065519 from './20260717_065519';

// Payloadは上から順番に未適用migrationを実行するため、作成日時順を維持します。
export const migrations = [
  {
    up: migration_20260708_011402.up,
    down: migration_20260708_011402.down,
    name: '20260708_011402',
  },
  {
    up: migration_20260717_065519.up,
    down: migration_20260717_065519.down,
    name: '20260717_065519'
  },
];
