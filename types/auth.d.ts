// auth.d.ts
declare module '#auth-utils' {
  interface User {
    createdAt: string;
    id: number
    email: string
    name: string
    role: string
  }

  interface UserSession {
    // Add your own fields
  }

  interface SecureSessionData {
    // Add your own fields
  }
}

export {}