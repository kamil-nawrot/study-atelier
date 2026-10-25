import { vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type TestMentionRow = {
	kind: string;
	id: string;
	record_number: number | null;
	title: string | null;
	notes: string;
};

export function artworkNote(number: number, title: string, notes: string): TestMentionRow {
	return { kind: 'artwork', id: `artwork-${number}`, record_number: number, title, notes };
}

export function valueNote(kind: string, id: string, notes: string): TestMentionRow {
	return { kind, id, record_number: null, title: null, notes };
}

export function mockNotesMentions(rows: TestMentionRow[], error: unknown = null): void {
	vi.mocked(supabase.rpc).mockImplementation((() => ({
		range: vi.fn().mockResolvedValue({ data: error ? null : rows, error })
	})) as never);
}
