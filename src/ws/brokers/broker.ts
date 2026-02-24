import { ContainerAppData, ContainerRegisterData, OGSHError } from "@open-game-server-host/backend-lib";
import { WebSocket } from "ws";
import { getBrokerType } from "../../env.js";
import { LocalMessageBroker } from "./localMessageBroker.js";
import { RedisMessageBroker } from "./redisMessageBroker.js";

export type BrokerType =
    | "local"
    | "redis"
    | "postgres"
;

export interface UserMessage {
    type: string;
    body: any;
}

export interface Broker {
    registerUserConnection(authUid: string, ws: WebSocket, containerId: string): Promise<void>;
    removeUserConnection(authUid: string): Promise<void>;
    sendLogsAndStatsToUsers(containerId: string, body: any): Promise<void>;

    registerDaemonConnection(daemonId: string, ws: WebSocket): Promise<void>;
    removeDaemonConnection(daemonId: string): Promise<void>;
    startContainer(daemonId: string, containerId: string): Promise<void>;
    stopContainer(daemonId: string, containerId: string): Promise<void>;
    restartContainer(daemonId: string, containerId: string): Promise<void>;
    killContainer(daemonId: string, containerId: string): Promise<void>;
    sendCommandToContainer(daemonId: string, containerId: string, command: string): Promise<void>;
    installContainer(daemonId: string, containerId: string, data: ContainerAppData): Promise<void>;
    registerContainer(daemonId: string, containerId: string, data: ContainerRegisterData): Promise<void>;
    removeContainer(daemonId: string, containerId: string): Promise<void>;
}

export const BROKER = createBroker();

function createBroker(): Broker {
    switch (getBrokerType()) {
        case "local": return createLocalBroker();
        case "redis": return createRedisBroker();
        case "postgres": return createPostgresBroker();
        default: throw new OGSHError("general/unspecified", "no broker type defined");
    }
}

function createLocalBroker(): Broker {
    const broker = new LocalMessageBroker();

    return {
        registerUserConnection: broker.registerUserConnection.bind(broker),
        removeUserConnection: broker.removeUserConnection.bind(broker),

        sendLogsAndStatsToUsers: broker.sendLogsAndStatsToUsers.bind(broker),

        registerDaemonConnection: broker.registerDaemonConnection.bind(broker),
        removeDaemonConnection: broker.removeDaemonConnection.bind(broker),
        startContainer: broker.startContainer.bind(broker),
        stopContainer: broker.stopContainer.bind(broker),
        restartContainer: broker.restartContainer.bind(broker),
        killContainer: broker.killContainer.bind(broker),
        sendCommandToContainer: broker.sendCommandToContainer.bind(broker),
        installContainer: broker.installContainer.bind(broker),
        registerContainer: broker.registerContainer.bind(broker),
        removeContainer: broker.removeContainer.bind(broker)
    }
}

function createRedisBroker(): Broker {
    const redis = new RedisMessageBroker();

    return {
        registerUserConnection: redis.registerUserConnection.bind(redis),
        removeUserConnection: redis.removeUserConnection.bind(redis),

        sendLogsAndStatsToUsers: redis.sendLogsAndStatsToUsers.bind(redis),

        registerDaemonConnection: redis.registerDaemonConnection.bind(redis),
        removeDaemonConnection: redis.removeDaemonConnection.bind(redis),
        startContainer: redis.startContainer.bind(redis),
        stopContainer: redis.stopContainer.bind(redis),
        restartContainer: redis.restartContainer.bind(redis),
        killContainer: redis.killContainer.bind(redis),
        sendCommandToContainer: redis.sendCommandToContainer.bind(redis),
        installContainer: redis.installContainer.bind(redis),
        registerContainer: redis.registerContainer.bind(redis),
        removeContainer: redis.removeContainer.bind(redis)
    }
}

function createPostgresBroker(): Broker {
    function notImplemented(): Promise<any> {
        throw new Error("not implemented");
    }

    return {
        registerUserConnection: notImplemented,
        removeUserConnection: notImplemented,

        sendLogsAndStatsToUsers: notImplemented,

        registerDaemonConnection: notImplemented,
        removeDaemonConnection: notImplemented,
        startContainer: notImplemented,
        stopContainer: notImplemented,
        restartContainer: notImplemented,
        killContainer: notImplemented,
        sendCommandToContainer: notImplemented,
        installContainer: notImplemented,
        registerContainer: notImplemented,
        removeContainer: notImplemented
    }
}