<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Foundations/Typography'
	});
</script>

<Story name="Text roles">
	{#snippet template()}
		<div style="display: grid; gap: var(--spacing-6); max-width: var(--size-content-default)">
			<h1>Page title (h1)</h1>
			<p class="lead">Lead: one sentence under the page title.</p>
			<h2>Section title (h2)</h2>
			<h3>Subsection title (h3)</h3>
			<p>Body text for notes and descriptions.</p>
			<p class="caption">Caption: metadata, hints and secondary details.</p>
			<cite class="artwork-title">Girl with a Pearl Earring</cite>
		</div>
	{/snippet}
</Story>
