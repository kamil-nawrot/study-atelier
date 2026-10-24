import { strFromU8, unzipSync } from 'fflate';
import {
	DATA_FILE,
	FORMAT_NAME,
	FORMAT_VERSION,
	imageEntryName,
	type AtelierData,
	type AtelierFile
} from '#lib/data-transfer/format/format.ts';

export type ParseFailure = 'notZip' | 'noData' | 'notAtelier' | 'newer' | 'broken';

export type ParsedArchive = {
	file: AtelierFile;
	images: Map<string, Uint8Array>;
};

export type ParseResult = { archive: ParsedArchive } | { failure: ParseFailure };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function dataOf(value: unknown): AtelierData | undefined {
	if (!isRecord(value)) return undefined;
	const data: AtelierData = {};
	for (const [table, rows] of Object.entries(value)) {
		if (!Array.isArray(rows) || !rows.every(isRecord)) return undefined;
		data[table] = rows;
	}
	return data;
}

export function parseArchive(bytes: Uint8Array): ParseResult {
	let entries: Record<string, Uint8Array>;
	try {
		entries = unzipSync(bytes);
	} catch {
		return { failure: 'notZip' };
	}
	const text = entries[DATA_FILE];
	if (!text) return { failure: 'noData' };

	let parsed: unknown;
	try {
		parsed = JSON.parse(strFromU8(text));
	} catch {
		return { failure: 'broken' };
	}
	if (!isRecord(parsed) || parsed.format !== FORMAT_NAME) return { failure: 'notAtelier' };
	if (
		typeof parsed.version !== 'number' ||
		!Number.isInteger(parsed.version) ||
		parsed.version < 1
	) {
		return { failure: 'broken' };
	}
	if (parsed.version > FORMAT_VERSION) return { failure: 'newer' };
	const data = dataOf(parsed.data);
	if (!data) return { failure: 'broken' };

	const images = new Map<string, Uint8Array>();
	for (const [name, content] of Object.entries(entries)) {
		const prefix = imageEntryName('');
		if (name.startsWith(prefix)) images.set(name.slice(prefix.length), content);
	}
	return {
		archive: {
			file: {
				format: FORMAT_NAME,
				version: parsed.version,
				exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
				data
			},
			images
		}
	};
}
