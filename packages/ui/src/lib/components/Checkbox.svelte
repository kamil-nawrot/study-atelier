<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'type'> & {
		label: string;
		checked?: boolean;
	};

	let { label, checked = $bindable(false), ...rest }: Props = $props();
</script>

<label class="checkbox">
	<input type="checkbox" bind:checked {...rest} />
	{label}
</label>

<style>
	.checkbox {
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
		place-content: center;
		flex: none;
		width: var(--spacing-4);
		height: var(--spacing-4);
		margin: 0;
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: transparent;
		cursor: inherit;
	}

	input::before {
		content: '';
		width: var(--spacing-2);
		height: var(--spacing-2);
		background: var(--color-on-fg);
		clip-path: polygon(14% 44%, 0 59%, 40% 100%, 100% 22%, 85% 8%, 39% 69%);
		visibility: hidden;
	}

	input:checked {
		background: var(--color-fg);
	}

	input:checked::before {
		visibility: visible;
	}

	.checkbox:hover input:not(:disabled) {
		background: var(--color-surface);
	}

	.checkbox:hover input:checked:not(:disabled) {
		background: var(--color-fg);
	}

	.checkbox:has(input:disabled) {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	input:disabled {
		border-color: var(--color-fg-muted);
	}

	input:disabled:checked {
		background: var(--color-fg-muted);
	}
</style>
