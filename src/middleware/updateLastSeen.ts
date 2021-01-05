import express from "express";
import {UserModel} from '../models'

export default (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user) {
        //@ts-ignore
        const userId = req.user._id;
        UserModel.updateOne({_id: userId}, {last_seen: new Date()}).exec();
    }
    next();
}