import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { withTiers } from '#lib/career/exhibits/exhibits.ts';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import type { ExhibitProgress } from '#lib/career/types/exhibit-progress.ts';
import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';

type PointsResult = { points: number; error?: string };
type ExhibitsResult = { exhibits: ExhibitProgress[]; error?: string };
type TiersResult = { tiers: UnlockedTier[]; error?: string };
type DisplayCaseResult = { exhibits: Exhibit[]; error?: string };

export async function loadPoints(): Promise<PointsResult> {
	const { data, error } = await supabase.rpc('learner_points');
	if (error || typeof data !== 'number') {
		return { points: 0, error: collectionErrorMessage(error ?? {}) };
	}
	return { points: data };
}

export async function unlockExhibits(): Promise<ExhibitsResult> {
	const { data, error } = await supabase.rpc('unlock_exhibits', {
		time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
	});
	if (error || !data) return { exhibits: [], error: collectionErrorMessage(error ?? {}) };
	return { exhibits: data };
}

export async function loadUnlockedTiers(): Promise<TiersResult> {
	const { data, error } = await supabase
		.from('exhibit_tiers')
		.select('exhibit, tier, unlocked_at, seen_at')
		.order('exhibit')
		.order('tier');
	if (error || !data) return { tiers: [], error: collectionErrorMessage(error ?? {}) };
	return {
		tiers: data.map((row) => ({
			exhibit: row.exhibit,
			tier: row.tier,
			unlockedAt: new Date(row.unlocked_at),
			seenAt: row.seen_at ? new Date(row.seen_at) : undefined
		}))
	};
}

export async function markTiersSeen(now: Date = new Date()): Promise<{ error?: string }> {
	const { error } = await supabase
		.from('exhibit_tiers')
		.update({ seen_at: now.toISOString() })
		.is('seen_at', null);
	return error ? { error: collectionErrorMessage(error) } : {};
}

export async function loadDisplayCase(): Promise<DisplayCaseResult> {
	const counted = await unlockExhibits();
	if (counted.error) return { exhibits: [], error: counted.error };
	const unlocked = await loadUnlockedTiers();
	if (unlocked.error) return { exhibits: [], error: unlocked.error };
	return { exhibits: withTiers(counted.exhibits, unlocked.tiers) };
}
