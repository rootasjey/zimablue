export interface User {
  username: string;
  email: string;
  password: string;
  id?: number;
  [key: string]: any
}
