<script lang="ts">
	import { tick, untrack } from 'svelte';
	import {
		Alert,
		Button,
		Checkbox,
		Form,
		FormActions,
		Switch,
		TextArea,
		TextField
	} from '@study-atelier/ui';
	import DiscardDialog from '#lib/collection/components/DiscardDialog.svelte';
	import YearGroup from '#lib/collection/components/YearGroup.svelte';
	import YearInput from '#lib/collection/components/YearInput.svelte';
	import { UnsavedChanges } from '#lib/collection/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/index.ts';
	import {
		draftOfEventForm,
		emptyEventForm,
		EVENT_DESCRIPTION_MAX_LENGTH,
		EVENT_NAME_MAX_LENGTH,
		eventFormChanged,
		eventFormOf,
		validateEventForm,
		type EventFormErrors,
		type EventFormState
	} from '../event-form.ts';
	import { saveTimelineEvent } from '../timeline-data.ts';
	import type { TimelineEvent, TimelineEventDraft } from '../types.ts';

	type Props = {
		event?: TimelineEvent;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (draft: TimelineEventDraft) => void | Promise<void>;
	};

	let { event, cancelHref, oncancel, onsaved }: Props = $props();

	const formId = $props.id();
	const formErrorId = `${formId}-error`;
	const yearToId = `${formId}-year-to`;
	const existing = untrack(() => event);
	const initial = (): EventFormState => (existing ? eventFormOf(existing) : emptyEventForm());

	let form = $state<EventFormState>(initial());
	let saved = $state<EventFormState>(initial());
	let errors = $state<EventFormErrors>({});
	let formError = $state('');
	let busy = $state(false);

	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => saved,
		eventFormChanged
	);

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	async function showError(message: string): Promise<void> {
		formError = message;
		await tick();
		document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
	}

	async function submit(): Promise<void> {
		if (busy) return;
		formError = '';
		errors = validateEventForm(form);
		if (Object.keys(errors).length > 0) return;
		busy = true;
		const snapshot = $state.snapshot(form);
		const draft = draftOfEventForm(snapshot);
		try {
			const result = await saveTimelineEvent(draft, existing?.id);
			if (result.error || !result.id) {
				await showError(result.error ?? m.common.unexpectedError);
				return;
			}
			saved = snapshot;
			await onsaved(draft);
		} finally {
			busy = false;
		}
	}
</script>

<div class="page">
	<Form onsubmit={submit}>
		{#if formError}
			<Alert id={formErrorId} title={m.timeline.form.errorTitle} tone="danger">
				{formError}
			</Alert>
		{/if}

		<div class="fields">
			<TextField
				autocomplete="off"
				error={errors.name}
				label={m.timeline.form.name}
				maxlength={EVENT_NAME_MAX_LENGTH}
				placeholder={m.timeline.form.namePlaceholder}
				bind:value={form.name}
			/>

			<YearGroup
				columns={form.spanMode}
				labelFor={form.spanMode ? undefined : yearToId}
				title={form.spanMode ? m.timeline.form.spanTitle : m.timeline.form.year}
			>
				{#snippet aside()}
					<Checkbox label={m.artworkForm.yearApproximate} bind:checked={form.yearApproximate} />
					<Switch label={m.artworkForm.spanSwitch} bind:checked={form.spanMode} />
				{/snippet}
				{#if form.spanMode}
					<YearInput
						beforeCommonEraLabel={m.artworkForm.beforeCommonEraFrom}
						error={errors.yearFrom}
						label={m.artworkForm.spanFrom}
						placeholder={m.artworkForm.spanFrom}
						bind:value={form.yearFrom}
						bind:beforeCommonEra={form.fromBeforeCommonEra}
					/>
				{/if}
				<YearInput
					id={yearToId}
					beforeCommonEraLabel={form.spanMode ? m.artworkForm.beforeCommonEraTo : undefined}
					error={errors.yearTo}
					label={form.spanMode ? m.artworkForm.spanTo : m.timeline.form.year}
					placeholder={form.spanMode ? m.artworkForm.spanTo : undefined}
					bind:value={form.yearTo}
					bind:beforeCommonEra={form.toBeforeCommonEra}
				/>
			</YearGroup>

			<TextArea
				counter
				label={m.timeline.form.description}
				maxlength={EVENT_DESCRIPTION_MAX_LENGTH}
				placeholder={m.timeline.form.descriptionPlaceholder}
				rows={4}
				bind:value={form.description}
			/>
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.timeline.form.cancel}
			</Button>
			<Button disabled={busy} type="submit" variant="primary">
				{busy ? m.timeline.form.saving : m.timeline.form.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.timeline.form.discardDescription} />

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
		margin-bottom: calc(-1 * var(--spacing-12));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-narrow);
	}
</style>
