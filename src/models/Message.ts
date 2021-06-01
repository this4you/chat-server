import mongoose, {Schema, Document} from 'mongoose';
import validator from 'validator';
import {IUser} from "./User";
import {IDialog} from "./Dialog";

export interface IMessage extends Document{
    text: string;
    read: boolean;
    user: IUser | string;
    dialog: IDialog | string;
}
const MessageSchema = new Schema({
    user: {
        require: true,
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dialog: {
        require: true,
        type: Schema.Types.ObjectId,
        ref: 'Dialog'
    },
    text: {
        require: true,
        type: String
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
const Message = mongoose.model<IMessage>("Message", MessageSchema);
export default Message;