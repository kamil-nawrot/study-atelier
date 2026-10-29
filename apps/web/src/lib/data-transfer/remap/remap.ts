import {
	OWN_IMAGE_EXTENSIONS,
	ownThumbnailPath,
	type OwnImageType
} from '#lib/images/bucket/bucket.ts';
import type { AtelierData } from '#lib/data-transfer/types/atelier-data.ts';
import type { ExportRow } from '#lib/data-transfer/types/export-row.ts';
import { UUID_PATTERN } from '#lib/shared/utils/ids/ids.ts';
import type { Upload } from '#lib/data-transfer/types/upload.ts';

export const IMPORT_TABLES = [
	'artworks',
	'artwork_images',
	'glossary_entries',
	'artwork_pins',
	'artwork_fields',
	'category_values',
	'artwork_values',
	'period_eras',
	'style_periods',
	'author_details',
	'period_details',
	'style_details',
	'material_details',
	'location_details',
	'era_details',
	'artwork_field_entries',
	'timeline_events',
	'visits',
	'visit_artworks',
	'review_cards',
	'review_log',
	'point_events'
] as const;

const UUID = new RegExp(UUID_PATTERN, 'g');
const IMAGE_PATH_TABLES = ['artworks', 'artwork_images', 'author_details'];

type Remapped = {
	payload: Record<string, ExportRow[]>;
	uploads: Upload[];
};

const TYPE_OF_EXTENSION = Object.fromEntries(
	Object.entries(OWN_IMAGE_EXTENSIONS).map(([type, extension]) => [extension, type])
) as Record<string, OwnImageType>;

function extensionOf(path: string): string {
	const dot = path.lastIndexOf('.');
	return dot > path.lastIndexOf('/') ? path.slice(dot + 1).toLowerCase() : '';
}

function ownIdOf(row: ExportRow): string | undefined {
	return typeof row.id === 'string' && /^[0-9a-f-]{36}$/.test(row.id) ? row.id : undefined;
}

export function remapAtelier(
	data: AtelierData,
	images: ReadonlyMap<string, Uint8Array>,
	ownerId: string,
	newId: () => string = () => crypto.randomUUID()
): Remapped {
	const ids = new Map<string, string>();
	for (const table of IMPORT_TABLES) {
		for (const row of data[table] ?? []) {
			const id = ownIdOf(row);
			if (id && !ids.has(id)) ids.set(id, newId());
		}
	}

	const paths = new Map<string, string>();
	const uploads: Upload[] = [];
	const claim = (path: string): string => {
		const known = paths.get(path);
		if (known) return known;
		const extension = extensionOf(path);
		const next = `${ownerId}/${newId()}${extension ? `.${extension}` : ''}`;
		paths.set(path, next);
		const original = images.get(path);
		if (original) {
			uploads.push({
				path: next,
				bytes: original,
				contentType: TYPE_OF_EXTENSION[extension] ?? 'application/octet-stream'
			});
		}
		const thumbnail = images.get(ownThumbnailPath(path));
		if (thumbnail) {
			uploads.push({
				path: ownThumbnailPath(next),
				bytes: thumbnail,
				contentType: 'image/jpeg'
			});
		}
		return next;
	};

	const tables: Record<string, ExportRow[]> = {};
	for (const table of IMPORT_TABLES) {
		tables[table] = (data[table] ?? []).map((row) => {
			if (!IMAGE_PATH_TABLES.includes(table)) return row;
			const path = row.own_image_path;
			return typeof path === 'string' && path !== ''
				? { ...row, own_image_path: claim(path) }
				: row;
		});
	}

	const text = JSON.stringify(tables).replace(UUID, (id) => ids.get(id) ?? id);
	return { payload: JSON.parse(text) as Record<string, ExportRow[]>, uploads };
}
