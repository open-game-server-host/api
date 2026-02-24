import { ContainerAppData, ContainerRegisterData, OGSHError } from "@open-game-server-host/backend-lib";
import { WebSocket } from "ws";
import { DaemonWsMessage } from "../../interfaces/daemon.js";
import { Broker, UserMessage } from "./broker.js";

export class LocalMessageBroker implements Broker {
    private readonly containerIdByWebsocket = new Map<WebSocket, string>();
    private readonly websocketByAuthUid = new Map<string, WebSocket>();
    private readonly websocketByDaemonId = new Map<string, WebSocket>();

    async registerUserConnection(authUid: string, ws: WebSocket, containerId: string): Promise<void> {
        this.websocketByAuthUid.set(authUid, ws);
        this.containerIdByWebsocket.set(ws, containerId);
    }

    async removeUserConnection(authUid: string): Promise<void> {
        const ws = this.websocketByAuthUid.get(authUid);
        if (!ws) {
            return;
        }
        this.websocketByAuthUid.delete(authUid);
        this.containerIdByWebsocket.delete(ws);
    }

    protected getWebsocketsForContainer(containerId: string): WebSocket[] {
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

    protected getDaemonWebsocket(daemonId: string): WebSocket {
        const ws = this.websocketByDaemonId.get(daemonId);
        if (!ws) {
            throw new OGSHError("general/unspecified", `could not get websocket for dameon id '${daemonId}'`);
        }
        return ws;
    }

    async startContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "start",
            body: {
                containerId
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async stopContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "stop",
            body: {
                containerId
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async restartContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "restart",
            body: {
                containerId
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async killContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "kill",
            body: {
                containerId
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async sendCommandToContainer(daemonId: string, containerId: string, command: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "command",
            body: {
                containerId,
                command
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async installContainer(daemonId: string, containerId: string, data: ContainerAppData): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "install",
            body: {
                containerId,
                ...data
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async registerContainer(daemonId: string, containerId: string, data: ContainerRegisterData): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "register",
            body: data
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }

    async removeContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "remove",
            body: {
                containerId
            }
        }
        this.getDaemonWebsocket(daemonId).send(JSON.stringify(msg));
    }
}