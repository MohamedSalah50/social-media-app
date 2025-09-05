export interface ILoginResponse {
  credentials: {
    access_Token: string;
    refresh_Token: string;
  };
}
