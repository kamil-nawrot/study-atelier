import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

type SourceColumns = {
	source_title: string | null;
	source_url: string | null;
	source_licence: string | null;
	source_fetched_on: string | null;
};

export function sourceFromRow(row: SourceColumns): WikipediaSource | null {
	return row.source_title && row.source_url && row.source_licence && row.source_fetched_on
		? {
				title: row.source_title,
				url: row.source_url,
				licence: row.source_licence,
				fetchedOn: row.source_fetched_on
			}
		: null;
}

export function sourceColumns(source: WikipediaSource | null): SourceColumns {
	return {
		source_title: source?.title ?? null,
		source_url: source?.url ?? null,
		source_licence: source?.licence ?? null,
		source_fetched_on: source?.fetchedOn ?? null
	};
}
