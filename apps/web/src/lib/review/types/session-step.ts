import type { DefinitionItem } from './definition-item.ts';
import type { ReviewItem } from './review-item.ts';
import type { YearItem } from './year-item.ts';

export type SessionStep = ReviewItem | DefinitionItem | YearItem;
