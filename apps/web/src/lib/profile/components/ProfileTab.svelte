<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import {
		Alert,
		Button,
		FilePicker,
		Form,
		FormActions,
		TextButton,
		TextField
	} from '@study-atelier/ui';
	import DiscardDialog from '#lib/collection/components/DiscardDialog.svelte';
	import { UnsavedChanges } from '#lib/collection/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/index.ts';
	import { OWN_IMAGE_ACCEPT } from '#lib/images/bucket.ts';
	import { cropAvatar } from '../avatar.ts';
	import {
		avatarInitial,
		DISPLAY_NAME_MAX_LENGTH,
		profileDraftChanged,
		profileDraftOf,
		showsAvatar,
		validateDisplayName
	} from '../profile.ts';
	import { saveProfile } from '../profile-data.ts';
	import type { AvatarChange, Profile, ProfileDraft } from '../types.ts';
	import Avatar from './Avatar.svelte';

	type Props = {
		profile: Profile;
		email: string;
		barHeight?: number;
		onsaved: (profile: Profile, message: string) => void | Promise<void>;
	};

	let { profile, email, barHeight = $bindable(0), onsaved }: Props = $props();

	const formId = $props.id();
	const formErrorId = `${formId}-error`;
	const hintId = `${formId}-hint`;

	let saved = $state.raw<Profile>(untrack(() => profile));
	let name = $state(untrack(() => profileDraftOf(profile).name));
	let avatar = $state.raw<AvatarChange>({ kind: 'keep' });
	let previewUrl = $state<string>();
	let nameError = $state<string>();
	let photoError = $state<string>();
	let formError = $state('');
	let busy = $state(false);
	let cropping = $state(false);

	const changes = new UnsavedChanges<ProfileDraft>(
		() => ({ name, avatar }),
		() => profileDraftOf(saved),
		profileDraftChanged
	);

	let hasAvatar = $derived(showsAvatar(saved, avatar));
	let initial = $derived(avatarInitial({ displayName: name, avatarPath: null }, email));

	function setAvatar(next: AvatarChange): void {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = next.kind === 'replace' ? URL.createObjectURL(next.image) : undefined;
		avatar = next;
	}

	async function pick(file: File): Promise<void> {
		photoError = undefined;
		cropping = true;
		const result = await cropAvatar(file);
		cropping = false;
		if ('error' in result) {
			photoError = result.error;
			return;
		}
		setAvatar({ kind: 'replace', image: result.image });
	}

	function cancel(): void {
		setAvatar({ kind: 'keep' });
		name = profileDraftOf(saved).name;
		nameError = undefined;
		photoError = undefined;
		formError = '';
	}

	async function showError(message: string): Promise<void> {
		formError = message;
		await tick();
		document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
	}

	async function submit(): Promise<void> {
		if (busy) return;
		formError = '';
		nameError = validateDisplayName(name);
		if (nameError) return;
		busy = true;
		try {
			const result = await saveProfile({ name, avatar }, saved);
			if (result.error !== undefined) {
				await showError(result.error);
				return;
			}
			saved = result.profile;
			name = profileDraftOf(saved).name;
			setAvatar({ kind: 'keep' });
			await onsaved(saved, m.settings.profile.saved);
		} finally {
			busy = false;
		}
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	onDestroy(() => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	});
</script>

<div class="tab">
	<Form onsubmit={submit}>
		<div class="fields">
			{#if formError}
				<Alert id={formErrorId} title={m.settings.profile.errorTitle} tone="danger">
					{formError}
				</Alert>
			{/if}
			<div class="photo">
				<Avatar {initial} large path={hasAvatar ? saved.avatarPath : null} {previewUrl} />
				<div class="photo-actions">
					<div class="buttons">
						<FilePicker
							accept={OWN_IMAGE_ACCEPT}
							describedby={hintId}
							disabled={busy || cropping}
							label={hasAvatar ? m.settings.profile.changePhoto : m.settings.profile.addPhoto}
							onpick={pick}
						/>
						{#if hasAvatar}
							<TextButton disabled={busy} onclick={() => setAvatar({ kind: 'remove' })}>
								{m.settings.profile.removePhoto}
							</TextButton>
						{/if}
					</div>
					<span id={hintId} class="hint" class:error={photoError}>
						{photoError ?? m.settings.profile.photoHint}
					</span>
				</div>
			</div>
			<TextField
				autocomplete="given-name"
				error={nameError}
				label={m.settings.profile.name}
				maxlength={DISPLAY_NAME_MAX_LENGTH * 2}
				bind:value={name}
			/>
		</div>
		<FormActions bind:height={barHeight}>
			<Button disabled={busy} onclick={cancel}>
				{m.settings.profile.cancel}
			</Button>
			<Button disabled={busy} type="submit" variant="primary">
				{busy ? m.settings.profile.saving : m.settings.profile.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.settings.profile.discardDescription} />

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

	.photo {
		display: flex;
		align-items: center;
		gap: var(--spacing-6);
	}

	.photo-actions {
		display: grid;
		gap: var(--spacing-2);
		justify-items: start;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-3);
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.error {
		color: var(--color-danger);
	}
</style>
