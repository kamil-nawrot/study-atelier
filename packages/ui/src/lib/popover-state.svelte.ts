const CLOSE_DELAY = 200;
const FOCUSABLE =
	'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusablesIn(root: Element | Document): HTMLElement[] {
	return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
		(element) => element.getClientRects().length > 0
	);
}

export class PopoverState {
	anchor = $state<HTMLElement>();
	open = $state(false);
	card: HTMLElement | undefined;
	interactive = false;
	#pinned = false;
	#closing: ReturnType<typeof setTimeout> | undefined;

	show(anchor: HTMLElement): void {
		this.#cancelClose();
		this.anchor = anchor;
		this.open = true;
	}

	hide(): void {
		this.#cancelClose();
		this.open = false;
		this.#pinned = false;
	}

	toggle(anchor: HTMLElement): void {
		const sameAnchor = this.anchor === anchor;
		this.#pinned = !(this.#pinned && sameAnchor) || !this.open;
		if (this.#pinned) this.show(anchor);
		else this.hide();
	}

	pointerEnter(anchor: HTMLElement, event: PointerEvent): void {
		if (event.pointerType === 'mouse') this.show(anchor);
	}

	pointerLeave(event: PointerEvent): void {
		if (event.pointerType !== 'mouse' || this.#pinned) return;
		if (!this.interactive) {
			this.open = false;
			return;
		}
		this.#cancelClose();
		this.#closing = setTimeout(() => {
			if (!this.#keepsFocus()) this.open = false;
		}, CLOSE_DELAY);
	}

	cardPointerEnter(event: PointerEvent): void {
		if (event.pointerType === 'mouse') this.#cancelClose();
	}

	focus(anchor: HTMLElement): void {
		if (anchor.matches(':focus-visible')) this.show(anchor);
	}

	blur(event?: FocusEvent): void {
		if (!this.#pinned && !this.#holds(event?.relatedTarget ?? null)) this.open = false;
	}

	pointerDown(event: PointerEvent): void {
		if (this.open && !this.#holds(event.target)) this.hide();
	}

	keyDown(event: KeyboardEvent): void {
		if (!this.open) return;
		if (event.key === 'Escape') {
			if (this.card?.contains(document.activeElement)) this.anchor?.focus();
			this.hide();
		} else if (event.key === 'Tab' && this.interactive) {
			this.#tab(event);
		}
	}

	#tab(event: KeyboardEvent): void {
		const { anchor, card } = this;
		if (!anchor || !card) return;
		const inside = focusablesIn(card);
		const target = event.target;
		if (target === anchor && !event.shiftKey && inside.length > 0) {
			event.preventDefault();
			inside[0].focus();
		} else if (target === inside[0] && event.shiftKey) {
			event.preventDefault();
			anchor.focus();
		} else if (target === inside.at(-1) && !event.shiftKey) {
			const next = focusablesIn(document).find(
				(element) =>
					!card.contains(element) &&
					!anchor.contains(element) &&
					anchor.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING
			);
			if (!next) return;
			event.preventDefault();
			this.hide();
			next.focus();
		}
	}

	#holds(target: EventTarget | null): boolean {
		if (!(target instanceof Node)) return false;
		return Boolean(this.anchor?.contains(target) || this.card?.contains(target));
	}

	#keepsFocus(): boolean {
		const focused = document.activeElement;
		if (!focused) return false;
		if (this.card?.contains(focused)) return true;
		return focused === this.anchor && focused.matches(':focus-visible');
	}

	#cancelClose(): void {
		clearTimeout(this.#closing);
		this.#closing = undefined;
	}
}
