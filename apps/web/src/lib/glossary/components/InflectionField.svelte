<script lang="ts" module>
	export type FormsStatus = 'idle' | 'searching' | 'found' | 'none' | 'failed' | 'skipped';
	export type FormsOffer = 'fetch' | 'refetch';
</script>

<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import { Icon, ValueField, type ValueOption } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		forms: string[];
		options: readonly ValueOption[];
		query: string;
		expanded: boolean;
		status?: FormsStatus;
		offer?: FormsOffer;
		message?: string;
		onfetch?: () => void;
	};

	let {
		forms = $bindable(),
		options,
		query = $bindable(),
		expanded = $bindable(),
		status = 'idle',
		offer,
		message,
		onfetch
	}: Props = $props();

	const id = $props.id();
	const labelId = `${id}-label`;
	const fieldId = `${id}-field`;
	const hintId = `${id}-hint`;

	const STATUS_TEXTS: Partial<Record<FormsStatus, string>> = {
		searching: m.glossary.form.formsSearching,
		skipped: m.glossary.form.formsSkipped,
		none: m.glossary.form.formsNone,
		failed: m.glossary.form.formsFailed
	};

	let open = $derived(expanded || forms.length === 0);
	let summary = $derived(
		message ??
			(status === 'searching' || forms.length === 0
				? STATUS_TEXTS[status]
				: m.glossary.form.formsCount(forms.length))
	);
	let action = $derived(
		status === 'searching'
			? undefined
			: status === 'failed'
				? m.glossary.form.searchAgain
				: offer === 'fetch' && forms.length === 0
					? m.glossary.form.formsFetch
					: offer === 'refetch'
						? m.glossary.form.formsRefetch
						: undefined
	);
	let framed = $derived(summary !== undefined || action !== undefined || forms.length > 0);
</script>

<div class="inflection" aria-describedby={hintId} aria-labelledby={labelId} role="group">
	<span id={labelId} class="label">{m.glossary.form.forms}</span>
	{#if framed}
		<div class="frame">
			<span class="summary" aria-live="polite">{summary ?? ''}</span>
			<span class="actions">
				{#if action}
					<button class="link" onclick={onfetch} type="button">{action}</button>
				{/if}
				{#if forms.length > 0}
					<button
						class="link"
						aria-controls={fieldId}
						aria-expanded={expanded}
						onclick={() => (expanded = !expanded)}
						type="button"
					>
						{expanded ? m.glossary.form.hideForms : m.glossary.form.showForms}
						<Icon icon={expanded ? ChevronUp : ChevronDown} size="sm" />
					</button>
				{/if}
			</span>
		</div>
	{/if}
	{#if open}
		<div class="forms">
			<ValueField
				id={fieldId}
				label={m.glossary.form.forms}
				labelHidden
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
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-2) var(--spacing-4);
		min-height: var(--size-control);
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
	}

	.summary {
		flex: 1 1 auto;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-4);
	}

	.link {
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

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}
</style>
