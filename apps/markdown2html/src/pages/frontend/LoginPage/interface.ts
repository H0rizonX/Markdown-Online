type LoginByID = {
  identify: number;
  password: string;
  loginType: "ID";
  status: number;
};

type LoginByEmail = {
  identify: string;
  password: string;
  loginType: "Email";
  status: number;
};

export type LoginType = LoginByID | LoginByEmail;

export type registerType = {
  email: string;
  password?: string;
};
