<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import ImageUp from '@lucide/svelte/icons/image-up';
	import Trash from '@lucide/svelte/icons/trash';
	import { Button, Form, FormActions, IconButton, TextField } from '@study-atelier/ui';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { OWN_IMAGE_ACCEPT } from '#lib/images/bucket/bucket.ts';
	import { cropAvatar } from '#lib/profile/avatar/avatar.ts';
	import {
		avatarInitial,
		DISPLAY_NAME_MAX_LENGTH,
		profileDraftChanged,
		profileDraftOf,
		showsAvatar,
		validateDisplayName
	} from '#lib/profile/profile/profile.ts';
	import { saveProfile } from '#lib/profile/profile-data/profile-data.ts';
	import type { AvatarChange } from '#lib/profile/types/avatar-change.ts';
	import type { Profile } from '#lib/profile/types/profile.ts';
	import type { ProfileDraft } from '#lib/profile/types/profile-draft.ts';
	import Avatar from '#lib/profile/components/Avatar/Avatar.svelte';

	type Props = {
		profile: Profile;
		email: string;
		barHeight?: number;
		onsaved: (profile: Profile, message: string) => void | Promise<void>;
	};

	let { profile, email, barHeight = $bindable(0), onsaved }: Props = $props();

	const formId = $props.id();
	const hintId = `${formId}-hint`;

	const formState = new FormState<Profile>(untrack(() => profile));

	let name = $state(untrack(() => profileDraftOf(profile).name));
	let avatar = $state.raw<AvatarChange>({ kind: 'keep' });
	let previewUrl = $state<string>();
	let nameError = $state<string>();
	let photoError = $state<string>();
	let cropping = $state(false);
	let fileInput = $state<HTMLInputElement>();

	const changes = new UnsavedChanges<ProfileDraft>(
		() => ({ name, avatar }),
		() => profileDraftOf(formState.saved),
		profileDraftChanged
	);

	let hasAvatar = $derived(showsAvatar(formState.saved, avatar));
	let initial = $derived(avatarInitial({ displayName: name, avatarPath: null }, email));

	function setAvatar(next: AvatarChange): void {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = next.kind === 'replace' ? URL.createObjectURL(next.image) : undefined;
		avatar = next;
	}

	async function pick(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
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
		name = profileDraftOf(formState.saved).name;
		nameError = undefined;
		photoError = undefined;
		formState.error = '';
	}

	function submit(): Promise<void> {
		return formState.run(async () => {
			nameError = validateDisplayName(name);
			if (nameError) return;
			const result = await saveProfile({ name, avatar }, formState.saved);
			if (result.error !== undefined) {
				formState.error = result.error;
				return;
			}
			formState.saved = result.profile;
			name = profileDraftOf(result.profile).name;
			setAvatar({ kind: 'keep' });
			await onsaved(result.profile, m.settings.profile.saved);
		});
	}

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	onDestroy(() => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	});
</script>

<div class="tab">
	<Form error={formState.error} errorTitle={m.settings.profile.errorTitle} onsubmit={submit}>
		<div class="fields">
			<div class="photo">
				<div class="photo-row">
					<div class="mat">
						<Avatar
							{initial}
							large
							path={hasAvatar ? formState.saved.avatarPath : null}
							{previewUrl}
						/>
					</div>
					<div class="buttons">
						<IconButton
							disabled={formState.busy || cropping}
							icon={ImageUp}
							label={hasAvatar ? m.settings.profile.changePhoto : m.settings.profile.addPhoto}
							onclick={() => fileInput?.click()}
						/>
						{#if hasAvatar}
							<IconButton
								disabled={formState.busy}
								icon={Trash}
								label={m.settings.profile.removePhoto}
								onclick={() => setAvatar({ kind: 'remove' })}
								variant="danger"
							/>
						{/if}
					</div>
				</div>
				<span id={hintId} class="hint" class:error={photoError}>
					{photoError ?? m.settings.profile.photoHint}
				</span>
				<input
					bind:this={fileInput}
					accept={OWN_IMAGE_ACCEPT}
					aria-describedby={hintId}
					hidden
					onchange={pick}
					type="file"
				/>
			</div>
			<div class="inputs">
				<TextField
					autocomplete="given-name"
					error={nameError}
					label={m.settings.profile.name}
					maxlength={DISPLAY_NAME_MAX_LENGTH * 2}
					bind:value={name}
				/>
				<TextField
					disabled
					hint={m.settings.profile.emailHint}
					label={m.settings.profile.email}
					readonly
					type="email"
					value={email}
				/>
			</div>
		</div>
		<FormActions bind:height={barHeight}>
			<Button disabled={formState.busy} onclick={cancel}>
				{m.settings.profile.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.settings.profile.saving : m.settings.profile.save}
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

	.inputs {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	@media (min-width: 768px) {
		.fields {
			grid-template-columns: max-content minmax(0, var(--size-content-narrow));
			justify-content: start;
			column-gap: var(--spacing-12);
			max-width: none;
			width: auto;
		}
	}

	.photo {
		display: grid;
		justify-items: start;
		gap: var(--spacing-3);
	}

	.photo-row {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-4);
	}

	.mat {
		padding: var(--spacing-4);
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-surface);
	}

	.buttons {
		display: flex;
		flex-direction: column;
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
