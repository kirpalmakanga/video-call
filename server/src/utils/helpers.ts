export function update<T extends object>(
    arr: T[],
    predicate: (item: T, index: number, array: T[]) => boolean,
    payload: Partial<T>
) {
    const targetIndex = arr.findIndex(predicate);

    if (targetIndex > -1) {
        return arr.with(targetIndex, { ...arr[targetIndex], ...payload } as T);
    }

    return arr;
}

export function omit<T extends object, K extends keyof T>(
    base: T,
    ...keys: K[]
): Omit<T, K> {
    if (keys.length) {
        const result = { ...base };

        for (const key of keys) delete result[key];

        return result;
    }

    return base;
}
