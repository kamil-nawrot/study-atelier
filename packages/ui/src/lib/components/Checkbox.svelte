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
		width: var(--spacing-4);
		height: var(--spacing-4);
		margin: 0;
		accent-color: var(--color-fg);
		cursor: inherit;
	}

	.checkbox:has(input:disabled) {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
