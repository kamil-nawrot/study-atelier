import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type PointsResult = { points: number; error?: string };

export async function loadPoints(): Promise<PointsResult> {
	const { data, error } = await supabase.rpc('learner_points');
	if (error || typeof data !== 'number') {
		return { points: 0, error: collectionErrorMessage(error ?? {}) };
	}
	return { points: data };
}
