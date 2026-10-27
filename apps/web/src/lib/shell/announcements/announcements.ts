import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';

export const DISMISSED_KEY = 'study-atelier:dismissed-announcements';
const KEPT_DISMISSALS = 50;

export type Announcement = {
	id: string;
	title: string | null;
	body: string;
};

export function dismissedAnnouncements(): string[] {
	const stored = readStoredJson('local', DISMISSED_KEY);
	return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
}

export function dismissAnnouncement(id: string): void {
	const kept = dismissedAnnouncements().filter((dismissed) => dismissed !== id);
	writeStored('local', DISMISSED_KEY, JSON.stringify([id, ...kept].slice(0, KEPT_DISMISSALS)));
}

export function visibleAnnouncements(
	announcements: Announcement[],
	dismissed: string[]
): Announcement[] {
	return announcements.filter((announcement) => !dismissed.includes(announcement.id));
}
