import { navigating } from '$app/state';

export function goBackThroughHistory(event: MouseEvent, cameFromApp: boolean, steps = 1): void {
	if (navigating.to) {
		event.preventDefault();
		return;
	}
	if (!cameFromApp) return;
	event.preventDefault();
	history.go(-steps);
}
