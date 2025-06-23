<script lang="ts">
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import { ArrowBigLeft, ArrowLeftFromLine, ChevronLeft, Github, MoveLeft } from '@lucide/svelte';
	import BgUpload from '../../../(default)/BgUpload.svelte';
	import type { LayoutProps } from './$types';

	const { data, children }: LayoutProps = $props();
	const todo = $derived(data.todo);
</script>

<main
	class="@container flex-1 *:p-4 bg-secondary-container text-secondary-container-fg"
>
	<div class="bg-secondary-container flex justify-between gap-8 items-center">
		<div class="flex items-baseline gap-4">
			<a href="/" aria-label="Back to home" title="Back to home" class="c-button">
				<MoveLeft />
			</a>
			<h1 class="font-playful text-h1 [view-transition-name:todo-title] w-fit text-pretty">
				{todo.title}
			</h1>
		</div>
		<div class="hidden gap-4 @md:flex">
			<BgUpload />
			<ThemeSwitch />
			<a
				href="https://github.com/duydang2311/later-app"
				aria-label="Github"
				target="_blank"
				title="Open Github"
				class="[view-transition-name:github-link]"
			>
				<Github />
			</a>
		</div>
	</div>
	{@render children()}
</main>
