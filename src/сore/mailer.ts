import nodemailer from 'nodemailer';

const options = {
    service: 'gmail',
    auth: {
        user: "mertvichenko1@gmail.com",
        pass: ""
    }
};

const transport = nodemailer.createTransport(options);

export default transport;
