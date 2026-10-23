<script lang="ts">
	import { Alert, Button } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { downloadBlob } from '../download.ts';
	import { exportAtelier } from '../export-atelier.ts';
	import type { ExportProgress } from '../format.ts';

	type Props = {
		onexported: (message: string) => void;
	};

	let { onexported }: Props = $props();

	let busy = $state(false);
	let progress = $state<ExportProgress>();
	let error = $state('');

	let status = $derived.by(() => {
		if (!progress) return '';
		if (progress.step === 'data') return m.settings.data.reading;
		if (progress.step === 'images') return m.settings.data.images(progress.done, progress.total);
		return m.settings.data.packing;
	});

	async function start(): Promise<void> {
		if (busy) return;
		busy = true;
		error = '';
		try {
			const result = await exportAtelier((next) => (progress = next));
			if (result.error !== undefined) {
				error = result.error;
				return;
			}
			downloadBlob(result.blob, result.name);
			onexported(m.settings.data.exported);
		} finally {
			busy = false;
			progress = undefined;
		}
	}
</script>

<div class="data">
	<section>
		<h2>{m.settings.data.exportTitle}</h2>
		{#if error}
			<Alert title={m.settings.data.errorTitle} tone="danger">{error}</Alert>
		{/if}
		<p>{m.settings.data.exportDescription}</p>
		<p class="hint">{m.settings.data.exportHint}</p>
		<div class="actions">
			<Button disabled={busy} onclick={start} variant="primary">
				{m.settings.data.exportButton}
			</Button>
			<span class="status" aria-live="polite">{status}</span>
		</div>
	</section>
</div>

<style>
	.data {
		display: grid;
		gap: var(--spacing-8);
		width: 100%;
		max-width: var(--size-content-default);
	}

	section {
		display: grid;
		gap: var(--spacing-4);
		justify-items: start;
	}

	.hint,
	.status {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-4);
	}
</style>
