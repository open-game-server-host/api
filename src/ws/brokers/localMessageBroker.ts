import { ContainerAppData, ContainerRegisterData, OGSHError } from "@open-game-server-host/backend-lib";
import Stream from "node:stream";
import { WebSocket } from "ws";
import { waitForFileHandle } from "../fileHandles.js";
import { Broker, UserMessage } from "./broker.js";

export class LocalMessageBroker implements Broker {
    private containerIdByWebsocket = new Map<WebSocket, string>();
    private websocketByAuthUid = new Map<string, WebSocket>();

    private websocketByDaemonId = new Map<string, WebSocket>();

    async registerUserConnection(authUid: string, ws: WebSocket, containerId: string) {
        this.websocketByAuthUid.set(authUid, ws);
        this.containerIdByWebsocket.set(ws, containerId);
    }

    async removeUserConnection(authUid: string) {
        const ws = this.websocketByAuthUid.get(authUid);
        if (!ws) {
            return;
        }
        this.websocketByAuthUid.delete(authUid);
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
            throw new OGSHError("general/unspecified", `could not get websocket for dameon id '${daemonId}'`);
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

    async uploadFileToContainer(daemonId: string, containerId: string, path: string, stream: Stream.Readable) {
        const handle = this.filehandle(daemonId, containerId, path);
        const ws = this.getDaemonWebsocket(daemonId);
        stream.on("data", chunk => {
            ws.send(`u${handle}` + chunk); // Data that starts with a 'u' means upload, then the next character is the file handle
        });
        // TODO handle stream close or error
    }

    async cancelFileUploadToContainer(dawmonId: string, containerId: string, path: string, reason: string) {
        // TODO
    }

    async filehandle(daemonId: string, containerId: string, path: string): Promise<number> {
        const ws = this.getDaemonWebsocket(daemonId);
        ws.send(JSON.stringify({
            route: "container",
            action: "fileHandle",
            body: {
                containerId,
                path
            }
        }));
        console.log(`waiting for file handle`);
        const handle = await waitForFileHandle(containerId, path);
        console.log(`got handle: ${handle}`);
        return handle;
    }
}