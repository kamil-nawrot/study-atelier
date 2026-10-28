type QuizKeys = {
	answered: boolean;
	saving: boolean;
	options: number;
	onanswer: (choice: number) => void;
	onnext: () => void;
};

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

export function quizKey(event: KeyboardEvent, keys: QuizKeys): void {
	if (!sessionKey(event)) return;
	if (event.key === 'Enter' && keys.answered) {
		if (onControl(event)) return;
		event.preventDefault();
		keys.onnext();
		return;
	}
	const choice = Number(event.key) - 1;
	if (
		!keys.answered &&
		!keys.saving &&
		Number.isInteger(choice) &&
		choice >= 0 &&
		choice < keys.options
	) {
		event.preventDefault();
		keys.onanswer(choice);
	}
}
