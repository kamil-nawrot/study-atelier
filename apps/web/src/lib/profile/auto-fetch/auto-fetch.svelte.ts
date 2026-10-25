import type { Preferences } from '#lib/profile/types/preferences.ts';

export type AutoFetchSource = 'image' | 'definition' | 'forms' | 'event';

export const autoFetch = $state<Record<AutoFetchSource, boolean>>({
	image: true,
	definition: true,
	forms: true,
	event: true
});

export function applyAutoFetch(preferences: Preferences): void {
	autoFetch.image = preferences.fetchImage;
	autoFetch.definition = preferences.fetchDefinition;
	autoFetch.forms = preferences.fetchForms;
	autoFetch.event = preferences.fetchEvent;
}
