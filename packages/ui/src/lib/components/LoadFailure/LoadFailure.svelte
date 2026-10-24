<script lang="ts">
	import Alert from '../Alert/Alert.svelte';
	import Button from '../Button/Button.svelte';
	import Section from '../Section/Section.svelte';

	type Props = {
		notFound: boolean;
		message: string;
		heading?: string;
		errorTitle?: string;
		backHref: string;
		backLabel: string;
	};

	let { notFound, message, heading, errorTitle, backHref, backLabel }: Props = $props();
</script>

<Section>
	{#if heading}
		<h1>{heading}</h1>
	{/if}
	{#if notFound}
		<p class="lead">{message}</p>
	{:else}
		<Alert title={errorTitle} tone="danger">
			{message}
		</Alert>
	{/if}
</Section>
<div>
	<Button href={backHref}>
		{backLabel}
	</Button>
</div>
