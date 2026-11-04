<script lang="ts">
	import { Alert, Button, FilePicker, Meter } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { downloadBlob } from '#lib/data-transfer/download/download.ts';
	import { exportAtelier } from '#lib/data-transfer/export-atelier/export-atelier.ts';
	import { importArchive } from '#lib/data-transfer/import-atelier/import-atelier.ts';
	import type { ImportProgress } from '#lib/data-transfer/types/import-progress.ts';
	import type { ExportProgress } from '#lib/data-transfer/types/export-progress.ts';
	import { megabytes } from '#lib/images/storage-usage/storage-usage.ts';
	import type { StorageUsage } from '#lib/images/types/storage-usage.ts';
	import SettingsSection from '#lib/profile/components/SettingsSection/SettingsSection.svelte';

	type Props = {
		atelierEmpty?: boolean;
		onexported: (message: string) => void;
		onimported: (message: string) => void | Promise<void>;
		storageUsage?: StorageUsage;
	};

	let { atelierEmpty, onexported, onimported, storageUsage }: Props = $props();

	let usageText = $derived(
		storageUsage
			? m.settings.data.storageUsage(
					megabytes(storageUsage.usedBytes),
					megabytes(storageUsage.quotaBytes)
				)
			: ''
	);

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
	{#if storageUsage}
		<SettingsSection title={m.settings.data.storageTitle}>
			<p>
				{m.settings.data.storageUsageStart}
				<strong>{m.settings.data.storageUsed(megabytes(storageUsage.usedBytes))}</strong>
				{m.settings.data.storageUsageEnd(megabytes(storageUsage.quotaBytes))}
			</p>
			<div class="usage">
				<Meter
					label={usageText}
					max={storageUsage.quotaBytes}
					size="thick"
					track="dim"
					value={storageUsage.usedBytes}
				/>
			</div>
		</SettingsSection>
	{/if}
	<SettingsSection rule={!!storageUsage} title={m.settings.data.exportTitle}>
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
	</SettingsSection>
	<SettingsSection rule title={m.settings.data.importTitle}>
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
	</SettingsSection>
</div>

<style>
	.data {
		display: grid;
		gap: var(--spacing-8);
		width: 100%;
	}

	.hint,
	.status {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.usage {
		inline-size: 100%;
	}

	@media (min-width: 768px) {
		.usage {
			inline-size: 50cqi;
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-4);
	}
</style>
