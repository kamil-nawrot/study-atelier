<script lang="ts">
	import { untrack } from 'svelte';
	import { Checkbox, Switch, ToggleTag } from '@study-atelier/ui';
	import { SaveQueue } from '#lib/shared/forms/save-queue/save-queue.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		GLOSSARY_QUESTION_CHOICES,
		NEW_PER_DAY_CHOICES,
		preferencesChanged,
		QUIZ_KINDS,
		REVIEW_FORMS,
		SESSION_SIZES,
		toggledKind,
		hasArtworkQuiz,
		lastArtworkQuiz
	} from '#lib/profile/preferences/preferences.ts';
	import { savePreferences } from '#lib/profile/preferences-data/preferences-data.ts';
	import type { Preferences } from '#lib/profile/types/preferences.ts';
	import type { PreferencesPart } from '#lib/profile/types/preferences-part.ts';
	import SettingsSection from '#lib/profile/components/SettingsSection/SettingsSection.svelte';
	import SettingsCard from '#lib/profile/components/SettingsCard/SettingsCard.svelte';

	type Props = {
		part: PreferencesPart;
		preferences: Preferences;
		onsaved: (preferences: Preferences) => void | Promise<void>;
		onsending?: (preferences: Preferences) => void;
	};

	let { part, preferences, onsaved, onsending }: Props = $props();

	const formId = $props.id();
	const kindsHintId = `${formId}-kinds`;

	let saved = untrack(() => preferences);
	let sent = saved;
	let draft = $state<Preferences>(untrack(() => ({ ...preferences })));
	let kindsError = $derived(part === 'review' && !hasArtworkQuiz(draft.reviewQuizKinds));

	const queue = new SaveQueue<Preferences>(
		async (value) => {
			const result = await savePreferences(part, value);
			if (result.error !== undefined) {
				sent = saved;
				draft = { ...saved };
				onsending?.(saved);
				return result.error;
			}
			saved = result.preferences;
			await onsaved(result.preferences);
			return undefined;
		},
		{ latestOnly: true, failed: m.common.network }
	);

	$effect(() => {
		const current = $state.snapshot(draft) as Preferences;
		untrack(() => {
			if (kindsError || !preferencesChanged(part, current, sent)) return;
			sent = current;
			onsending?.(current);
			queue.push(current);
		});
	});

	function setKind(kind: (typeof QUIZ_KINDS)[number], on: boolean): void {
		draft.reviewQuizKinds = toggledKind(draft.reviewQuizKinds, kind, on);
	}
</script>

<SettingsCard error={queue.error} errorTitle={m.settings.preferences.errorTitle}>
	<div class="fields">
		{#if part === 'review'}
			<SettingsSection title={m.settings.preferences.sessionTitle}>
				<div class="items">
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
					<div class="described">
						<Switch
							aria-describedby="{formId}-free-hint"
							label={m.settings.preferences.free}
							bind:checked={draft.reviewFree}
						/>
						<p id="{formId}-free-hint" class="hint">{m.settings.preferences.freeHint}</p>
					</div>
				</div>
			</SettingsSection>
			<SettingsSection rule title={m.settings.preferences.quizzesTitle}>
				<div class="kinds">
					{#each QUIZ_KINDS as kind (kind)}
						<Checkbox
							aria-describedby={kindsHintId}
							disabled={lastArtworkQuiz(draft.reviewQuizKinds, kind)}
							label={m.settings.preferences.kindLabels[kind]}
							bind:checked={() => draft.reviewQuizKinds.includes(kind), (on) => setKind(kind, on)}
						/>
					{/each}
					<span id={kindsHintId} class="hint" class:error={kindsError}>
						{m.settings.preferences.kindsHint}
					</span>
				</div>
			</SettingsSection>
			<SettingsSection rule title={m.settings.preferences.extraTitle}>
				<div class="items">
					<div class="governed">
						<Switch
							label={m.settings.preferences.glossaryOn}
							bind:checked={draft.reviewGlossaryOn}
						/>
						<div class="group" aria-labelledby="{formId}-glossary" role="group">
							<span id="{formId}-glossary" class="label" class:off={!draft.reviewGlossaryOn}>
								{m.settings.preferences.glossaryQuestions}
							</span>
							<div class="tags">
								{#each GLOSSARY_QUESTION_CHOICES as option (option)}
									<ToggleTag
										disabled={!draft.reviewGlossaryOn}
										bind:pressed={
											() => draft.reviewGlossaryQuestions === option,
											(pressed) => pressed && (draft.reviewGlossaryQuestions = option)
										}
									>
										{option}
									</ToggleTag>
								{/each}
							</div>
						</div>
					</div>
					<Switch
						label={m.settings.preferences.noteQuestions}
						bind:checked={draft.reviewNoteQuestions}
					/>
					<Switch
						label={m.settings.preferences.timeQuestions}
						bind:checked={draft.reviewTimeQuestions}
					/>
				</div>
			</SettingsSection>
		{:else if part === 'sources'}
			<div class="items narrow">
				<p class="hint">{m.settings.preferences.sourcesHint}</p>
				<Switch label={m.settings.preferences.fetchImage} bind:checked={draft.fetchImage} />
				<Switch
					label={m.settings.preferences.fetchDefinition}
					bind:checked={draft.fetchDefinition}
				/>
				<Switch label={m.settings.preferences.fetchForms} bind:checked={draft.fetchForms} />
				<Switch label={m.settings.preferences.fetchEvent} bind:checked={draft.fetchEvent} />
			</div>
		{:else}
			<div class="items narrow">
				<p class="hint">{m.settings.preferences.viewHint}</p>
				<Switch label={m.settings.preferences.showPins} bind:checked={draft.viewShowPins} />
				<Switch label={m.settings.preferences.loupe} bind:checked={draft.viewLoupeOn} />
			</div>
		{/if}
	</div>
</SettingsCard>

<style>
	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
		width: 100%;
		min-width: 0;
	}

	.items {
		display: grid;
		gap: var(--spacing-6);
	}

	.narrow {
		max-width: var(--size-content-default);
	}

	.items > :global(.switch),
	.described > :global(.switch),
	.governed > :global(.switch) {
		display: flex;
		justify-content: space-between;
	}

	.described {
		display: grid;
		gap: var(--spacing-1);
	}

	.governed {
		display: grid;
		gap: var(--spacing-4);
	}

	.kinds {
		display: grid;
		justify-items: start;
		gap: var(--spacing-3);
	}

	.group {
		display: grid;
		justify-items: start;
		gap: var(--spacing-3);
	}

	.label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.off {
		color: var(--color-fg-muted);
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
