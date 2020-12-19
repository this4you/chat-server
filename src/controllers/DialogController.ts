import express from 'express';
import {DialogModel, MessageModel} from "../models";
import socket from "socket.io";

class DialogController {
    io: socket.Server;
    constructor(io: socket.Server) {
        this.io = io;
    }

    show(req: express.Request, res: express.Response) {
        const id = req.params.id;
        DialogModel.findById(id, (err, dialog) => {
            if (err || dialog === null) {
                return res.status(404).json({
                    message: "Not Found"
                });
            }
            res.json(dialog);
        });
    }
    index(req: any, res: express.Response) {
        const userId = req.user._id;
        DialogModel
            .find()
            .or([{ author: userId }, { partner: userId }])
            .populate(['author', 'partner'])
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'user',
                },
            })
            .populate('author')
            .exec((err, dialogs) => {
                if (err) {
                    return res.status(404).json({
                        message: "Not Found"
                    });
                }
                res.json(dialogs);
            });
    }
    create(req: express.Request, res: express.Response) {
        const dialogData = {
            author: req.body.author,
            partner: req.body.partner
        };
        const dialog = new DialogModel(dialogData);
        dialog.save()
            .then((dialog: any) => {
                const message = new MessageModel({
                    text: req.body.text,
                    user: req.body.author,
                    dialog: dialog._id
                });
                message.save().then((obj:any) => {
                    res.json( dialog);
                });
            })
            .catch(err => {
                res.json(err);
            });
    }

    delete(req: express.Request, res: express.Response) {
        const id = req.params.id;
        DialogModel.findByIdAndRemove(id, (err, dialog) => {
            if (err || dialog === null) {
                return res.status(404).json({
                    message: "Not Found"
                });
            }
            res.json({
                message: `Dialog deleted`
            });
        });
    }
}

export default DialogController;