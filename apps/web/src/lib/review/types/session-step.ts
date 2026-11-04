import type { DefinitionItem } from './definition-item.ts';
import type { NoteGapItem } from './note-gap-item.ts';
import type { OrderItem } from './order-item.ts';
import type { ReviewItem } from './review-item.ts';
import type { YearItem } from './year-item.ts';

export type SessionStep = ReviewItem | DefinitionItem | NoteGapItem | YearItem | OrderItem;
