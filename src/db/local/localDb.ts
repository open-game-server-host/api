import { OGSHError } from "@open-game-server-host/backend-lib";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

export interface JsonFile<T> {
    id: string;
    data: T;
}

export type LocalDbFolder =
    | "container"
    | "daemon"
    | "ipv4"
    | "ipv6"
    | "region"
    | "user"
;

const BASE_PATH = "localdb";

export abstract class LocalDb {
    private getFolderPath(folder: LocalDbFolder): string {
        const folderPath = `${BASE_PATH}/${folder}`;
        mkdirSync(folderPath, { recursive: true });
        return folderPath;
    }

    private getJsonFilePath(folder: LocalDbFolder, id: string): string {
        if (!id) {
            throw new OGSHError("general/unspecified", `provided undefined to getJsonFilePath, folder '${folder}' id '${id}'`);
        }
        if (!id.endsWith(".json")) {
            id = id + ".json";
        }
        return `${this.getFolderPath(folder)}/${id}`;
    }

    protected jsonFileExists(folder: LocalDbFolder, id: string): boolean {
        const path = this.getJsonFilePath(folder, id);
        return existsSync(path);
    }

    protected readJsonFile<T>(folder: LocalDbFolder, id: string): T {
        const path = this.getJsonFilePath(folder, id);
        if (!existsSync(path)) {
            throw new OGSHError("general/unspecified", `could not read json file at '${path}'`);
        }
        return JSON.parse(readFileSync(path).toString());
    }

    protected writeJsonFile<T>(folder: LocalDbFolder, id: string, data: T) {
        const path = this.getJsonFilePath(folder, id);
        writeFileSync(path, JSON.stringify(data, null, 2));
    }

    protected enumerateJsonFiles(folder: LocalDbFolder): string[] {
        const ids: string[] = [];
        for (const file of readdirSync(this.getFolderPath(folder))) {
            ids.push(file.replace(".json", ""));
        }
        return ids;
    }

    protected listJsonFiles<T>(folder: LocalDbFolder): JsonFile<T>[] {
        const files: JsonFile<T>[] = [];
        for (const id of this.enumerateJsonFiles(folder)) {
            files.push({
                id,
                data: this.readJsonFile<T>(folder, id)
            });
        }
        return files;
    }

    protected createUniqueId(folder: LocalDbFolder): string {
        let uniqueId: string;
        do {
            uniqueId = `${Date.now()}`;
        } while (this.jsonFileExists(folder, uniqueId));
        return uniqueId;
    }

    protected deleteJsonFile(folder: LocalDbFolder, file: string) {
        const path = this.getJsonFilePath(folder, file);
        rmSync(path);
    }
}