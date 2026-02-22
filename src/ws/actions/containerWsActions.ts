import { ContainerPort } from "@open-game-server-host/backend-lib";
import { sendMessageToDaemon } from "../wsConnections.js";

type Action =
    | "register"
    | "start"
    | "stop"
    | "restart"
    | "kill"
    | "command"
    | "install"
    | "remove"
;

interface ContainerMsg<T> {
    action: Action;
    data: T;
}

interface ContainerIdData {
    containerId: string;
}

interface RegisterData extends ContainerIdData {
    appId: string;
    variantId: string;
    versionId: string;
    ipv4Ports: ContainerPort[];
    ipv6Ports: ContainerPort[];
    segments: number;
}
export function registerContainer(daemonId: string, data: RegisterData) {
    const msg: ContainerMsg<RegisterData> = {
        action: "register",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}

export function startContainer(daemonId: string, data: ContainerIdData) {
    const msg: ContainerMsg<ContainerIdData> = {
        action: "start",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}


export function stopContainer(daemonId: string, data: ContainerIdData) {
    const msg: ContainerMsg<ContainerIdData> = {
        action: "stop",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}

export function restartContainer(daemonId: string, data: ContainerIdData) {
    const msg: ContainerMsg<ContainerIdData> = {
        action: "restart",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}

export function killContainer(daemonId: string, data: ContainerIdData) {
    const msg: ContainerMsg<ContainerIdData> = {
        action: "kill",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}

interface CommandData extends ContainerIdData {
    command: string;
}
export function sendCommandToContainer(daemonId: string, data: CommandData) {
    const msg: ContainerMsg<CommandData> = {
        action: "command",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}

interface InstallData extends ContainerIdData {
    appId: string;
    variantId: string;
    versionId: string;
}
export function installContainer(daemonId: string, data: InstallData) {
    const msg: ContainerMsg<InstallData> = {
        action: "install",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}

export function removeContainerFromDaemon(daemonId: string, data: ContainerIdData) {
    const msg: ContainerMsg<ContainerIdData> = {
        action: "remove",
        data
    }
    sendMessageToDaemon(daemonId, JSON.stringify(msg));
}