import { defineWebSocketHandler, type H3 } from 'h3';

export function useSocketHandler(app: H3) {
    app.get(
        '/_ws',
        defineWebSocketHandler({
            open(peer) {
                console.log('[ws] open', peer);
                // peer.send({ user: 'server', message: `Welcome ${peer}!` });
            },

            message(peer, message) {
                console.log('[ws] message', message);
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
