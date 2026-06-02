import { defineWebSocketHandler, type H3 } from 'h3';
import { hooks } from '../controllers/socket.controller';

export default function useSocketRoute(app: H3) {
    app.get('/_ws', defineWebSocketHandler(hooks));
}
