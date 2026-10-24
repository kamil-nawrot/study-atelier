export type ExportProgress =
	{ step: 'data' } | { step: 'images'; done: number; total: number } | { step: 'archive' };
