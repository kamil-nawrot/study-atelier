<script lang="ts">
	import { TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		id?: string;
		label: string;
		placeholder?: string;
		beforeCommonEraLabel?: string;
		error?: string;
		value: string;
		beforeCommonEra: boolean;
		filling?: boolean;
		required?: boolean;
	};

	let {
		id,
		label,
		placeholder,
		beforeCommonEraLabel,
		error,
		value = $bindable(),
		beforeCommonEra = $bindable(),
		filling = false,
		required = false
	}: Props = $props();
</script>

<TextField
	{id}
	autocomplete="off"
	{error}
	{filling}
	hideLabel
	inputmode="numeric"
	{label}
	{placeholder}
	{required}
	bind:value
>
	{#snippet inside()}
		<button
			class="era"
			class:on={beforeCommonEra}
			aria-label={beforeCommonEraLabel}
			aria-pressed={beforeCommonEra}
			disabled={filling}
			onclick={() => (beforeCommonEra = !beforeCommonEra)}
			type="button"
		>
			{m.artworkForm.beforeCommonEra}
		</button>
	{/snippet}
</TextField>

<style>
	.era {
		display: grid;
		place-content: center;
		padding: 0 var(--spacing-3);
		border: none;
		border-left: var(--border-width-hairline) solid var(--color-fg-muted);
		background: transparent;
		color: var(--color-fg-muted);
		font-family: inherit;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: nowrap;
		cursor: pointer;
	}

	.era:hover {
		color: var(--color-fg);
	}

	.era.on {
		border-left-color: var(--color-fg);
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.era:disabled {
		cursor: not-allowed;
	}
</style>
