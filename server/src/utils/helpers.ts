import type { Request } from 'express';

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

export function getAuthToken(req: Request) {
    const {
        headers: { authorization }
    } = req;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new Error('Invalid authorization');
    }

    const token = authorization.split(' ')[1];

    if (!token) {
        throw new Error('Invalide authorization token');
    }

    return token;
}
