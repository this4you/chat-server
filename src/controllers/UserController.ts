import express from 'express';
import {UserModel} from "../models";
import {createJWToken} from "../utils";
import {validationResult, Result, ValidationError} from "express-validator";
import bcrypt from 'bcrypt';
import mailer from '../сore/mailer';
import { SentMessageInfo } from "nodemailer/lib/sendmail-transport";
import socket from "socket.io";

class UserController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }

    getMe = (req: any, res: express.Response): void => {
        const id: string = req.user && req.user._id;
        UserModel.findById(id, (err: any, user) => {
            if (err || !user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }
            res.json(user);
        });
    };

    show(req: express.Request, res: express.Response) {
        const id = req.params.id;
        UserModel.findById(id, (err, user) => {
            if (err || user === null) {
                return res.status(404).json({
                    message: "Not Found"
                });
            }
            res.json(user);
        });
    }

    showAll(req: express.Request, res: express.Response) {
        UserModel.find((err, users) => {
            if (err) {
                return res.status(404).json({
                    message: "Not Found"
                });
            }
            res.json(users);
        });
    }

    create(req: express.Request, res: express.Response) {
        const userData = {
            email: req.body.email,
            fullName: req.body.fullName,
            password: req.body.password
        };
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({errors: errors.array()});
        } else {
            const user = new UserModel(userData);
            user
                .save()
                .then((obj: any) => {
                    res.json(obj);
                    mailer.sendMail(
                        {
                            from: "admin@test.com",
                            to: userData.email,
                            subject: "Підтвердження пошти",
                            html: `Для того, щоб підтвердити пошту необхідно перейти <a href="http://localhost:3000/signup/verify?hash=${obj.confirm_hash}">по цьому посиланню</a>`,
                        },
                        function (err: Error | null, info: SentMessageInfo) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(info);
                            }
                        }
                    );
                })
                .catch(err => {
                    res.json(err);
                });
        }
    }

    delete(req: express.Request, res: express.Response) {
        const id = req.params.id;
        UserModel.findByIdAndRemove(id, (err, user) => {
            if (err || user === null) {
                return res.status(404).json({
                    message: "Not Found"
                });
            }
            res.json({
                message: `User deleted ${user.fullName}`
            });
        });
    }

    auth(req: express.Request, res: express.Response) {
        const postData = {
            email: req.body.email,
            password: req.body.password
        }

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({errors: errors.array()});
        } else {
            UserModel.findOne({email: postData.email}, (err, user) => {
                if (err || !user) {
                    return res.status(404).json({
                        message: "User not found",
                    });
                }

                // if (!user.confirmed) {
                //     return res.status(200).json({
                //         status: "confirm"
                //     });
                // }

                if (bcrypt.compareSync(postData.password, user.password as string)) {
                    const token = createJWToken(user);
                    res.json({
                        status: "success",
                        token,
                    });
                } else {
                    res.status(200).json({
                        status: "error",
                        message: "Incorrect password or email",
                    });
                }
            });
        }
    }

    findUsers = (req: express.Request, res: express.Response): void => {
        //@ts-ignore
        const query: string = req.query.query;
        console.log(query);
        UserModel.find()
            .or([
                { fullName: new RegExp(query, "i") },
                { email: new RegExp(query, "i") },
            ])
            .then((users) => {
                //@ts-ignore
                users = users && users.filter(item => item._id != req.user._id) || [];
                res.json(users)
            })
            .catch((err: any) => {
                return res.status(404).json({
                    status: "error",
                    message: err,
                });
            });
    };

    verify(req: express.Request, res: express.Response) {
        //@ts-ignore
        const hash: string = req.query.hash;

        if (!hash) {
            res.status(422).json({errors: "Invalid hash"});
        } else {
            UserModel.findOne({confirm_hash: hash}, (err: any, user) => {
                if (err || !user) {
                    return res.status(404).json({
                        status: "error",
                        message: "Hash not found",
                    });
                }

                user.confirmed = true;
                user.save((err: any) => {
                    if (err) {
                        return res.status(404).json({
                            status: "error",
                            message: err,
                        });
                    }

                    res.json({
                        status: "success",
                        message: "Аккаунт успешно подтвержден!",
                    });
                });
            });
        }
    }
}

export default UserController;
