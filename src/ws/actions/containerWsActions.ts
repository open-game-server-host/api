import { ContainerPort } from "@open-game-server-host/backend-lib";
import { sendMessageToDaemon } from "../wsConnections.js";

interface ContainerIdBody {
    containerId: string;
}

interface RegisterBody extends ContainerIdBody {
    appId: string;
    variantId: string;
    versionId: string;
    ipv4Ports: ContainerPort[];
    ipv6Ports: ContainerPort[];
    segments: number;
}
export function registerContainer(daemonId: string, body: RegisterBody) {
    sendMessageToDaemon(daemonId, "container", "register", body);
}

export function startContainer(daemonId: string, body: ContainerIdBody) {
    sendMessageToDaemon(daemonId, "container", "start", body);
}


export function stopContainer(daemonId: string, body: ContainerIdBody) {
    sendMessageToDaemon(daemonId, "container", "stop", body);
}

export function restartContainer(daemonId: string, body: ContainerIdBody) {
    sendMessageToDaemon(daemonId, "container", "restart", body);
}

export function killContainer(daemonId: string, body: ContainerIdBody) {
    sendMessageToDaemon(daemonId, "container", "kill", body);
}

interface CommandBody extends ContainerIdBody {
    command: string;
}
export function sendCommandToContainer(daemonId: string, body: CommandBody) {
    sendMessageToDaemon(daemonId, "container", "command", body);
}

interface InstallBody extends ContainerIdBody {
    appId: string;
    variantId: string;
    versionId: string;
}
export function installContainer(daemonId: string, body: InstallBody) {
    sendMessageToDaemon(daemonId, "container", "install", body);
}

export function removeContainerFromDaemon(daemonId: string, body: ContainerIdBody) {
    sendMessageToDaemon(daemonId, "container", "remove", body);
}