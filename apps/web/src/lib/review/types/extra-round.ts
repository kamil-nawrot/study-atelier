import type { RoundEvent } from './round-event.ts';
import type { RoundSymbol } from './round-symbol.ts';
import type { RoundTerm } from './round-term.ts';

export type ExtraRound = { terms: RoundTerm[]; symbols: RoundSymbol[]; events: RoundEvent[] };
