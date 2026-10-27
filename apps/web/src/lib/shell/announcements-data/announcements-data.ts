import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Announcement } from '#lib/shell/announcements/announcements.ts';

export async function currentAnnouncements(): Promise<Announcement[]> {
	try {
		const { data, error } = await supabase
			.from('announcements')
			.select('id, title, body')
			.order('starts_at', { ascending: false });
		return error || !data ? [] : data;
	} catch {
		return [];
	}
}
