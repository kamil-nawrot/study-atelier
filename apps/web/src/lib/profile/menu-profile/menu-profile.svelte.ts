import type { Profile } from '#lib/profile/types.ts';

const shown = $state<{ ownerId?: string; profile?: Profile }>({});

export function shownMenuProfile(ownerId: string | undefined): Profile | undefined {
	return shown.ownerId === ownerId ? shown.profile : undefined;
}

export function followMenuProfile(
	next: Promise<Profile | undefined> | undefined,
	ownerId: string | undefined
): () => void {
	let current = true;
	void next?.then((profile) => {
		if (!current) return;
		shown.ownerId = ownerId;
		shown.profile = profile;
	});
	return () => {
		current = false;
	};
}
