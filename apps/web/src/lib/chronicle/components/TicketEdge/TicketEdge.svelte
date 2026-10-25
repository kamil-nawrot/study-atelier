<script lang="ts">
	type Props = {
		size?: 'large' | 'small';
		acrossOnPhone?: boolean;
	};

	let { size = 'large', acrossOnPhone = true }: Props = $props();
</script>

<span class="edge {size}" class:phone={acrossOnPhone} aria-hidden="true">
	<span class="notch start"></span>
	<span class="notch end"></span>
</span>

<style>
	.edge {
		--period: 32px;
		--depth: 14px;
		--notch: var(--spacing-4);
		--zigzag: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 32' preserveAspectRatio='none'%3E%3Cpolyline points='7,0 13,8 1,24 7,32' fill='none' stroke='black' stroke-width='1.5' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E");
		--zigzag-across: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 14' preserveAspectRatio='none'%3E%3Cpolyline points='0,7 8,13 24,1 32,7' fill='none' stroke='black' stroke-width='1.5' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E");

		position: relative;
		align-self: stretch;
		justify-self: center;
		width: var(--depth);
	}

	.small {
		--period: 16px;
		--depth: 8px;
		--notch: var(--spacing-2);
	}

	.edge::before {
		position: absolute;
		inset: calc(var(--notch) / 2) 0;
		background: var(--color-fg-muted);
		content: '';
		mask: var(--zigzag) center top / var(--depth) var(--period) repeat-y;
	}

	.notch {
		position: absolute;
		left: calc(50% - var(--notch) / 2);
		width: var(--notch);
		height: var(--notch);
		background: radial-gradient(closest-side, var(--color-bg) 98%, transparent);
	}

	.start {
		top: calc(var(--notch) / -2);
	}

	.end {
		bottom: calc(var(--notch) / -2);
	}

	@media (max-width: 767.98px) {
		.phone {
			justify-self: stretch;
			width: auto;
			height: var(--depth);
		}

		.phone::before {
			inset: 0 calc(var(--notch) / 2);
			mask: var(--zigzag-across) left center / var(--period) var(--depth) repeat-x;
		}

		.phone .notch {
			top: calc(50% - var(--notch) / 2);
			bottom: auto;
		}

		.phone .start {
			left: calc(var(--notch) / -2);
		}

		.phone .end {
			right: calc(var(--notch) / -2);
			left: auto;
		}
	}
</style>
