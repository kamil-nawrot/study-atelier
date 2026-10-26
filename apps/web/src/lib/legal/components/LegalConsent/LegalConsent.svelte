<script lang="ts">
	import { Checkbox, FieldMessage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		checked: boolean;
		error?: string;
	};

	let { checked = $bindable(), error }: Props = $props();

	const messageId = $props.id();
</script>

<div class="consent">
	<Checkbox aria-describedby={messageId} aria-invalid={error ? 'true' : undefined} bind:checked>
		{m.legal.consentAccept}
		<a href={resolve('/(legal)/terms')} rel="noopener" target="_blank">{m.legal.consentTerms}</a>
		{m.legal.consentDeclare}
		<a href={resolve('/(legal)/privacy')} rel="noopener" target="_blank">{m.legal.consentPrivacy}</a
		>.
	</Checkbox>
	<FieldMessage id={messageId} {error} />
</div>

<style>
	.consent {
		display: grid;
		gap: var(--spacing-1);
	}
</style>
