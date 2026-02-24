import { ContainerAppData, ContainerRegisterData, Logger, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { createClient, RedisClientType } from "@redis/client";
import { readFileSync } from "fs";
import WebSocket from "ws";
import { DaemonWsMessage } from "../../interfaces/daemon.js";
import { LocalMessageBroker } from "./localMessageBroker.js";

const redisHostKey = "OGSH_REDIS_HOST";
const redisPortKey = "OGSH_REDIS_PORT";
const redisTlsCertKey = "OGSH_REDIS_TLS_CERT";
const redisCaCertKey = "OGSH_REDIS_CA_CERT";

export class RedisMessageBroker extends LocalMessageBroker {
    private readonly logger = new Logger("REDIS BROKER");
    private readonly redis: RedisClientType;

    constructor() {
        super();

        const parsed = parseEnvironmentVariables([
            {
                key: redisHostKey
            },
            {
                key: redisPortKey,
                defaultValue: "6379"
            },
            {
                key: redisTlsCertKey
            },
            {
                key: redisCaCertKey
            }
        ]);

        this.redis = createClient({
            socket: {
                tls: true,
                ca: readFileSync(redisTlsCertKey).toString(),
                cert: readFileSync(redisCaCertKey).toString()
            }
        });

        this.redis.on("error", error => {
            // TODO proper error handling
            this.logger.error(error);
        });
    }

    private getUserChannel(authUid: string): string {
        return `user.${authUid}`;
    }

    async registerUserConnection(authUid: string, ws: WebSocket, containerId: string): Promise<void> {
        super.registerUserConnection(authUid, ws, containerId);
        this.redis.subscribe(this.getUserChannel(authUid), (msg, channel) => {
            this.getWebsocketsForContainer(containerId).forEach(ws => {
                ws.send(msg);
            });
        });
    }
    
    async removeUserConnection(authUid: string): Promise<void> {
        super.removeUserConnection(authUid);
        this.redis.unsubscribe(this.getUserChannel(authUid));
    }

    async sendLogsAndStatsToUsers(containerId: string, body: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private getDaemonChannel(daemonId: string): string {
        return `daemon.${daemonId}`;
    }
    
    async registerDaemonConnection(daemonId: string, ws: WebSocket): Promise<void> {
        super.registerDaemonConnection(daemonId, ws);
        this.redis.subscribe(this.getDaemonChannel(daemonId), (msg, channel) => {
            this.getDaemonWebsocket(daemonId).send(msg);
        });
    }

    async removeDaemonConnection(daemonId: string): Promise<void> {
        super.removeDaemonConnection(daemonId);
        this.redis.unsubscribe(this.getDaemonChannel(daemonId));
    }

    async startContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "start",
            body: {
                containerId
            }
        }
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
    }

    async stopContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "stop",
            body: {
                containerId
            }
        }
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
    }

    async restartContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "restart",
            body: {
                containerId
            }
        }
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
    }

    async killContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "kill",
            body: {
                containerId
            }
        }
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
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
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
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
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
    }

    async registerContainer(daemonId: string, containerId: string, data: ContainerRegisterData): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "register",
            body: data
        }
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
    }

    async removeContainer(daemonId: string, containerId: string): Promise<void> {
        const msg: DaemonWsMessage = {
            route: "container",
            action: "remove",
            body: {
                containerId
            }
        }
        await this.redis.publish(this.getDaemonChannel(daemonId), JSON.stringify(msg));
    }

}