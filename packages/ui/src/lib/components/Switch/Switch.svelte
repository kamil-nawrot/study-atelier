<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'type' | 'role'> & {
		label: string;
		checked?: boolean;
	};

	let { label, checked = $bindable(false), ...rest }: Props = $props();
</script>

<label class="switch">
	{label}
	<input role="switch" type="checkbox" bind:checked {...rest} />
</label>

<style>
	.switch {
		--gap: calc((var(--spacing-4) - 2 * var(--border-width-base) - var(--spacing-2)) / 2);
		--travel: calc(
			var(--spacing-8) - 2 * var(--border-width-base) - var(--spacing-2) - 2 * var(--gap)
		);

		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		cursor: pointer;
	}

	input {
		appearance: none;
		display: grid;
		align-content: center;
		flex: none;
		box-sizing: border-box;
		width: var(--spacing-8);
		height: var(--spacing-4);
		margin: 0;
		padding: 0;
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: transparent;
		cursor: inherit;
	}

	input::before {
		content: '';
		width: var(--spacing-2);
		height: var(--spacing-2);
		margin-left: var(--gap);
		background: var(--color-fg);
	}

	input:checked {
		background: var(--color-fg);
	}

	input:checked::before {
		background: var(--color-on-fg);
		transform: translateX(var(--travel));
	}

	@media (prefers-reduced-motion: no-preference) {
		input,
		input::before {
			transition-duration: var(--duration-short);
			transition-property: background-color, transform;
		}
	}

	.switch:hover input:not(:disabled):not(:checked) {
		background: var(--color-surface);
	}

	.switch:has(input:disabled) {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	input:disabled {
		border-color: var(--color-fg-muted);
	}

	input:disabled::before {
		background: var(--color-fg-muted);
	}

	input:disabled:checked {
		background: var(--color-fg-muted);
	}

	input:disabled:checked::before {
		background: var(--color-on-fg);
	}
</style>
