<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { Alert, Button, Checkbox, Form, FormActions, Switch, ToggleTag } from '@study-atelier/ui';
	import DiscardDialog from '#lib/collection/components/DiscardDialog.svelte';
	import { UnsavedChanges } from '#lib/collection/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/index.ts';
	import {
		NEW_PER_DAY_CHOICES,
		preferencesChanged,
		QUIZ_KINDS,
		REVIEW_FORMS,
		SESSION_SIZES,
		toggledKind
	} from '../preferences.ts';
	import { savePreferences } from '../preferences-data.ts';
	import type { Preferences, PreferencesPart } from '../types.ts';

	type Props = {
		part: PreferencesPart;
		preferences: Preferences;
		barHeight?: number;
		onsaved: (preferences: Preferences, message: string) => void | Promise<void>;
	};

	let { part, preferences, barHeight = $bindable(0), onsaved }: Props = $props();

	const formId = $props.id();
	const formErrorId = `${formId}-error`;
	const kindsHintId = `${formId}-kinds`;

	let saved = $state.raw<Preferences>(untrack(() => preferences));
	let draft = $state<Preferences>(untrack(() => ({ ...preferences })));
	let kindsError = $state(false);
	let formError = $state('');
	let busy = $state(false);

	const changes = new UnsavedChanges<Preferences>(
		() => draft,
		() => saved,
		(current, reference) => preferencesChanged(part, current, reference)
	);

	function cancel(): void {
		draft = { ...saved };
		kindsError = false;
		formError = '';
	}

	function setKind(kind: (typeof QUIZ_KINDS)[number], on: boolean): void {
		draft.reviewQuizKinds = toggledKind(draft.reviewQuizKinds, kind, on);
		kindsError = false;
	}

	async function showError(message: string): Promise<void> {
		formError = message;
		await tick();
		document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
	}

	async function submit(): Promise<void> {
		if (busy) return;
		formError = '';
		kindsError = part === 'review' && draft.reviewQuizKinds.length === 0;
		if (kindsError) return;
		busy = true;
		try {
			const result = await savePreferences(part, draft);
			if (result.error !== undefined) {
				await showError(result.error);
				return;
			}
			saved = result.preferences;
			draft = { ...saved };
			await onsaved(saved, m.settings.preferences.saved);
		} finally {
			busy = false;
		}
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}
</script>

<div class="tab">
	<Form onsubmit={submit}>
		<div class="fields">
			{#if formError}
				<Alert id={formErrorId} title={m.settings.preferences.errorTitle} tone="danger">
					{formError}
				</Alert>
			{/if}
			{#if part === 'review'}
				<div class="group" aria-labelledby="{formId}-size" role="group">
					<span id="{formId}-size" class="label">{m.settings.preferences.sessionSize}</span>
					<div class="tags">
						{#each SESSION_SIZES as option (option)}
							<ToggleTag
								bind:pressed={
									() => draft.reviewSessionSize === option,
									(pressed) => pressed && (draft.reviewSessionSize = option)
								}
							>
								{option}
							</ToggleTag>
						{/each}
					</div>
				</div>
				<div class="group" aria-labelledby="{formId}-new" role="group">
					<span id="{formId}-new" class="label">{m.settings.preferences.newPerDay}</span>
					<div class="tags">
						{#each NEW_PER_DAY_CHOICES as option (option)}
							<ToggleTag
								bind:pressed={
									() => draft.reviewNewPerDay === option,
									(pressed) => pressed && (draft.reviewNewPerDay = option)
								}
							>
								{option}
							</ToggleTag>
						{/each}
					</div>
				</div>
				<div class="group" aria-labelledby="{formId}-form" role="group">
					<span id="{formId}-form" class="label">{m.settings.preferences.form}</span>
					<div class="tags">
						{#each REVIEW_FORMS as option (option)}
							<ToggleTag
								bind:pressed={
									() => draft.reviewForm === option,
									(pressed) => pressed && (draft.reviewForm = option)
								}
							>
								{m.review.forms[option]}
							</ToggleTag>
						{/each}
					</div>
					<span class="hint">{m.settings.preferences.formHint}</span>
				</div>
				<div
					class="group"
					aria-describedby={kindsHintId}
					aria-labelledby="{formId}-kinds-label"
					role="group"
				>
					<span id="{formId}-kinds-label" class="label">{m.settings.preferences.kinds}</span>
					{#each QUIZ_KINDS as kind (kind)}
						<Checkbox
							label={m.settings.preferences.kindLabels[kind]}
							bind:checked={() => draft.reviewQuizKinds.includes(kind), (on) => setKind(kind, on)}
						/>
					{/each}
					<span id={kindsHintId} class="hint" class:error={kindsError}>
						{m.settings.preferences.kindsHint}
					</span>
				</div>
				<Switch label={m.settings.preferences.free} bind:checked={draft.reviewFree} />
			{:else}
				<Switch label={m.settings.preferences.showPins} bind:checked={draft.viewShowPins} />
				<Switch label={m.settings.preferences.loupe} bind:checked={draft.viewLoupeOn} />
			{/if}
		</div>
		<FormActions bind:height={barHeight}>
			<Button disabled={busy} onclick={cancel}>
				{m.settings.preferences.cancel}
			</Button>
			<Button disabled={busy} type="submit" variant="primary">
				{busy ? m.settings.preferences.saving : m.settings.preferences.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.settings.preferences.discardDescription} />

<style>
	.tab {
		display: grid;
		flex: 1;
	}

	.tab > :global(form) {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	.group {
		display: grid;
		justify-items: start;
		gap: var(--spacing-3);
	}

	.label {
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-md);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.error {
		color: var(--color-danger);
	}
</style>
