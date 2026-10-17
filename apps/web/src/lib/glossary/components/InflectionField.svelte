<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import { untrack } from 'svelte';
	import { Icon, ValueField, type ValueOption } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		forms: string[];
		options: readonly ValueOption[];
		query: string;
	};

	let { forms = $bindable(), options, query = $bindable() }: Props = $props();

	const id = $props.id();
	const labelId = `${id}-label`;
	const fieldId = `${id}-field`;
	const hintId = `${id}-hint`;

	let expanded = $state(untrack(() => forms.length === 0));

	let open = $derived(expanded || forms.length === 0);
</script>

<div class="inflection" aria-describedby={hintId} aria-labelledby={labelId} role="group">
	<span id={labelId} class="label">{m.glossary.form.forms}</span>
	{#if forms.length > 0}
		<div class="frame">
			<span class="summary">{m.glossary.form.formsCount(forms.length)}</span>
			<button
				class="toggle"
				aria-controls={fieldId}
				aria-expanded={expanded}
				onclick={() => (expanded = !expanded)}
				type="button"
			>
				{expanded ? m.glossary.form.hideForms : m.glossary.form.showForms}
				<Icon icon={expanded ? ChevronUp : ChevronDown} size="sm" />
			</button>
		</div>
	{/if}
	{#if open}
		<div class="forms">
			<ValueField
				id={fieldId}
				label={m.glossary.form.forms}
				{options}
				bind:query
				bind:values={forms}
			/>
		</div>
	{/if}
	<span id={hintId} class="hint">{m.glossary.form.formsHint}</span>
</div>

<style>
	.inflection {
		display: grid;
		gap: var(--spacing-2);
	}

	.label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.frame {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-3);
		min-height: var(--size-control);
		padding: 0 var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
	}

	.summary {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		white-space: nowrap;
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
		cursor: pointer;
	}

	.forms :global(label) {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}
</style>
