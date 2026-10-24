export const FORMAT_NAME = 'study-atelier';
export const FORMAT_VERSION = 1;
export const DATA_FILE = 'atelier.json';
export const IMAGES_FOLDER = 'images';

export type ExportRow = Record<string, unknown>;

export type AtelierData = Record<string, ExportRow[]>;

export type AtelierFile = {
	format: typeof FORMAT_NAME;
	version: number;
	exportedAt: string;
	data: AtelierData;
};

export type ExportProgress =
	{ step: 'data' } | { step: 'images'; done: number; total: number } | { step: 'archive' };

export type ExportResult = { blob: Blob; name: string; error?: undefined } | { error: string };

export function archiveName(now: Date): string {
	const pad = (value: number): string => String(value).padStart(2, '0');
	return `study-atelier-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.zip`;
}

export function imageEntryName(path: string): string {
	return `${IMAGES_FOLDER}/${path}`;
}
