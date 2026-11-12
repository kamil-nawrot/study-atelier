export const PHONE = '(max-width: 767.98px)';
export const KEYBOARD_WAIT = 350;
export const FIELD_GAP = 16;

const SCROLLING = /(auto|scroll)/;

const TYPED = [
	'input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="search"], [type="file"], [type="color"])',
	'textarea',
	'[contenteditable="true"]'
].join(', ');

export function typedField(target: EventTarget | null): HTMLElement | undefined {
	if (!(target instanceof HTMLElement) || !target.matches(TYPED)) return undefined;
	return target.closest<HTMLElement>('.field') ?? target;
}

function scrollBox(element: HTMLElement): HTMLElement | undefined {
	for (let node = element.parentElement; node; node = node.parentElement) {
		if (node === document.body) return undefined;
		if (node instanceof HTMLDialogElement || SCROLLING.test(getComputedStyle(node).overflowY))
			return node;
	}
	return undefined;
}

export function keyboardHeight(): number {
	const visible = window.visualViewport;
	if (!visible) return 0;
	return Math.max(0, Math.round(window.innerHeight - visible.height - visible.offsetTop));
}

export function bringToTop(field: HTMLElement, smooth: boolean): void {
	const behavior = smooth ? 'smooth' : 'instant';
	if (scrollBox(field)) {
		field.scrollIntoView({ block: 'start', behavior });
		return;
	}
	const bar = parseFloat(getComputedStyle(field).getPropertyValue('--bar-height')) || 0;
	const top = window.scrollY + field.getBoundingClientRect().top - bar - FIELD_GAP;
	window.scrollTo({ top: Math.max(top, 0), behavior });
}

export function watchFieldFocus(): () => void {
	let pending: (() => void) | undefined;

	const makeRoom = (): void => {
		const room = keyboardHeight();
		document.body.style.paddingBottom = room > 0 ? `${room}px` : '';
	};

	const focusin = (event: FocusEvent): void => {
		pending?.();
		if (!window.matchMedia(PHONE).matches) return;
		const field = typedField(event.target);
		if (!field) return;
		const target = event.target as HTMLElement;
		const visible = window.visualViewport;
		const show = (): void => {
			pending?.();
			if (document.activeElement !== target) return;
			makeRoom();
			bringToTop(field, !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
		};
		const timer = setTimeout(show, KEYBOARD_WAIT);
		visible?.addEventListener('resize', show);
		pending = (): void => {
			clearTimeout(timer);
			visible?.removeEventListener('resize', show);
			pending = undefined;
		};
	};

	const focusout = (event: FocusEvent): void => {
		if (typedField(event.relatedTarget)) return;
		pending?.();
		document.body.style.paddingBottom = '';
	};

	document.addEventListener('focusin', focusin);
	document.addEventListener('focusout', focusout);
	return () => {
		pending?.();
		document.body.style.paddingBottom = '';
		document.removeEventListener('focusin', focusin);
		document.removeEventListener('focusout', focusout);
	};
}
