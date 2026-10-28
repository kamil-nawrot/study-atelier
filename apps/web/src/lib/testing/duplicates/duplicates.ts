import { vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type Candidate = { id: string; record_number: number; title: string; authors: string[] };

let candidates: Candidate[] = [];

export function answerRpc(saveCall: unknown): void {
	candidates = [];
	vi.mocked(supabase.rpc).mockImplementation(((name: string) =>
		name === 'duplicate_candidates'
			? Promise.resolve({ data: candidates, error: null })
			: saveCall) as never);
}

export function savedCandidates(...saved: Candidate[]): void {
	candidates = saved;
}

export function saveArtworkCalls(): unknown[][] {
	return vi.mocked(supabase.rpc).mock.calls.filter(([name]) => name === 'save_artwork');
}
