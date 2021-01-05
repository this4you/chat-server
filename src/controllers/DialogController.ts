import express from 'express';
import {DialogModel, MessageModel} from "../models";
import socket from "socket.io";

class DialogController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }

    index = (req: express.Request, res: express.Response): void => {
        //@ts-ignore
        const userId = req.user._id;

        DialogModel.find()
            .or([{author: userId}, {partner: userId}])
            .populate(['author', 'partner'])
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'user',
                },
            })
            .exec(function (err, dialogs) {
                if (err) {
                    return res.status(404).json({
                        message: 'Dialogs not found',
                    });
                }
                return res.json(dialogs);
            });
    };

    create = (req: express.Request, res: express.Response): void => {
        const postData = {
            //@ts-ignore
            author: req.user._id,
            partner: req.body.partner,
        };

        DialogModel.findOne(
            {
                //@ts-ignore
                author: req.user._id,
                partner: req.body.partner,
            },
            (err, dialog) => {
                if (err) {
                    return res.status(500).json({
                        status: 'error',
                        message: err,
                    });
                }
                if (dialog) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'Такой диалог уже есть',
                    });
                } else {
                    const dialog = new DialogModel(postData);

                    dialog
                        .save()
                        .then((dialogObj) => {
                            const message = new MessageModel({
                                text: req.body.text,
                                //@ts-ignore
                                user: req.user._id,
                                dialog: dialogObj._id,
                            });

                            message
                                .save()
                                .then(() => {
                                    dialogObj.lastMessage = message._id;
                                    dialogObj.save().then(() => {
                                        res.json(dialogObj);
                                        this.io.to(dialogObj.partner.toString() + "").emit("SERVER:DIALOG_CREATED");
                                        this.io.to(dialogObj.author.toString() + "").emit("SERVER:DIALOG_CREATED");
                                        // this.io.emit('SERVER:DIALOG_CREATED', {
                                        //     ...postData,
                                        //     dialog: dialogObj,
                                        // });
                                    });
                                })
                                .catch((reason) => {
                                    res.json(reason);
                                });
                        })
                        .catch((err) => {
                            res.json({
                                status: 'error',
                                message: err,
                            });
                        });
                }
            },
        );
    };

    delete = (req: express.Request, res: express.Response): void => {
        const id: string = req.params.id;
        DialogModel.findOneAndRemove({_id: id})
            .then((dialog) => {
                if (dialog) {
                    res.json({
                        message: `Dialog deleted`,
                    });
                }
            })
            .catch(() => {
                res.json({
                    message: `Dialog not found`,
                });
            });
    };
}

export default DialogController;