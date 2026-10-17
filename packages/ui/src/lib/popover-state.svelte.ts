export class PopoverState {
	anchor = $state<HTMLElement>();
	open = $state(false);
	#pinned = false;

	show(anchor: HTMLElement): void {
		this.anchor = anchor;
		this.open = true;
	}

	hide(): void {
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
		if (event.pointerType === 'mouse' && !this.#pinned) this.open = false;
	}

	focus(anchor: HTMLElement): void {
		if (anchor.matches(':focus-visible')) this.show(anchor);
	}

	blur(): void {
		if (!this.#pinned) this.open = false;
	}

	pointerDown(event: PointerEvent): void {
		if (this.open && this.anchor && !this.anchor.contains(event.target as Node)) this.hide();
	}

	keyDown(event: KeyboardEvent): void {
		if (this.open && event.key === 'Escape') this.hide();
	}
}
