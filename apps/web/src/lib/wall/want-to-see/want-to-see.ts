import { m } from '#lib/i18n/i18n.ts';

export function wantToSeeLabel(wantToSee: boolean): string {
	return wantToSee ? m.wantToSee.remove : m.wantToSee.add;
}

export function wantToSeeToast(wantToSee: boolean): string {
	return wantToSee ? m.wantToSee.added : m.wantToSee.removed;
}
