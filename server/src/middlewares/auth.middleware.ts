import type { H3Event } from 'h3';
import { getUserIdFromToken } from '../utils/jwt.utils';
import { unauthorized } from '../utils/response.utils';
import { getRequestAccessToken } from '../utils/request.utils';
import { captureError } from '../../../shared/utils/error';

export function useAuthentication() {
    return async (event: H3Event) => {
        if (!event.context.matchedRoute?.meta?.authenticated) {
            return;
        }

        const accessToken = getRequestAccessToken(event);

        if (accessToken) {
            try {
                event.context.userId = await getUserIdFromToken(accessToken);
            } catch (error) {
                captureError(error as Error);

                unauthorized();
            }
        } else {
            unauthorized();
        }
    };
}
