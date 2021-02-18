import nodemailer from 'nodemailer';

const options = {
    service: 'gmail',
    auth: {
        user: "",
        pass: ""
    }
};

const transport = nodemailer.createTransport(options);

export default transport;
