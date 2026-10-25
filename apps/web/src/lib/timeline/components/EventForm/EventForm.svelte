<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Button,
		Checkbox,
		Dialog,
		Form,
		FormActions,
		Switch,
		TextArea,
		TextButton,
		TextField
	} from '@study-atelier/ui';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import YearGroup from '#lib/shared/forms/YearGroup/YearGroup.svelte';
	import YearInput from '#lib/shared/forms/YearInput/YearInput.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import ArticleDialog from '#lib/glossary/components/ArticleDialog/ArticleDialog.svelte';
	import { sourceOf } from '#lib/glossary/wikipedia/wikipedia.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
	import {
		datesKey,
		draftOfEventForm,
		emptyEventForm,
		EVENT_DESCRIPTION_MAX_LENGTH,
		EVENT_NAME_MAX_LENGTH,
		eventFormChanged,
		eventFormOf,
		hasNoDates,
		validateEventForm,
		withDates,
		withoutDates,
		type EventFormErrors,
		type EventFormState
	} from '#lib/timeline/event-form/event-form.ts';
	import { saveTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
	import type { EventArticle } from '#lib/timeline/types/event-article.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
	import type { TimelineEventDraft } from '#lib/timeline/types/timeline-event-draft.ts';
	import { searchEvents } from '#lib/timeline/wikipedia/wikipedia.ts';

	type SearchStatus = 'idle' | 'searching' | 'found' | 'none' | 'failed';

	type Props = {
		event?: TimelineEvent;
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (draft: TimelineEventDraft) => void | Promise<void>;
	};

	let { event, cancelHref, oncancel, onsaved }: Props = $props();

	const SEARCH_DELAY_MS = 600;
	const formId = $props.id();
	const yearToId = `${formId}-year-to`;
	const existing = untrack(() => event);
	const initial = (): EventFormState => (existing ? eventFormOf(existing) : emptyEventForm());

	let form = $state<EventFormState>(initial());
	let errors = $state<EventFormErrors>({});
	let status = $state<SearchStatus>('idle');
	let articles = $state<EventArticle[]>([]);
	let articlesName = $state('');
	let articlesOpen = $state(false);
	let replaceOpen = $state(false);
	let pendingArticle = $state<EventArticle>();
	let autoDescription = $state<string | null>(null);
	let autoDates = $state<string | null>(null);
	let request = 0;

	const formState = new FormState<EventFormState>(initial());

	let query = $derived(form.name.trim());

	const changes = new UnsavedChanges(
		() => $state.snapshot(form),
		() => formState.saved,
		eventFormChanged
	);

	function descriptionReplaceable(): boolean {
		return form.description === '' || form.description === autoDescription;
	}

	function datesReplaceable(): boolean {
		return hasNoDates(form) || datesKey(form) === autoDates;
	}

	function replaceable(): boolean {
		return descriptionReplaceable() || datesReplaceable();
	}

	function applyArticle(article: EventArticle, all = false): void {
		if (all || datesReplaceable()) {
			form = withDates(form, article.dates);
			autoDates = datesKey(form);
		}
		if (all || descriptionReplaceable()) {
			form.description = article.extract;
			autoDescription = article.extract;
		}
		form.source = sourceOf(article);
	}

	function clearSuggestion(): void {
		if (autoDescription !== null && form.description === autoDescription) form.description = '';
		if (autoDates !== null && datesKey(form) === autoDates) form = withoutDates(form);
		const fromArticle = autoDescription !== null && form.description !== '';
		if (!fromArticle && (autoDates !== null || autoDescription !== null)) form.source = null;
		autoDescription = null;
		autoDates = null;
	}

	async function search(fill: boolean): Promise<void> {
		const name = form.name.trim();
		if (!name) return;
		const current = ++request;
		status = 'searching';
		try {
			const found = await searchEvents(name);
			if (current !== request || formState.busy) return;
			articles = found;
			articlesName = name;
			status = found.length > 0 ? 'found' : 'none';
			if (!fill) return;
			if (found.length > 0) {
				if (replaceable()) applyArticle(found[0]);
			} else clearSuggestion();
		} catch {
			if (current !== request || formState.busy) return;
			articles = [];
			articlesName = '';
			status = 'failed';
		}
	}

	$effect(() => {
		const name = query;
		if (existing) return;
		request += 1;
		if (!name || !autoFetch.event) return;
		const timer = setTimeout(() => {
			if (!formState.busy && untrack(replaceable)) void search(true);
		}, SEARCH_DELAY_MS);
		return () => clearTimeout(timer);
	});

	async function openArticles(): Promise<void> {
		articlesOpen = true;
		if (articlesName === query && articles.length > 0) {
			status = 'found';
			return;
		}
		await search(false);
	}

	function useArticle(article: EventArticle): void {
		articlesOpen = false;
		if ((descriptionReplaceable() && datesReplaceable()) || form.source?.title === article.title) {
			applyArticle(article, true);
			return;
		}
		pendingArticle = article;
		replaceOpen = true;
	}

	function confirmReplace(): void {
		if (pendingArticle) applyArticle(pendingArticle, true);
		pendingArticle = undefined;
		replaceOpen = false;
	}

	function removeSource(): void {
		form.source = null;
		autoDescription = null;
		autoDates = null;
	}

	function datesOf(article: EventArticle): string {
		return (
			formatDate(article.dates.yearFrom, article.dates.yearTo, article.dates.approximate) ?? ''
		);
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	function submit(): Promise<void> {
		return formState.run(async () => {
			errors = validateEventForm(form);
			if (Object.keys(errors).length > 0) return;
			request += 1;
			const snapshot = $state.snapshot(form);
			const draft = draftOfEventForm(snapshot);
			const result = await saveTimelineEvent(draft, existing?.id);
			if (result.error || !result.id) {
				formState.error = result.error ?? m.common.unexpectedError;
				return;
			}
			formState.saved = snapshot;
			await onsaved(draft);
		});
	}
</script>

<div class="page">
	<Form error={formState.error} errorTitle={m.timeline.form.errorTitle} onsubmit={submit}>
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

			<div class="description">
				<TextArea
					counter
					label={m.timeline.form.description}
					maxlength={EVENT_DESCRIPTION_MAX_LENGTH}
					placeholder={m.timeline.form.descriptionPlaceholder}
					rows={4}
					bind:value={form.description}
				/>
				{#if !autoFetch.event && !form.source && form.name.trim() !== ''}
					<div class="links">
						<TextButton inline onclick={openArticles}>
							{m.timeline.form.searchArticles}
						</TextButton>
					</div>
				{/if}
				{#if form.source}
					<div class="links">
						<span class="caption">
							{m.timeline.form.sourcePrefix}„{form.source.title}”, {form.source.licence}
						</span>
						<TextButton inline onclick={openArticles}>
							{m.timeline.form.pickArticle}
						</TextButton>
						<TextButton inline onclick={removeSource}>
							{m.timeline.form.removeSource}
						</TextButton>
					</div>
				{/if}
			</div>
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.timeline.form.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.timeline.form.saving : m.timeline.form.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.timeline.form.discardDescription} />

<ArticleDialog
	{articles}
	currentTitle={form.source?.title}
	description={m.timeline.articles.description(form.name.trim())}
	detail={datesOf}
	failedText={m.timeline.articles.failed}
	noneText={m.timeline.articles.none}
	onuse={useArticle}
	status={status === 'idle' ? 'searching' : status}
	bind:open={articlesOpen}
/>

<Dialog
	description={m.timeline.replaceConfirm.description}
	size="small"
	title={m.timeline.replaceConfirm.title}
	bind:open={replaceOpen}
>
	{#snippet footer()}
		<Button onclick={() => (replaceOpen = false)}>
			{m.timeline.replaceConfirm.keep}
		</Button>
		<Button onclick={confirmReplace} variant="primary">
			{m.timeline.replaceConfirm.replace}
		</Button>
	{/snippet}
</Dialog>

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

	.links {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-4);
	}

	.description {
		display: grid;
		gap: var(--spacing-2);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}
</style>
