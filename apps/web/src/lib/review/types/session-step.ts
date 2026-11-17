import type { DefinitionItem } from './definition-item.ts';
import type { EventItem } from './event-item.ts';
import type { NoteGapItem } from './note-gap-item.ts';
import type { OrderItem } from './order-item.ts';
import type { PairItem } from './pair-item.ts';
import type { RelationItem } from './relation-item.ts';
import type { ReviewItem } from './review-item.ts';
import type { SymbolItem } from './symbol-item.ts';
import type { YearItem } from './year-item.ts';

export type SessionStep =
	| ReviewItem
	| DefinitionItem
	| SymbolItem
	| NoteGapItem
	| PairItem
	| RelationItem
	| YearItem
	| OrderItem
	| EventItem;
