import { Router } from "express";

export const containerHttpRouter = Router();


containerHttpRouter.post("/", async (req, res) => {
    // TODO create container
    /*
        TODO
        implement different strategies for assigning containers to daemons
        - first_available = use the first daemon available with the space (default)
        - balanced = use the daemon with the most available space
    */
});

containerHttpRouter.get("/:containerId", async (req, res) => {
    // TODO return container info
});

containerHttpRouter.delete("/:containerId", async (req, res) => {
    // TODO terminate container
});

containerHttpRouter.post("/:containerId/cancel", async (req, res) => {
    // TODO undo termination if before the end date
});

containerHttpRouter.post("/:containerId/image", async (req, res) => {
    // TODO set docker runtime image
});

containerHttpRouter.post("/:containerId/install", async (req, res) => {

});

containerHttpRouter.post("/:containerId/name", async (req, res) => {

});

containerHttpRouter.post("/:containerId/size", async (req, res) => {
    // TODO adjust container segments up or down, may have to relocate to find enough segments
});

containerHttpRouter.post("/:containerId/region", async (req, res) => {
    // TODO relocate the container to the specified region
});

containerHttpRouter.post("/:containerId/backup", async (req, res) => {
    // TODO tell container to start a backup, user will need to select where they want it sent to e.g. google drive, dropbox, onedrive, backblaze, s3, sftp etc
});