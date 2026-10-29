import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { ValueKind } from '#lib/card-index/types/value-kind.ts';

export type ValueParent = { kind: ValueKind; id: string; name: string; era?: EraCode };
