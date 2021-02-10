import express from 'express';
import {MessageModel} from "../models";
import socket from "socket.io";
import {DialogModel} from "../models";
import {IDialog} from "../models/Dialog";

class MessageController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }

    updateReadStatus = (
        res: express.Response,
        userId: string,
        dialogId: string
    ): void => {
        MessageModel.updateMany(
            {dialog: dialogId, user: {$ne: userId}},
            {$set: {read: true}},
            (err: any): void => {
                if (err) {
                    res.status(500).json({
                        status: "error",
                        message: err,
                    });
                } else {
                    this.io.emit("SERVER:MESSAGES_READED", {
                        userId,
                        dialogId,
                    });
                }
            }
        );
    };

    index = (req: express.Request, res: express.Response): void => {
        //@ts-ignore
        const dialogId: string = req.query.dialog;
        //@ts-ignore
        const userId: string = req.user._id;

        this.updateReadStatus(res, userId, dialogId);

        MessageModel.find({dialog: dialogId})
            .populate(["dialog", "user", "attachments"])
            .exec(function (err, messages) {
                if (err) {
                    return res.status(404).json({
                        status: "error",
                        message: "Messages not found",
                    });
                }
                res.json(messages);
            });
    };

    create = (req: express.Request, res: express.Response): void => {
        //@ts-ignore
        const userId: string = req.user._id;

        const postData = {
            text: req.body.text,
            dialog: req.body.dialog_id,
            attachments: req.body.attachments,
            user: userId,
        };

        const message = new MessageModel(postData);

        this.updateReadStatus(res, userId, req.body.dialog_id);

        message
            .save()
            .then((obj) => {
                obj.populate(
                    "dialog user attachments",
                    (err: any, message) => {
                        if (err) {
                            return res.status(500).json({
                                status: "error",
                                message: err,
                            });
                        }

                        DialogModel.findOneAndUpdate(
                            {_id: postData.dialog},
                            {lastMessage: message._id},
                            {upsert: true},
                            function (err) {
                                if (err) {
                                    return res.status(500).json({
                                        status: "error",
                                        message: err,
                                    });
                                }
                            }
                        );

                        res.json(message);
                        const dialog: IDialog = <IDialog>message.dialog;
                        this.io.to(dialog.partner.toString() + "").emit("SERVER:MESSAGE_CREATED", JSON.stringify(message));
                        this.io.to(dialog.author.toString() + "").emit("SERVER:MESSAGE_CREATED", JSON.stringify(message));
                        this.io.to(dialog.partner.toString() + "").emit("SERVER:MESSAGE_NEW", JSON.stringify(message));
                        this.io.to(dialog.author.toString() + "").emit("SERVER:MESSAGE_NEW", JSON.stringify(message));
                    }
                );
            })
            .catch((reason) => {
                res.json(reason);
            });
    };

    delete = (req: express.Request, res: express.Response): void => {
        //@ts-ignore
        const id: string = req.query.id;
        //@ts-ignore
        const userId: string = req.user._id;

        MessageModel.findById(id, (err, message: any) => {
            if (err || !message) {
                return res.status(404).json({
                    status: "error",
                    message: "Message not found",
                });
            }

            if (message.user.toString() === userId) {
                const dialogId = message.dialog;
                message.remove();
                MessageModel.findOne(
                    {dialog: dialogId},
                    {},
                    {sort: {createdAt: -1}},
                    (err, lastMessage) => {
                        if (err) {
                            res.status(500).json({
                                status: "error",
                                message: err,
                            });
                        }
                        DialogModel.findById(dialogId, (err, dialog) => {
                            if (err) {
                                res.status(500).json({
                                    status: "error",
                                    message: err,
                                });
                            }

                            if (!dialog) {
                                return res.status(404).json({
                                    status: "not found",
                                    message: err,
                                });
                            }

                            dialog.lastMessage = lastMessage ? lastMessage._id : "";
                            dialog.save();
                        });
                    }
                );

                return res.json({
                    status: "success",
                    message: "Message deleted",
                });
            } else {
                return res.status(403).json({
                    status: "error",
                    message: "Not have permission",
                });
            }
        });
    };
}

export default MessageController;
