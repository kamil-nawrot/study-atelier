export type LoupeSpot = { x: number; y: number };

export class SharedLoupe {
	on = $state(false);
	spot = $state<LoupeSpot>();
	viewWidth = $state<number>();

	toggle(ready: boolean): void {
		if (ready) this.on = !this.on;
		if (!this.on) this.spot = undefined;
	}

	close(): void {
		this.on = false;
		this.spot = undefined;
	}
}
