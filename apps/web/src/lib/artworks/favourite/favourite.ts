import { m } from '#lib/i18n/index.ts';

export function favouriteLabel(favourite: boolean): string {
	return favourite ? m.favourite.remove : m.favourite.add;
}

export function favouriteToast(favourite: boolean): string {
	return favourite ? m.favourite.added : m.favourite.removed;
}
