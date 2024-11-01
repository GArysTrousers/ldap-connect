import { z } from "zod";
import { Rpc, RpcClient, RpcParamList } from "mega-rpc";
import { Client } from 'npm:ldapts';
import { Config } from "./config.ts";

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
  }),
  search: z.object({
    base: z.string(),
  })
}
type Settings = z.infer<typeof schema.settings>


export class AuthClient {

  rpc: RpcClient;
  config: Config;

  constructor(config: Config) {
    this.config = config
    const rpcs: [string, Rpc][] = [
      ["authenticate", (params) => { return this.authenticate(params) }],
      ["search", (params) => { return this.search(params) }],
    ]
    this.rpc = new RpcClient(config.remote.webSocketUrl, rpcs)
  }

  async authenticate(params: any) {
    const data = schema.authRequest.parse(params)
    const client = new Client({
      url: this.config.ldap.host,
    });
    try {
      await client.bind(`${data.username}@${this.config.ldap.domain}`, data.password)
      client.unbind()
      return true
    } catch (_e) {
      client.unbind()
      return false
    }
  }

  async search(params: RpcParamList) {
    const data = schema.search.parse(params)
  
    const client = new Client({
      url: this.config.ldap.host,
    });
    try {
      await client.bind(this.config.ldap.username, this.config.ldap.password)
      const res = await client.search(
        data.base,
        {
          filter: `(objectclass=user)`,
          scope: 'sub',
          attributes: ['sAMAccountName', 'userAccountControl', 'givenName', 'sn', 'memberOf', 'displayName', 'mail'],
          paged: true,
        }
      );
      await client.unbind()
      return res.searchEntries
    } catch (e) {
      await client.unbind()
      throw e
    }
  }

  waitForConnection() {
    return new Promise((resolve) => {
      setInterval(() => {
        if (this.rpc.ws.readyState === 1) {
          resolve(true);
        }
      }, 100)
    })
  }
}
