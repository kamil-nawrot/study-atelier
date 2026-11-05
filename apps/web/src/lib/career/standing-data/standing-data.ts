import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { RoundCareer } from '#lib/career/types/round-career.ts';
import type { Standing } from '#lib/career/types/standing.ts';

type StandingResult = { standing?: Standing; error?: string };
type RoundResult = { round?: RoundCareer; error?: string };

async function newTiers(since?: Date): Promise<RoundCareer['tiers'] | undefined> {
	let query = supabase.from('exhibit_tiers').select('exhibit, tier, tiers').is('seen_at', null);
	if (since) query = query.gte('unlocked_at', since.toISOString());
	const { data, error } = await query.order('unlocked_at').order('exhibit').order('tier');
	return error || !data ? undefined : data;
}

async function standingOf(unlock: boolean): Promise<StandingResult> {
	const { data, error } = await supabase.rpc('career_standing', {
		time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		unlock
	});
	const row = data?.[0];
	if (error || !row) return { error: collectionErrorMessage(error ?? {}) };
	return { standing: { points: row.points, newTiers: row.new_tiers, rankSeen: row.rank_seen } };
}

export function loadStanding(counted = false): Promise<StandingResult> {
	return standingOf(!counted);
}

export async function loadRoundCareer(dayStart: Date): Promise<RoundResult> {
	const { standing, error } = await standingOf(true);
	if (!standing) return { error };
	const tiers = await newTiers(dayStart);
	if (tiers === undefined) return { error: collectionErrorMessage({}) };
	return { round: { tiers, points: standing.points, rankSeen: standing.rankSeen } };
}

export async function markRankSeen(rank: number): Promise<{ error?: string }> {
	const { error } = await supabase.from('profiles').upsert({ rank_seen: rank });
	return error ? { error: collectionErrorMessage(error) } : {};
}
