<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const todo = $derived(data.todo);
</script>

<div class="mt-2">
	{#if todo.content}
		<p>{todo.content}</p>
	{:else}
		<p>No content provided.</p>
	{/if}
</div>
