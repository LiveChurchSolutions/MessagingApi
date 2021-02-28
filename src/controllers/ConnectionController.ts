import { controller, httpGet, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { MessagingBaseController } from "./MessagingBaseController"
import { Connection } from "../models";


@controller("/connections")
export class ConnectionController extends MessagingBaseController {

    @httpGet("/:churchId/:conversationId")
    public async loadAll(@requestParam("churchId") churchId: string, @requestParam("conversationId") conversationId: string, req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const data = await this.repositories.connection.loadForConversation(churchId, conversationId);
            const connections = this.repositories.connection.convertAllToModel(data);
            return connections;
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, Connection[]>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const promises: Promise<Connection>[] = [];
            req.body.forEach((connection: Connection) => {
                promises.push(this.repositories.connection.save(connection));
            });
            return this.repositories.connection.convertAllToModel(await Promise.all(promises));
        });
    }

    @httpPost("/setName")
    public async setName(req: express.Request<{}, {}, { socketId: string, name: string }>, res: express.Response): Promise<any> {
        return this.actionWrapperAnon(req, res, async () => {
            const connections = await this.repositories.connection.loadBySocketId(req.body.socketId);
            const promises: Promise<Connection>[] = [];
            connections.forEach((connection: Connection) => {
                connection.displayName = req.body.name;
                promises.push(this.repositories.connection.save(connection));
            });
            return this.repositories.connection.convertAllToModel(await Promise.all(promises));
        });
    }


}
