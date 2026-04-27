export function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export function update<T extends Record<string, unknown>>(
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

export function omit<T extends Record<string, unknown>, K extends keyof T>(
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

export function addHours(date: Date, hours: number) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function getUrlParams(url: string) {
    const { searchParams } = new URL(url);

    return Object.fromEntries(searchParams.entries());
}

export function mergeHeaders(...sources: HeadersInit[]) {
    let result = new Headers();

    for (let headersInit of sources) {
        let headers = new Headers(headersInit);

        for (let [key, value] of headers.entries()) {
            result.set(key, value);
        }
    }

    return result;
}
