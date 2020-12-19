import express from "express";
import {UserModel} from '../models'

export default (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = "5fd9324e6a32a71ef4181769";
    UserModel.updateOne({_id: userId}, {last_seen: new Date()}).exec();
    next();
}