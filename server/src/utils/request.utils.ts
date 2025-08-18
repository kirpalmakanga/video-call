import type { H3Event } from 'h3';

export function getRequestAccessToken({ req: { headers } }: H3Event) {
    return headers.get('Authorization')?.split(' ').at(1);
}
