import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      accountType?: string
      searchesUsed?: number
      searchLimit?: number
    }
  }

  interface User {
    id: string
    accountType?: string
    searchesUsed?: number
    searchLimit?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountType?: string
    searchesUsed?: number
    searchLimit?: number
  }
}
