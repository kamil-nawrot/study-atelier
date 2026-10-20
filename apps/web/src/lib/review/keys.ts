function typing(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function sessionKey(event: KeyboardEvent): boolean {
	if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return false;
	return !typing(event.target) && !document.querySelector('dialog[open]');
}

export function onControl(event: KeyboardEvent): boolean {
	return event.target instanceof HTMLElement && event.target.closest('button, a') !== null;
}
