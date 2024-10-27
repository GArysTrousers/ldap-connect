import { z, ZodError } from "zod";

const schema = z.object({
    ldap: z.object({
      servers: z.array(z.string()),
      username: z.string(),
      password: z.string(),
    }),
    remote: z.object({
      webSocketUrl: z.string().url(),
      apikey: z.string(),
    })
  })
export type Config = z.infer<typeof schema>

export const defaultConfig: Config = {
  ldap: {
    servers: ["ldap://127.0.0.1:389"],
    username: "user@my.lan",
    password: "P@ssword!",
  },
  remote: {
    webSocketUrl: "ws://127.0.0.1:8080",
    apikey: "abc123",
  }
}

export function loadConfig(filename: string) {
  try {
    return schema.parse(JSON.parse(Deno.readTextFileSync(filename)));
  } catch (e) {
    if (e instanceof Error) {
      if (e instanceof ZodError) {
        console.log("\nError: config.json contains the following errors:\n")
        console.log(e.issues)
        alert("\n")
      }
      else if (e.name === "NotFound") {
        if (confirm("\nI couldn't find a config.json, should I make one?")) {
          Deno.writeTextFileSync('config.json', JSON.stringify(defaultConfig, null, 2))
          alert("Fill in the config.json then start the app again.");
        }
      }
    } else {
      console.log(e);
    }
    Deno.exit()
  }
}

