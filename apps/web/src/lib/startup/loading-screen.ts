import { mount, unmount } from 'svelte';
import { LoadingScreen } from '@study-atelier/ui';
import { m } from '#lib/i18n/index.ts';

let screen: ReturnType<typeof mount> | undefined;

export function showLoadingScreen(target: HTMLElement = document.body): void {
	if (screen) return;
	screen = mount(LoadingScreen, { target, props: { label: m.ui.loading } });
}

export function hideLoadingScreen(): void {
	if (!screen) return;
	void unmount(screen);
	screen = undefined;
}
