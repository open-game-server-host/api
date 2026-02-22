import { OGSHError } from "@open-game-server-host/backend-lib";
import { WebSocket } from "ws";

export type WsConnectionType =
    | "user"
    | "daemon"
;

// TODO change this to a system similar to how the db works - switch between local, redis, maybe rabbitmq?
const connections = new Map<string, WebSocket>();

function getConnectionId(type: WsConnectionType, id: string): string {
    return `${type}/${id}`;
}

export function registerWsConnection(type: WsConnectionType, id: string, ws: WebSocket): string {
    const connectionId = getConnectionId(type, id);
    connections.set(connectionId, ws);
    return connectionId;
}

export function unregisterWsConnection(connectionId: string) {
    connections.delete(connectionId);
}

// TODO distributed websockets across all API instances using redis or similar - not sure how file uploads/downloads are going to work with that though

export async function sendMessageToDaemon(daemonId: string, route: string, action: string, body: any) {
    const connectionId = getConnectionId("daemon", daemonId);
    const ws = connections.get(connectionId);
    if (!ws) {
        throw new OGSHError("general/unspecified", `daemon id '${daemonId}' websocket not connected`);
    }
    ws.send(JSON.stringify({
        route,
        body
    }));
}

export async function sendMessageToUser(userId: string, msg: string) {
    const connectionId = getConnectionId("user", userId);
    const ws = connections.get(connectionId);
    if (!ws) {
        throw new OGSHError("general/unspecified", `user id '${userId}' websocket not connected`);
    }
    ws.send(msg);
}

export async function sendMessageToContainerUsers(containerId: string, msg: string) {
    
}