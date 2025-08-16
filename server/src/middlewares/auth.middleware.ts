import type { H3Event } from 'h3';
import { getUserIdFromToken } from '../utils/jwt.utils';
import { unauthorized } from '../utils/response.utils';

export async function isAuthenticated(event: H3Event) {
    const accessToken = event.req.headers
        .get('Authorization')
        ?.split(' ')
        .pop();

    if (!accessToken) {
        return unauthorized();
    }

    try {
        event.context.userId = await getUserIdFromToken(accessToken);
    } catch (error) {
        unauthorized();
    }
}
