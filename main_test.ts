import { assertEquals, assertGreater } from "@std/assert";
import { AuthServer } from "./lib/server.ts";
import { AuthClient } from "./lib/client.ts";
import { loadConfig } from "./lib/config.ts";

const config = loadConfig('config.json')

const server = new AuthServer(8080, ["hello"])
await server.waitForStart()
const client = new AuthClient(config)
await client.waitForConnection();

Deno.test(async function SimpleAuth() {
  assertEquals(true, await server.sendAuthRequest('teststaff', 'uk6246!'));
  assertEquals(false, await server.sendAuthRequest('teststaff', 'uk6246!a'));
})


Deno.test(async function Search() {
  const data = await server.search() as any[]
  assertGreater(data.length, 0)
})