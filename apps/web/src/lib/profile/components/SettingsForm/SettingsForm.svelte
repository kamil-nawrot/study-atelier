<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Form, FormActions } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		error?: string;
		errorTitle: string;
		busy: boolean;
		saveLabel: string;
		barHeight?: number;
		onsubmit: () => void | Promise<void>;
		oncancel: () => void;
		children: Snippet;
	};

	let {
		error,
		errorTitle,
		busy,
		saveLabel,
		barHeight = $bindable(0),
		onsubmit,
		oncancel,
		children
	}: Props = $props();
</script>

<div class="tab">
	<Form {error} {errorTitle} {onsubmit}>
		<div class="body">
			{@render children()}
		</div>
		<FormActions bind:height={barHeight}>
			<Button disabled={busy} onclick={oncancel}>
				{m.common.cancel}
			</Button>
			<Button disabled={busy} type="submit" variant="primary">
				{busy ? m.common.saving : saveLabel}
			</Button>
		</FormActions>
	</Form>
</div>

<style>
	.tab {
		--card-padding: var(--spacing-4);

		display: grid;
		flex: 1;
	}

	.tab > :global(form) {
		grid-template-columns: var(--card-padding) minmax(0, 1fr) var(--card-padding);
		grid-template-rows:
			var(--card-padding) auto auto var(--card-padding) minmax(var(--spacing-6), 1fr)
			auto;
		gap: 0;
	}

	.tab > :global(form)::before {
		content: '';
		grid-row: 1 / 5;
		grid-column: 1 / -1;
		border: var(--border-width-hairline) solid var(--color-line);
		border-top: none;
	}

	@media (max-width: 767.98px) {
		.tab {
			--card-padding: 0px;
		}

		.tab > :global(form)::before {
			border: none;
		}

		.tab > :global(form) {
			padding-top: var(--spacing-4);
		}
	}

	.tab > :global(form) > :global([role='alert']) {
		grid-row: 2;
		grid-column: 2;
		max-width: var(--size-content-default);
	}

	.body {
		grid-row: 3;
		grid-column: 2;
		min-width: 0;
	}

	.tab > :global(form > [role='alert'] + .body) {
		padding-top: var(--card-padding);
	}

	.tab > :global(form) > :global([data-action-bar]) {
		grid-row: 6;
		grid-column: 1 / -1;
	}

	@media (min-width: 768px) {
		.tab {
			--card-padding: var(--spacing-8);
		}
	}
</style>
