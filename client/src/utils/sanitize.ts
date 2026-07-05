import { sanitize } from 'isomorphic-dompurify';

export function sanitizeString(str: string): string {
    return sanitize(str).trim();
}

export function sanitizeObject<T extends Record<string, any>, K extends keyof T, V extends T[K]>(
    obj: T
): T {
    const entries = Object.entries(obj) as [K, V][];

    return entries.reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
            acc[key] = sanitizeString(value.trim()) as V;
        } else {
            acc[key] = value;
        }

        return acc;
    }, {} as T);
}
