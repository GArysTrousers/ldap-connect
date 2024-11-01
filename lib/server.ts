import { RpcServer } from "mega-rpc";

export class AuthServer {

  rpcServer: RpcServer
  apikeys: string[]

  constructor(port: number, apikeys: string[]) {
    this.rpcServer = new RpcServer(port, [])
    this.apikeys = apikeys
  }

  async sendAuthRequest(username: string, password: string) {
    return await this.rpcServer.clients[0].call('authenticate', { username, password })
  }

  async search() {
    return await this.rpcServer.clients[0].call('search', {base: "OU=Staff,DC=bsc,DC=local"})
  }

  waitForStart() {
    return new Promise((resolve)=> {
      setInterval(()=> {
        resolve(true)
      }, 100)
    })
  }
}