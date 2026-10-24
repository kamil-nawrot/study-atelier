import { hydrate, unmount } from 'svelte';
import { LoadingScreen } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';

export const LOADING_SCREEN_ID = 'loading-screen';
export const LOADING_SCREEN_SLOT = '<!--loading-screen-->';
export const loadingScreenProps = { label: m.ui.loading };

let screen: ReturnType<typeof hydrate> | undefined;

export function takeOverLoadingScreen(): void {
	const target = document.getElementById(LOADING_SCREEN_ID);
	if (!target || screen) return;
	screen = hydrate(LoadingScreen, { target, props: loadingScreenProps });
}

export function hideLoadingScreen(): void {
	if (screen) void unmount(screen);
	screen = undefined;
	document.getElementById(LOADING_SCREEN_ID)?.remove();
}
