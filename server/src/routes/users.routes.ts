import { isAuthenticated } from '../middlewares/auth.middleware';
import { getProfile, updateProfile } from '../controllers/users.controller';
import { createRouter } from '../utils/routes.utils';
import { validateRequest } from '../middlewares/validation.middleware';
import { updateProfileSchema } from '../validation/user.validation';

export default createRouter([
    {
        method: 'get',
        path: '/profile',
        middlewares: [isAuthenticated],
        handler: getProfile
    },
    {
        method: 'put',
        path: '/profile',
        middlewares: [
            isAuthenticated,
            validateRequest({ body: updateProfileSchema })
        ],
        handler: updateProfile
    }
]);
