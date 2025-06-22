<script lang="ts">
	import { useRuntime } from '$lib/services/runtime';
	import { generateNanoId, getUserLocales, logError } from '$lib/utils';
	import { attempt } from '@duydang2311/attempt';
	import { Editor, Extension } from '@tiptap/core';
	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Placeholder from '@tiptap/extension-placeholder';
	import Text from '@tiptap/extension-text';
	import slug from 'slug';
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';
	import Todos from './Todos.svelte';

	let caretEl = $state.raw<HTMLDivElement>();
	let caretLh = 1;
	let blinkTimeout = 0;
	let caretHeight: number | undefined;
	let editor = $state.raw<Editor>();
	let springCaretWidth = new Spring(16, { damping: 0.6, stiffness: 0.3 });
	let todosHandle = $state.raw<Todos>();
	let todosContainerEl = $state.raw<HTMLDivElement>();
	const springTop = new Spring(0, { damping: 0.6, stiffness: 0.2 });
	const springLeft = new Spring(0, { damping: 0.6, stiffness: 0.2 });
	const { scrollEl, db } = useRuntime();

	const updateCaret = (editor: Editor, instant?: boolean) => {
		if (!caretEl) {
			return;
		}

		caretHeight ??= parseFloat(getComputedStyle(caretEl).lineHeight);

		const from = editor.state.selection.from;
		const fromCoords = editor.view.coordsAtPos(Math.min(from, editor.state.doc.content.size - 1));
		let top = fromCoords.top + (fromCoords.bottom - fromCoords.top - caretHeight) / 2;
		let left = fromCoords.left;

		top += (scrollEl.current?.scrollTop ?? 0) - (window.visualViewport?.offsetTop ?? 0);
		left += (scrollEl.current?.scrollLeft ?? 0) - (window.visualViewport?.offsetLeft ?? 0);

		springTop.set(top, {
			instant,
		});
		springLeft.set(left, { instant });
		if (!editor.state.selection.empty) {
			springCaretWidth.set(0, { instant: true });
		} else {
			springCaretWidth.set(from >= editor.state.doc.content.size - 1 ? 16 : 2);
		}

		caretEl?.classList.remove('animate-caret-blink', 'animate-caret-pop');
		requestAnimationFrame(() => {
			caretEl?.classList.add('animate-caret-pop');
		});
		if (blinkTimeout) {
			clearTimeout(blinkTimeout);
		}
		blinkTimeout = setTimeout(() => {
			caretEl?.classList.remove('animate-caret-pop');
			if (editor.isFocused) {
				caretEl?.classList.add('animate-caret-blink');
			}
		}, 400);
	};

	const onSubmit = async (editor: Editor) => {
		if (editor.isEmpty) {
			return;
		}
		const title = editor.getText();
		editor.commands.clearContent();
		updateCaret(editor);

		const now = new Date();
		const openTx = await db.transaction('todos', 'readwrite');
		if (openTx.failed) {
			logError('Failed to open transaction for todos')(openTx.error);
			return;
		}

		await Promise.all([
			attempt.async(() =>
				openTx.data.store.put({
					id: crypto.randomUUID(),
					publicId: generateNanoId(),
					timestamp: now.getTime(),
					date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
					title,
					slug: slug(title),
					completed: false,
				})
			)(logError('Failed to put todo in DB')),
			attempt.async(() => openTx.data.done)(
				logError('Failed to commit transaction for adding todo')
			),
		]);
		await todosHandle?.invalidate();
	};

	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			if (editor) {
				updateCaret(editor, true);
			}
		});
		resizeObserver.observe(document.documentElement);
		if (todosContainerEl) {
			resizeObserver.observe(todosContainerEl);
		}
		return () => {
			resizeObserver.disconnect();
		};
	});

	$effect(() => {
		const handler = () => {
			if (editor) {
				updateCaret(editor, true);
			}
		};
		scrollEl.current?.addEventListener('scroll', handler);
		return () => {
			scrollEl.current?.removeEventListener('scroll', handler);
		};
	});
</script>

<main
	class="flex-1 flex flex-col justify-end max-w-3xl w-full overflow-hidden min-h-128 mx-auto gap-16"
>
	<div class="px-8">
		<p class="font-sm font-medium text-base-fg/40">
			{Intl.DateTimeFormat(getUserLocales(), { dateStyle: 'medium' }).format(Date.now())}
		</p>
		<p class="font-sm font-medium text-base-fg lowercase">What might you do today?</p>
		<div class="relative mt-1">
			<div
				{@attach (el) => {
					editor = new Editor({
						element: el,
						extensions: [
							Document,
							Text,
							Paragraph,
							Placeholder.configure({
								placeholder: 'start typing...',
								showOnlyWhenEditable: true,
								showOnlyCurrent: true,
							}),
							Extension.create({
								name: 'submit',
								addKeyboardShortcuts() {
									return {
										Enter: () => {
											onSubmit(editor!);
											return true;
										},
									};
								},
							}),
						],
						injectCSS: true,
						autofocus: true,
						editorProps: {
							attributes: {
								spellcheck: 'false',
								class: 'focus:outline-none font-playful text-3xl caret-transparent text-base-fg',
							},
						},
						onTransaction: ({ editor: e }) => {
							editor = undefined;
							editor = e;
							updateCaret(editor);
						},
					});
				}}
			></div>
			{#if editor != null && !editor.isEmpty}
				<div
					class="absolute -bottom-4 translate-y-full left-0 font-sans text-sm align-baseline text-base-fg/40 lowercase text-nowrap"
				>
					Press <span
						class="p-1 bg-primary/10 text-primary rounded-sm border border-primary/2 normal-case font-medium"
					>
						Enter
					</span> once it's done.
				</div>
			{/if}
		</div>
	</div>
	<div bind:this={todosContainerEl} class="flex flex-col max-h-full overflow-auto">
		<Todos bind:this={todosHandle} />
	</div>
</main>
<div
	bind:this={caretEl}
	class={[
		'absolute w-(--_width) text-3xl rounded-sm transition-colors',
		editor?.isFocused ? 'bg-primary animate-caret-blink' : 'bg-transparent',
	]}
	style="--_width: {springCaretWidth.current}px; height: {caretLh}lh; top: {springTop.current}px; left: {springLeft.current}px;"
></div>

<style>
	@keyframes caret-pop {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.9);
			opacity: 0.8;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes caret-blink {
		0% {
			opacity: 1;
		}
		20% {
			opacity: 0.4;
		}
		40% {
			opacity: 1;
		}
		60% {
			opacity: 0.4;
		}
		80% {
			opacity: 1;
		}
	}

	.animate-caret-blink {
		animation: caret-blink 3s ease infinite;
	}

	:global(.animate-caret-pop) {
		animation: caret-pop 100ms ease;
	}

	:global(.animate-caret-blink.animate-caret-pop) {
		animation:
			caret-pop 100ms ease,
			caret-blink 3s ease infinite alternate;
	}

	:global(.tiptap::selection) {
		background-color: var(--color-primary);
		color: var(--color-primary-fg);
	}

	@layer base {
		:global(p.is-editor-empty:first-child::before) {
			color: color-mix(in oklch, var(--color-base-fg) 40%, transparent);
			content: attr(data-placeholder);
			float: left;
			height: 0;
			pointer-events: none;
		}
	}
</style>
