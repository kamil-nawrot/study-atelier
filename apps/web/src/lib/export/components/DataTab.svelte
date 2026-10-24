<script lang="ts">
	import { Alert, Button, FilePicker } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { downloadBlob } from '../download.ts';
	import { exportAtelier } from '../export-atelier.ts';
	import { importArchive, type ImportProgress } from '#lib/import/import-atelier.ts';
	import type { ExportProgress } from '../format.ts';

	type Props = {
		atelierEmpty?: boolean;
		onexported: (message: string) => void;
		onimported: (message: string) => void | Promise<void>;
	};

	let { atelierEmpty, onexported, onimported }: Props = $props();

	const importHintId = $props.id();

	let importing = $state(false);
	let importProgress = $state<ImportProgress>();
	let importError = $state('');
	let importStatus = $derived.by(() => {
		if (!importProgress) return '';
		if (importProgress.step === 'reading') return m.settings.data.importReading;
		if (importProgress.step === 'images') {
			return m.settings.data.images(importProgress.done, importProgress.total);
		}
		return m.settings.data.importSaving;
	});

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

	async function pick(file: File): Promise<void> {
		if (importing) return;
		importing = true;
		importError = '';
		try {
			const result = await importArchive(file, (next) => (importProgress = next));
			if (result.error !== undefined) {
				importError = result.error;
				return;
			}
			await onimported(m.settings.data.imported);
		} finally {
			importing = false;
			importProgress = undefined;
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
	<section class="rule">
		<h2>{m.settings.data.importTitle}</h2>
		{#if importError}
			<Alert title={m.settings.data.importErrorTitle} tone="danger">{importError}</Alert>
		{/if}
		<p>{m.settings.data.importDescription}</p>
		<p id={importHintId} class="hint">
			{atelierEmpty === false ? m.settings.data.importFilled : m.settings.data.importHint}
		</p>
		<div class="actions">
			<FilePicker
				accept=".zip,application/zip"
				describedby={importHintId}
				disabled={importing || atelierEmpty === false}
				label={m.settings.data.importButton}
				onpick={pick}
			/>
			<span class="status" aria-live="polite">{importStatus}</span>
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

	.rule {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-line);
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
