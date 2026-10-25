<script lang="ts">
	import { untrack } from 'svelte';
	import { Button, Checkbox, Form, FormActions, Switch, ToggleTag } from '@study-atelier/ui';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		NEW_PER_DAY_CHOICES,
		preferencesChanged,
		QUIZ_KINDS,
		REVIEW_FORMS,
		SESSION_SIZES,
		toggledKind
	} from '#lib/profile/preferences/preferences.ts';
	import { savePreferences } from '#lib/profile/preferences-data/preferences-data.ts';
	import type { Preferences } from '#lib/profile/types/preferences.ts';
	import type { PreferencesPart } from '#lib/profile/types/preferences-part.ts';

	type Props = {
		part: PreferencesPart;
		preferences: Preferences;
		barHeight?: number;
		onsaved: (preferences: Preferences, message: string) => void | Promise<void>;
	};

	let { part, preferences, barHeight = $bindable(0), onsaved }: Props = $props();

	const formId = $props.id();
	const kindsHintId = `${formId}-kinds`;

	const formState = new FormState<Preferences>(untrack(() => preferences));

	let draft = $state<Preferences>(untrack(() => ({ ...preferences })));
	let kindsError = $state(false);

	const changes = new UnsavedChanges<Preferences>(
		() => draft,
		() => formState.saved,
		(current, reference) => preferencesChanged(part, current, reference)
	);

	function cancel(): void {
		draft = { ...formState.saved };
		kindsError = false;
		formState.error = '';
	}

	function setKind(kind: (typeof QUIZ_KINDS)[number], on: boolean): void {
		draft.reviewQuizKinds = toggledKind(draft.reviewQuizKinds, kind, on);
		kindsError = false;
	}

	function submit(): Promise<void> {
		return formState.run(async () => {
			kindsError = part === 'review' && draft.reviewQuizKinds.length === 0;
			if (kindsError) return;
			const result = await savePreferences(part, draft);
			if (result.error !== undefined) {
				formState.error = result.error;
				return;
			}
			formState.saved = result.preferences;
			draft = { ...result.preferences };
			await onsaved(result.preferences, m.settings.preferences.saved);
		});
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}
</script>

<div class="tab">
	<Form error={formState.error} errorTitle={m.settings.preferences.errorTitle} onsubmit={submit}>
		<div class="fields">
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
			{:else if part === 'sources'}
				<p class="hint">{m.settings.preferences.sourcesHint}</p>
				<Switch label={m.settings.preferences.fetchImage} bind:checked={draft.fetchImage} />
				<Switch
					label={m.settings.preferences.fetchDefinition}
					bind:checked={draft.fetchDefinition}
				/>
				<Switch label={m.settings.preferences.fetchForms} bind:checked={draft.fetchForms} />
				<Switch label={m.settings.preferences.fetchEvent} bind:checked={draft.fetchEvent} />
			{:else}
				<Switch label={m.settings.preferences.showPins} bind:checked={draft.viewShowPins} />
				<Switch label={m.settings.preferences.loupe} bind:checked={draft.viewLoupeOn} />
			{/if}
		</div>
		<FormActions bind:height={barHeight}>
			<Button disabled={formState.busy} onclick={cancel}>
				{m.settings.preferences.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.settings.preferences.saving : m.settings.preferences.save}
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

	.tab > :global(form) > :global([role='alert']) {
		max-width: var(--size-content-default);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	.fields > :global(.switch) {
		display: flex;
		justify-content: space-between;
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
