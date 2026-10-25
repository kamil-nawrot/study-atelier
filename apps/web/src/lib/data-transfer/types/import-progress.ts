export type ImportProgress =
	{ step: 'reading' } | { step: 'images'; done: number; total: number } | { step: 'saving' };
