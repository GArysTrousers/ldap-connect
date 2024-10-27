import { WebSocket } from "ws";
import { z } from "zod";
import { RpcClient, RpcServer } from "mega-rpc";
import ldap from "ldapjs-promise";

const ver = "1"

const schema = {
  message: z.object({
    id: z.string(),
    ver: z.string(),
    type: z.number(),
    data: z.any()
  }),
  authRequest: z.object({
    username: z.string(),
    password: z.string(),
  }),
  authResponse: z.object({
    username: z.string(),
    displayName: z.string(),
    fn: z.string(),
    ln: z.string(),
    login: z.string(),
    groups: z.array(z.string())
  }),
  settings: z.object({
    address: z.string(),
  }),
  clientAuth: z.object({
    apikey: z.string()
  })
}
type Settings = z.infer<typeof schema.settings>


export class AuthClient {

  rpc: RpcClient;
  settings: Settings | null = null;
  requests = new Map<string, string>()

  constructor(url: string, apikey: string) {
    this.rpc = new RpcClient(new WebSocket(url), [
      ["auth", async (params) => {
        try {
          const data = schema.authRequest.parse(params)
          return await this.authLdap(data.username, data.password)
        } catch (e) {
          
        }
      }]
    ])
  }

  async authLdap(username: string, password: string) {
    const client = ldap.createClient({
      url: ['localhost']
    })
    try {
      await client.bind(`${username}@${'domain'}`, password)
    } catch (err) {
      client.destroy()
      throw "Wrong password"
    }
    try {
      let res = await client.searchReturnAll(
        'ldapBase',
        {
          filter: `(samAccountName=${username})`,
          scope: 'sub',
          attributes: ['samAccountName', 'givenName', 'sn', 'memberOf', 'displayName', 'mail']
        });
      if (res.entries.length < 1)
        throw "No results from search"
      if (!res.entries[0].memberOf.includes('staffGroup'))
        throw "Not in staff group";
  
      client.destroy()
      return res.entries[0];
    }
    catch (err) {
      client.destroy()
      throw err
    }
  }
}


export class AuthServer {

  rpcServer: RpcServer
  clients: {
    name: string;
    apikey: string;
    rpc: RpcClient | null;
  }[] = []


  constructor() {
    this.rpcServer = new RpcServer(8080, [])
  }

  addClient(name: string, apikey: string) {
    this.clients.push({
      name,
      apikey,
      rpc: null
    })
  }

  async authRequest(username: string, password: string) {
    let res = await this.clients[0].rpc?.call('authRequest', { username, password })
    
    try {
      const auth = schema.authResponse.parse(res)
      return auth
    } catch (e) {
      throw new Error()
    }
  }
}


