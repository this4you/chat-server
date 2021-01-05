import mongoose, {Schema, Document} from 'mongoose';
import validator from 'validator';
import { generatePasswordHash } from "../utils";
import differenceInMinutes from 'date-fns/differenceInMinutes';

export interface IUser extends Document{
    email: String;
    fullName: String;
    password: String;
    confirmed: boolean;
    avatar: string;
    confirm_hash: string;
    last_seen: Date;
}
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, 'Invalid email'],
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    avatar: String,
    confirm_hash: String,
    last_seen: {
        type: Date,
        default: new Date()
    }
}, {
    timestamps: true
});

UserSchema.virtual("isOnline").get(function (this: any) {
    return differenceInMinutes(new Date(), this.last_seen) < 5;
});

UserSchema.set("toJSON", {
    virtuals: true,
});

UserSchema.pre<IUser>("save", async function (next) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }

    user.password = await generatePasswordHash(user.password as string);
    user.confirm_hash = await generatePasswordHash(new Date().toString());
});

const User = mongoose.model<IUser>("User", UserSchema);
export default User;