import type { StoredFlag } from './stored-flag.ts';

export type RestorableFlag = Pick<
	StoredFlag,
	| 'reason'
	| 'comment'
	| 'question'
	| 'artworkId'
	| 'termId'
	| 'symbolId'
	| 'imageId'
	| 'pinId'
	| 'holds'
>;
