<script lang="ts">
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import Upload from '@lucide/svelte/icons/upload';
	import { Button, Dialog, FieldMessage, FilePicker, Icon, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		OWN_IMAGE_ACCEPT,
		OWN_IMAGE_MAX_MEGABYTES,
		ownImageFormats
	} from '#lib/images/bucket/bucket.ts';
	import type { ImageInput } from '#lib/images/image-input/image-input.svelte.ts';
	import PasteKeys from '#lib/images/components/PasteKeys/PasteKeys.svelte';

	type Props = {
		input: ImageInput;
		title: string;
	};

	let { input, title }: Props = $props();

	const id = $props.id();
	const fileMessageId = `${id}-file`;
	const fileHint = m.artworkForm.fileHint(ownImageFormats(), OWN_IMAGE_MAX_MEGABYTES);
</script>

<Dialog onclose={() => input.resetOwnImage()} {title} bind:open={input.dialogOpen}>
	<div class="own-image">
		<div class="paste-area">
			<Icon icon={Clipboard} />
			<p class="paste-lead">
				{m.artworkForm.pasteHintLead}
				<PasteKeys />
			</p>
			<div class="paste-actions">
				<Button
					aria-describedby={fileMessageId}
					disabled={input.pasting}
					onclick={() => input.pasteFromClipboard()}
				>
					<Icon icon={Clipboard} size="sm" />
					{m.artworkForm.pasteFromClipboard}
				</Button>
				<FilePicker
					accept={OWN_IMAGE_ACCEPT}
					describedby={fileMessageId}
					icon={Upload}
					label={m.artworkForm.chooseFile}
					onpick={(file) => input.pickFile(file)}
				/>
			</div>
			<FieldMessage id={fileMessageId} error={input.fileError} hint={fileHint} live />
		</div>
		<TextField
			autocomplete="off"
			error={input.urlError || undefined}
			inputmode="url"
			label={m.artworkForm.imageUrl}
			onkeydown={(event) => input.useUrlOnEnter(event)}
			placeholder={m.artworkForm.imageUrlPlaceholder}
			type="url"
			bind:value={input.urlText}
		>
			{#snippet action()}
				<Button disabled={input.loadingUrl} onclick={() => input.useUrl()}>
					{input.loadingUrl ? m.artworkForm.usingImageUrl : m.artworkForm.useImageUrl}
				</Button>
			{/snippet}
		</TextField>
	</div>
</Dialog>

<style>
	.own-image {
		display: grid;
		gap: var(--spacing-6);
	}

	.paste-area {
		display: grid;
		justify-items: center;
		gap: var(--spacing-3);
		padding: var(--spacing-6) var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
		color: var(--color-fg-muted);
		text-align: center;
	}

	.paste-lead {
		margin: 0;
	}

	.paste-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--spacing-2);
	}
</style>
