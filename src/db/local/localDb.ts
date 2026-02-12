import { OGSHError } from "@open-game-server-host/backend-lib";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

export abstract class LocalDb {

    constructor(protected readonly dbPath: string) {
        mkdirSync(dbPath, { recursive: true });
    }

    protected getJsonFilePath(file: string): string {
        if (!file.endsWith(".json")) {
            file = file + ".json";
        }
        return `${this.dbPath}/${file}`;
    }

    protected jsonFileExists(file: string): boolean {
        const path = this.getJsonFilePath(file);
        return existsSync(path);
    }

    protected readJsonFile<T>(file: string): T {
        const path = this.getJsonFilePath(file);
        if (!existsSync(path)) {
            throw new OGSHError("general/unspecified", `could not read json file at '${path}'`);
        }
        return JSON.parse(readFileSync(path).toString());
    }

    protected writeJsonFile<T>(file: string, data: T) {
        const path = this.getJsonFilePath(file);
        writeFileSync(path, JSON.stringify(data));
    }

    protected listJsonFiles<T>(): T[] {
        const files: T[] = [];
        for (const file of readdirSync(this.dbPath)) {
            const path = this.getJsonFilePath(file);
            files.push(this.readJsonFile(path));
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