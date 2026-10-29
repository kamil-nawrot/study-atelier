import { navigating } from '$app/state';

export function arrivedFromApp(from: { url: URL | null } | null): boolean {
	return Boolean(from?.url);
}

export function goBackThroughHistory(event: MouseEvent, cameFromApp: boolean, steps = 1): void {
	if (navigating.to) {
		event.preventDefault();
		return;
	}
	if (!cameFromApp) return;
	event.preventDefault();
	history.go(-steps);
}
