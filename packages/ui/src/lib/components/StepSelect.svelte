<script lang="ts" module>
	export type StepOption = {
		value: string;
		label: string;
	};
</script>

<script lang="ts">
	type Props = {
		label: string;
		steps: readonly StepOption[];
		value?: string;
		disabled?: boolean;
		size?: 'sm' | 'lg';
	};

	let { label, steps, value = $bindable(''), disabled = false, size = 'sm' }: Props = $props();

	const id = $props.id();
	const labelId = `${id}-label`;

	let chosen = $derived(steps.findIndex((step) => step.value === value));

	function choose(index: number): void {
		value = index === chosen ? (steps[index - 1]?.value ?? '') : steps[index].value;
	}
</script>

<div class="steps {size}" aria-labelledby={labelId} role="group">
	<span id={labelId} class="label">{label}</span>
	{#each steps as step, index (step.value)}
		{#if index > 0}
			<span class="separator" aria-hidden="true">›</span>
		{/if}
		<button
			class="step"
			class:pressed={index <= chosen}
			aria-pressed={index <= chosen}
			{disabled}
			onclick={() => choose(index)}
			type="button"
		>
			{step.label}
		</button>
	{/each}
</div>

<style>
	.steps {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.label,
	.separator {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.step {
		padding: var(--spacing-1) var(--spacing-2);
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-tag);
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-xs);
		cursor: pointer;
	}

	.lg {
		gap: var(--spacing-3);
	}

	.lg .label {
		flex-basis: 100%;
		color: var(--color-fg);
		font-weight: var(--font-weight-medium);
	}

	.lg .step {
		min-width: 96px;
		min-height: var(--size-control);
		padding: var(--spacing-3) var(--spacing-4);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	.step:hover:not(:disabled, .pressed) {
		background: var(--color-surface);
	}

	.step.pressed {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.step:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.step:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
