import { defineWebSocketHandler, type H3 } from 'h3';
import { plugin as ws } from 'crossws/server';

function parseMessage() {}

export function useSocketHandler(app: H3) {
    app.get(
        '/_ws',
        defineWebSocketHandler({
            open(peer) {
                console.log('[ws] open', peer);
                // peer.send({ user: 'server', message: `Welcome ${peer}!` });
            },

            message(peer, message) {
                console.log(message);
                const { event, payload } = message.json();

                console.log({ event, payload });
                // if (message.text().includes('ping')) {
                //     peer.send({ user: 'server', message: 'pong' });
                // } else {
                //     peer.send({
                //         user: peer.toString(),
                //         message: message.toString()
                //     });
                // }
            },

            close(peer, event) {
                console.log('[ws] close', peer, event);
            },

            error(peer, error) {
                console.log('[ws] error', peer, error);
            }
        })
    );
}

export function useSocketPlugin(app: H3) {
    return ws({
        async resolve(req) {
            const { crossws } = await app.fetch(req);

            return crossws;
        }
    });
}
