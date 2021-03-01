import { UniqueIdHelper } from "../apiBase";
import WebSocket from "ws"
import { PayloadInterface, SocketConnectionInterface } from "./Interfaces";

export class SocketHelper {

    private static wss: WebSocket.Server = null;
    private static connections: SocketConnectionInterface[] = [];

    static init = () => {
        const port = parseInt(process.env.SOCKET_PORT, 0);
        if (port > 0) {
            SocketHelper.wss = new WebSocket.Server({ port });
            console.log("Listening on websocket port " + port);

            SocketHelper.wss.on('connection', (socket) => {
                const sc: SocketConnectionInterface = { id: UniqueIdHelper.shortId(), socket }
                SocketHelper.connections.push(sc);
                console.log("Connection established - " + sc.id);
                const payload: PayloadInterface = { churchId: "", conversationId: "", action: "socketId", data: sc.id }
                sc.socket.send(JSON.stringify(payload));
            });
        }
    }

    static getConnection = (id: string) => {
        let result: SocketConnectionInterface = null;
        SocketHelper.connections.forEach(sc => { if (sc.id === id) result = sc; });
        return result;
    }

    static deleteConnection = (id: string) => {
        for (let i = SocketHelper.connections.length - 1; i >= 0; i--) {
            const sc = SocketHelper.connections[i];
            if (sc.id === id) SocketHelper.connections.splice(i, 1);
        }
    }

}