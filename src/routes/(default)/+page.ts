import { Indexes } from '$lib/services/db';
import { logError } from '$lib/utils';
import { attempt } from '@duydang2311/attempt';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { db } = await parent();
	const openTx = await db.transaction('todos', 'readonly');
	if (openTx.failed) {
		logError('Failed to open transaction for todos')(openTx.error);
		return;
	}
	const index = openTx.data.store.index(Indexes.byDateAndTimestamp);
	const now = new Date();
	const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
	const getTodos = await attempt.async(() =>
		index.getAll(IDBKeyRange.bound([date, 0], [date, Number.POSITIVE_INFINITY]))
	)(logError('Failed to get todos from DB'));
	if (getTodos.failed) {
		return;
	}

	return {
		todos: getTodos.data,
	};
};
