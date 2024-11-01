import { RpcClient, type Rpc } from "npm:mega-rpc";
import { Client } from 'npm:ldapts';
import { loadConfig } from "./lib/config.ts";
import { z } from "zod";

const config = loadConfig('config.json')


export const authenticate:Rpc = async () => {
  const client = new Client({
    url: config.ldap.host,
  });
  try {
    await client.bind(config.ldap.username, config.ldap.password)
    client.unbind()
    return true
  } catch (e) {
    return false
  }
}


const GetUsers = z.object({
  base: z.string(),
})
export const search:Rpc = async (params) => {
  const req = GetUsers.parse(params)

  const client = new Client({
    url: config.ldap.host,
  });
  try {
    await client.bind(config.ldap.username, config.ldap.password)
    const res = await client.search(
      req.base,
      {
        filter: `(objectclass=user)`,
        scope: 'sub',
        attributes: ['sAMAccountName', 'userAccountControl', 'givenName', 'sn', 'memberOf', 'displayName', 'mail'],
        paged: true,
      }
    );
    return res
  } catch (e) {
    throw new Error("Whoops")
  }
}

// const rpcClient = new RpcClient(config.remote.webSocketUrl, [
//   ["authenticate", authenticate],
// ])

console.log(await search({base: "OU=Staff,DC=bsc,DC=local"}));