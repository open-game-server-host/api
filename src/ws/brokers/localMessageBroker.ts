import { ContainerAppData, ContainerRegisterData, OGSHError } from "@open-game-server-host/backend-lib";
import { WebSocket } from "ws";
import { Broker, UserMessage } from "./broker.js";

export class LocalMessageBroker implements Broker {
    private containerIdByWebsocket = new Map<WebSocket, string>();
    private websocketByAuthUid = new Map<string, WebSocket[]>();

    private websocketByDaemonId = new Map<string, WebSocket>();

    async registerUserConnection(authUid: string, ws: WebSocket, containerId: string) {
        if (!this.websocketByAuthUid.has(authUid)) {
            this.websocketByAuthUid.set(authUid, [ws]);
        } else {
            this.websocketByAuthUid.get(authUid)!.push(ws);
        }
        this.containerIdByWebsocket.set(ws, containerId);
    }

    async removeUserConnection(authUid: string) {
        const websockets = this.websocketByAuthUid.get(authUid);
        if (!websockets) {
            return;
        }
        this.websocketByAuthUid.delete(authUid);
        websockets.forEach(ws => this.containerIdByWebsocket.delete(ws));
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

    async listUserContainerWebsockets(authUid: string, containerId: string): Promise<WebSocket[]> {
        return this.websocketByAuthUid.get(authUid) || [];
    }

    async sendLogsAndStatsToUsers(containerId: string, body: any) {
        const msg: UserMessage = {
            type: "containerOutput",
            body
        }
        const msgString = JSON.stringify(msg);
        this.getWebsocketsForContainer(containerId).forEach(ws => {
            ws.send(msgString);
        });
    }

    async registerDaemonConnection(daemonId: string, ws: WebSocket) {
        this.websocketByDaemonId.set(daemonId, ws);
    }

    async removeDaemonConnection(daemonId: string) {
        this.websocketByDaemonId.delete(daemonId);
    }

    private getDaemonWebsocket(daemonId: string): WebSocket {
        const ws = this.websocketByDaemonId.get(daemonId);
        if (!ws) {
            throw new OGSHError("daemon/disconnected", `could not get websocket for dameon id '${daemonId}'`);
        }
        return ws;
    }

    async startContainer(daemonId: string, containerId: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "start",
            body: {
                containerId
            }
        }));
    }

    async stopContainer(daemonId: string, containerId: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "stop",
            body: {
                containerId
            }
        }));
    }

    async restartContainer(daemonId: string, containerId: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "restart",
            body: {
                containerId
            }
        }));
    }

    async killContainer(daemonId: string, containerId: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "kill",
            body: {
                containerId
            }
        }));
    }

    async sendCommandToContainer(daemonId: string, containerId: string, command: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "command",
            body: {
                containerId,
                command
            }
        }));
    }

    async installContainer(daemonId: string, containerId: string, data: ContainerAppData) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "install",
            body: {
                containerId,
                ...data
            }
        }));
    }

    async registerContainer(daemonId: string, data: ContainerRegisterData) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "register",
            body: data
        }));
    }

    async removeContainer(daemonId: string, containerId: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "remove",
            body: {
                containerId
            }
        }));
    }

    async updateContainerRuntime(daemonId: string, containerId: string, runtime: string) {
        this.getDaemonWebsocket(daemonId).send(JSON.stringify({
            route: "container",
            action: "runtime",
            body: {
                containerId,
                runtime
            }
        }));
    }
}