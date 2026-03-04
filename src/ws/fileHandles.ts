import { OGSHError, sleep } from "@open-game-server-host/backend-lib";

const FILE_HANDLE_WAIT_SECONDS = 5; // TODO move to api config

const promises = new Map<string, (handle: number) => void>();

function getId(containerId: string, path: string): string {
    return `${containerId}_${path}`;
}

export async function waitForFileHandle(containerId: string, path: string) {
    const id = getId(containerId, path);
    return Promise.race([
        new Promise<number>(res => promises.set(id, res)),
        sleep(FILE_HANDLE_WAIT_SECONDS).then(() => {
            promises.delete(id);
            throw new OGSHError("general/unspecified", `failed to get file handle within ${FILE_HANDLE_WAIT_SECONDS} seconds from container id '${containerId}' path '${path}'`);
        })
    ]);
}

export function fileHandleOpened(containerId: string, path: string, handle: number) {
    const id = getId(containerId, path);
    const res = promises.get(id);
    if (res) {
        res(handle);
        promises.delete(id);
    }
}