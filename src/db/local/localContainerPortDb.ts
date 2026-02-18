import { AssignedContainerPorts, ContainerPort } from "@open-game-server-host/backend-lib";
import { ContainerPortDb } from "../containerPortDb";
import { DATABASE } from "../db";
import { LocalDb } from "./localDb";

export class LocalContainerPortDb extends LocalDb implements ContainerPortDb {
    constructor(){
        super("container_ports");
    }

    async assign(containerId: string, ports: number[]): Promise<ContainerPort[]> {
        const newPorts: AssignedContainerPorts = {
            container_id: containerId,
            ports: []
        }
        const { daemon } = await DATABASE.container.get(containerId);

        const existingPorts = await this.listByDaemon(daemon.id);
        function isPortAssigned(hostPort: number) {
            for (const containerPorts of existingPorts) {
                if (containerPorts.ports.find(p => p.host_port === hostPort)) {
                    return true;
                }
            }
            return false;
        }

        const range = daemon.port_range_end - daemon.port_range_start;
        ports.forEach(containerPort => {
            let newHostPort: number;
            do {
                newHostPort = daemon.port_range_start + Math.floor(Math.random() * range);
            } while (isPortAssigned(newHostPort));

            newPorts.ports.push({
                container_port: containerPort,
                host_port: newHostPort
            });
        });

        this.writeJsonFile(containerId, newPorts.ports);

        return newPorts.ports;
    }

    async list(): Promise<AssignedContainerPorts[]> {
        const ports: AssignedContainerPorts[] = [];
        const files = this.listJsonFiles<ContainerPort[]>();
        files.forEach(file => {
            ports.push({
                container_id: file.id,
                ports: file.data
            });
        });
        return ports;
    }
    
    async listByContainer(containerId: string): Promise<AssignedContainerPorts> {
        if (!this.jsonFileExists(containerId)) {
            return {
                container_id: containerId,
                ports: []
            }
        }
        const ports = this.readJsonFile<ContainerPort[]>(containerId);
        return {
            container_id: containerId,
            ports
        }
    }

    async listByDaemon(daemonId: string): Promise<AssignedContainerPorts[]> {
        const ports: AssignedContainerPorts[] = [];

        for (const assignedPorts of await this.list()) {
            if ((await DATABASE.container.get(assignedPorts.container_id)).daemon.id !== daemonId) {
                continue;
            }
            ports.push({
                container_id: assignedPorts.container_id,
                ports: assignedPorts.ports
            });
        }

        return ports;
    }
}