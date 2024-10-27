import { RpcClient, type Rpc } from "npm:mega-rpc";
import ldap from "ldapjs-promise";
import { loadConfig } from "./lib/config.ts";

const config = loadConfig('config.json')


const authenticate:Rpc = async () => {
  const client = ldap.createClient({
    url: config.ldap.servers
  })
  try {
    await client.bind(config.ldap.username, config.ldap.password)
    return true
  } catch (e) {
    client.destroy()
    console.log(e);
    return false
  }
}

const client = new RpcClient(config.remote.webSocketUrl, [
  ["authenticate", authenticate],
])

await authenticate({})