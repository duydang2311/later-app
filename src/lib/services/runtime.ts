import { getContext, setContext } from 'svelte';
import type { Db } from './db';
import type { Ref } from '$lib/runes/ref.svelte';
import type { Theme } from '@material/material-color-utilities';

interface Runtime {
	db: Db;
	scrollEl: Ref<HTMLElement | undefined>;
	colorScheme: Ref<'light' | 'dark' | 'system'>;
	theme: Ref<Theme | undefined>;
}

const symbol = Symbol('runtime');

export const setRuntime = (runtime: Runtime) => {
	return setContext(symbol, runtime);
};

export const useRuntime = () => {
	return getContext<Runtime>(symbol);
};
