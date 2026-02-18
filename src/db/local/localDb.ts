import { OGSHError } from "@open-game-server-host/backend-lib";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

export interface JsonFile<T> {
    id: string;
    data: T;
}

export abstract class LocalDb {
    private readonly dbPath: string;

    constructor(path: string) {
        this.dbPath = `localdb/${path}`;
        mkdirSync(this.dbPath, { recursive: true });
    }

    protected getJsonFilePath(id: string): string {
        if (!id) {
            throw new OGSHError("general/unspecified", `provided undefined to getJsonFilePath, dbPath: ${this.dbPath}`);
        }
        if (!id.endsWith(".json")) {
            id = id + ".json";
        }
        return `${this.dbPath}/${id}`;
    }

    protected jsonFileExists(id: string): boolean {
        const path = this.getJsonFilePath(id);
        return existsSync(path);
    }

    protected readJsonFile<T>(id: string): T {
        const path = this.getJsonFilePath(id);
        if (!existsSync(path)) {
            throw new OGSHError("general/unspecified", `could not read json file at '${path}'`);
        }
        return JSON.parse(readFileSync(path).toString());
    }

    protected writeJsonFile<T>(id: string, data: T) {
        const path = this.getJsonFilePath(id);
        writeFileSync(path, JSON.stringify(data, null, 2));
    }

    protected enumerateJsonFiles(): string[] {
        const ids: string[] = [];
        for (const file of readdirSync(this.dbPath)) {
            ids.push(file.replace(".json", ""));
        }
        return ids;
    }

    protected listJsonFiles<T>(): JsonFile<T>[] {
        const files: JsonFile<T>[] = [];
        for (const id of this.enumerateJsonFiles()) {
            const path = this.getJsonFilePath(id);
            files.push({
                id,
                data: this.readJsonFile<T>(path)
            });
        }
        return files;
    }

    protected createUniqueId(): string {
        let uniqueId: string;
        do {
            uniqueId = `${Date.now()}`;
        } while (this.jsonFileExists(this.getJsonFilePath(uniqueId)));
        return uniqueId;
    }

    protected deleteJsonFile(file: string) {
        const path = this.getJsonFilePath(file);
        rmSync(path);
    }
}