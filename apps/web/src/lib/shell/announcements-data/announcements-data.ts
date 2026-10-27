import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Announcement } from '#lib/shell/announcements/announcements.ts';

let loaded: Promise<Announcement[] | undefined> | undefined;

async function fetchAnnouncements(): Promise<Announcement[] | undefined> {
	try {
		const { data, error } = await supabase
			.from('announcements')
			.select('id, title, body')
			.order('starts_at', { ascending: false });
		return error || !data ? undefined : data;
	} catch {
		return undefined;
	}
}

export async function currentAnnouncements(): Promise<Announcement[]> {
	loaded ??= fetchAnnouncements();
	const announcements = await loaded;
	if (!announcements) loaded = undefined;
	return announcements ?? [];
}
