import { navigating } from '$app/state';

export function goBackThroughHistory(event: MouseEvent, cameFromApp: boolean): void {
	if (navigating.to) {
		event.preventDefault();
		return;
	}
	if (!cameFromApp) return;
	event.preventDefault();
	history.back();
}
