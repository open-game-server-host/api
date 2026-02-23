import { ContainerAppData, ContainerRegisterData, OGSHError } from "@open-game-server-host/backend-lib";
import { WebSocket } from "ws";
import { Broker, UserMessage } from "./broker.js";

export class LocalMessageBroker implements Broker {
    private containerIdByWebsocket = new Map<WebSocket, string>();
    private websocketByUserId = new Map<string, WebSocket>();

    private websocketByDaemonId = new Map<string, WebSocket>();

    async registerUserConnection(userId: string, ws: WebSocket, containerId: string): Promise<void> {
        this.websocketByUserId.set(userId, ws);
        this.containerIdByWebsocket.set(ws, containerId);
    }

    async removeUserConnection(userId: string): Promise<void> {
        const ws = this.websocketByUserId.get(userId);
        if (!ws) {
            return;
        }
        this.websocketByUserId.delete(userId);
        this.containerIdByWebsocket.delete(ws);
    }

    private getWebsocketsForContainer(containerId: string): WebSocket[] {
        const sockets: WebSocket[] = [];
        this.containerIdByWebsocket.forEach((cId, ws) => {
            if (cId === containerId) {
                sockets.push(ws);
            }
        });
        return sockets;
    }

    async sendLogsAndStatsToUsers(containerId: string, body: any): Promise<void> {
        const msg: UserMessage = {
            type: "containerOutput",
            body
        }
        const msgString = JSON.stringify(msg);
        this.getWebsocketsForContainer(containerId).forEach(ws => {
            ws.send(msgString);
        });
    }

    async registerDaemonConnection(daemonId: string, ws: WebSocket): Promise<void> {
        this.websocketByDaemonId.set(daemonId, ws);
    }

    async removeDaemonConnection(daemonId: string): Promise<void> {
        this.websocketByDaemonId.delete(daemonId);
    }

    private getDaemonWebsocket(daemonId: string): WebSocket {
        const ws = this.websocketByDaemonId.get(daemonId);
        if (!ws) {
            throw new OGSHError("general/unspecified", `could not get websocket for dameon id '${daemonId}'`);
        }
        return ws;
    }

    async startContainer(daemonId: string, containerId: string): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "start",
            body: {
                containerId
            }
        }));
    }

    async stopContainer(daemonId: string, containerId: string): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "stop",
            body: {
                containerId
            }
        }));
    }

    async restartContainer(daemonId: string, containerId: string): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "restart",
            body: {
                containerId
            }
        }));
    }

    async killContainer(daemonId: string, containerId: string): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "kill",
            body: {
                containerId
            }
        }));
    }

    async sendCommandToContainer(daemonId: string, containerId: string, command: string): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "command",
            body: {
                containerId,
                command
            }
        }));
    }

    async installContainer(daemonId: string, containerId: string, data: ContainerAppData): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "install",
            body: {
                containerId,
                ...data
            }
        }));
    }

    async registerContainer(daemonId: string, containerId: string, data: ContainerRegisterData): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "register",
            body: data
        }));
    }

    async removeContainer(daemonId: string, containerId: string): Promise<void> {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "remove",
            body: {
                containerId
            }
        }));
    }
}