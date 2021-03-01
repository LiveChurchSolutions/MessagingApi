import { PayloadInterface } from "../helpers/Interfaces";
import WebSocket from "ws";
import { Repositories } from "../repositories";
import { Connection } from "../models";
import { AttendanceInterface } from "../helpers/Interfaces";
import { ApiGatewayManagementApi } from 'aws-sdk';

export class DeliveryHelper {

    static sendMessages = async (payload: PayloadInterface) => {
        const repos = Repositories.getCurrent();
        const connections = repos.connection.convertAllToModel(await repos.connection.loadForConversation(payload.churchId, payload.conversationId));
        const promises: Promise<any>[] = [];
        connections.forEach(connection => {
            promises.push(DeliveryHelper.sendMessage(connection, payload));
        });
        await Promise.all(promises);
    }

    static sendMessage = async (connection: Connection, payload: PayloadInterface, socket?: WebSocket) => {
        var success = true;
        if (process.env.DELIVERY_PROVIDER === "aws") success = await DeliveryHelper.sendAws(connection, payload);
        else success = await DeliveryHelper.sendLocal(connection, payload);
        if (!success) {
            Repositories.getCurrent().connection.delete(connection.churchId, connection.id);
            DeliveryHelper.sendAttendance(connection.churchId, connection.conversationId)
        }
    }

    static sendAttendance = async (churchId: string, conversationId: string) => {
        const viewers = await Repositories.getCurrent().connection.loadAttendance(churchId, conversationId);
        var totalViewers = 0;
        viewers.forEach(v => { totalViewers += v.count });
        const data: AttendanceInterface = { conversationId: conversationId, viewers: viewers, totalViewers: totalViewers };
        await DeliveryHelper.sendMessages({ churchId, conversationId, action: "attendance", data });
    }




    private static sendAws = async (connection: Connection, payload: PayloadInterface) => {
        const apigwManagementApi = new ApiGatewayManagementApi({ apiVersion: '2020-04-16', endpoint: process.env.apiUrl });
        var success = true;
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connection.socketId, Data: JSON.stringify(payload) }).promise();
        } catch { success = false; }
        return success;
    }

    private static getSocket = () => {
        var result: WebSocket = null;
        return result;
    }

    private static sendLocal = async (connection: Connection, payload: PayloadInterface) => {
        var success = true;
        try {
            const socket = DeliveryHelper.getSocket();
            if (socket !== null && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
            else success = false;
        } catch (e) {
            success = false;
        }
        return success;
    }

}