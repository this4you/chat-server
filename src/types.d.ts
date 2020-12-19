declare namespace Express {
    import { IUser } from "./models/User";

     interface Request {
        user?: IUser;
    }
}