import { appendFileSync, createReadStream } from "node:fs";
import { ContainerAction, ContainerAuditLog } from "../../interfaces/container.js";
import { DATABASE, Database } from "../db.js";

export class LocalContainerAuditDb implements Partial<Database> {
    private static readonly basePath = "localdb/container/";

    private getLogFilePath(containerId: string): string {
        return `${LocalContainerAuditDb.basePath}${containerId}_audit.txt`;
    }

    async getContainerAuditLogs(containerId: string, page: number = 0, resultsPerPage: number = 10): Promise<ContainerAuditLog[]> {
        const stream = createReadStream(this.getLogFilePath(containerId), { highWaterMark: 1 });
        let i = 0;
        const startIndex = page * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const logs: ContainerAuditLog[] = [];
        let line = "";
        stream.on("data", async chunk => {
            line += chunk;
            if (line.endsWith("\n")) {
                if (i >= endIndex) {
                    stream.removeAllListeners();
                    return;
                }
                if (i >= startIndex) {
                    const data = line.split(":");
                    logs.push({
                        user: await DATABASE.getUser(data[0]),
                        containerId: data[1],
                        runAt: +data[2],
                        action: data[3] as ContainerAction,
                        data: data[4]
                    });
                }

                line = "";
                i++;
            }
        });
        return await new Promise<ContainerAuditLog[]>(res => {
            stream.on("end", () => res(logs));
        });
    }

    async addContainerAuditLog(log: ContainerAuditLog) {
        appendFileSync(this.getLogFilePath(log.containerId), `${log.user.id}:${log.containerId}:${log.runAt}:${log.action}\n`);
    }
}