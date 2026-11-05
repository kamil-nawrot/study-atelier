import type { ReviewMode } from './review-mode.ts';
import type { SessionCardRow } from './session-card-row.ts';
import type { SessionOptionRow } from './session-option-row.ts';
import type { SessionPinRow } from './session-pin-row.ts';

export type SessionRow =
	| {
			artwork_id: string;
			mode: ReviewMode;
			options?: SessionOptionRow[];
			pin?: SessionPinRow;
	  }
	| { artwork_id: string; mode: 'year'; card: SessionCardRow | null }
	| { mode: 'order'; artwork_ids: string[] };
