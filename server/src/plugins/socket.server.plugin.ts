import { type H3 } from 'h3';
import { plugin as ws } from 'crossws/server';

export function socket(app: H3) {
    return ws({
        //@ts-ignore
        resolve: async (req) => (await app.fetch(req)).crossws
    });
}
