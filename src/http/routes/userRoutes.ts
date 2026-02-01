import { Router } from "express";

export const userHttpRouter = Router();

userHttpRouter.get("/", async (req, res) => {
    // TODO return user data
});

userHttpRouter.post("/", async (req, res) => {
    // TODO user has been created in firebase, client then calls this endpoint to create the user data on our end
});

userHttpRouter.get("/containers", async (req, res) => {

});