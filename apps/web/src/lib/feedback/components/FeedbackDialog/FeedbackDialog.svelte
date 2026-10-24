<script lang="ts">
	import Bug from '@lucide/svelte/icons/bug';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import {
		Alert,
		Button,
		ChoiceTiles,
		Dialog,
		Form,
		TextArea,
		TextField,
		type ChoiceTile
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { sendFeedback } from '#lib/feedback/feedback-data/feedback-data.ts';
	import {
		FEEDBACK_DESCRIPTION_MAX,
		FEEDBACK_TITLE_MAX,
		emptyFeedback,
		hasFeedbackErrors,
		validateFeedback
	} from '#lib/feedback/feedback/feedback.ts';
	import type { FeedbackDraft } from '#lib/feedback/types/feedback-draft.ts';
	import type { FeedbackErrors } from '#lib/feedback/types/feedback-errors.ts';
	import type { FeedbackKind } from '#lib/feedback/types/feedback-kind.ts';

	type Props = {
		open?: boolean;
		onsent: () => void;
	};

	let { open = $bindable(false), onsent }: Props = $props();

	const formId = $props.id();

	const kinds: ChoiceTile[] = [
		{ value: 'bug', label: m.feedback.bug, icon: Bug },
		{ value: 'idea', label: m.feedback.idea, icon: Sparkles }
	];

	let draft = $state<FeedbackDraft>({ ...emptyFeedback });
	let errors = $state<FeedbackErrors>({});
	let failure = $state<string>();
	let sending = $state(false);

	function reset(): void {
		draft = { ...emptyFeedback };
		errors = {};
		failure = undefined;
	}

	async function submit(): Promise<void> {
		if (sending) return;
		failure = undefined;
		errors = validateFeedback(draft);
		if (hasFeedbackErrors(errors)) return;
		sending = true;
		const { error } = await sendFeedback(draft);
		sending = false;
		if (error) {
			failure = error;
			return;
		}
		open = false;
		reset();
		onsent();
	}

	function chooseKind(value: string | null): void {
		draft.kind = value as FeedbackKind | null;
		if (value) errors.kind = undefined;
	}
</script>

<Dialog description={m.feedback.description} title={m.feedback.title} bind:open>
	<Form id={formId} onsubmit={submit}>
		{#if failure}
			<Alert title={m.feedback.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		<div class="kind">
			<ChoiceTiles
				columns={2}
				label={m.feedback.kind}
				narrowColumns={2}
				onchange={chooseKind}
				options={kinds}
				value={draft.kind}
			/>
			{#if errors.kind}
				<span class="error">{errors.kind}</span>
			{/if}
		</div>
		<TextField
			error={errors.title}
			hint={m.feedback.titleHint}
			label={m.feedback.titleLabel}
			maxlength={FEEDBACK_TITLE_MAX}
			bind:value={draft.title}
		/>
		<TextArea
			counter
			hint={m.feedback.descriptionHint}
			label={m.feedback.descriptionLabel}
			maxlength={FEEDBACK_DESCRIPTION_MAX}
			bind:value={draft.description}
		/>
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.feedback.cancel}
		</Button>
		<Button disabled={sending} form={formId} type="submit" variant="primary">
			{sending ? m.feedback.sending : m.feedback.send}
		</Button>
	{/snippet}
</Dialog>

<style>
	.kind {
		display: grid;
		gap: var(--spacing-1);
	}

	.error {
		color: var(--color-danger);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
