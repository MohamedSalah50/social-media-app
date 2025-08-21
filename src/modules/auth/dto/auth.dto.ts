export interface ISignupBodyInputs {
    username: string,
    email: string,
    password: string,
    phone: string
}
export interface IConfirmEmailInputs {
    email: string,
    otp: string
}

export interface ILoginBodyInputs {
    email: string,
    password: string
}