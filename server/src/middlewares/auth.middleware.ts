import type { H3Event } from 'h3';
import { getUserIdFromToken } from '../utils/jwt.utils';
import { unauthorized } from '../utils/response.utils';

export function useAuthentication() {
    return async (event: H3Event) => {
        if (!event.context.matchedRoute?.meta?.authenticated) {
            return;
        }

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
    };
}
