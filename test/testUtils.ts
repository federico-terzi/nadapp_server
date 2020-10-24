import jwt from "jsonwebtoken"
import config from "config"
import request from "superagent"
import chai from "chai";

export const authRequest = (server: any) => new RequestBuilder(server)

export type RequestMethod = "get" | "post" | "put" | "delete"
export const RequestMethods: RequestMethod[] = ["get", "post", "put", "delete"]

class RequestBuilder {
  private server: any
  private headers: Record<string, string>
  private method: RequestMethod | null = null
  private endpoint: string | null = null
  private agent

  constructor(server: any) {
    this.server = server
    this.headers = {
      "content-type": "application/json",
    }
    this.agent = chai.request.agent(server)
  }

  async loginAsPatient(patientId: number): Promise<this> {
    await this.agent.post("/auth/testLogin").send({
      patientId,
    })
    return this
  }

  async loginAsDoctor(doctorId: number): Promise<this> {
    await this.agent.post("/auth/testLogin").send({
      doctorId,
    })
    return this
  }

  request(method: RequestMethod, endpoint: string): this {
    this.endpoint = endpoint
    this.method = method
    return this
  }

  post(endpoint: string): this {
    this.endpoint = endpoint
    this.method = "post"
    return this
  }

  get(endpoint: string): this {
    this.endpoint = endpoint
    this.method = "get"
    return this
  }
  
  put(endpoint: string): this {
    this.endpoint = endpoint
    this.method = "put"
    return this
  }

  delete(endpoint: string): this {
    this.endpoint = endpoint
    this.method = "delete"
    return this
  }

  build(): request.SuperAgentRequest {
    if (this.method == null) {
      throw new Error("missing request method in the RequestBuilder")
    }

    if (this.endpoint == null) {
      throw new Error("missing endpoint in RequestBuilder")
    }

    let request: any = null
    if (this.method === "post") {
      request = this.agent.post(this.endpoint)
    } else if (this.method === "get") {
      request = this.agent.get(this.endpoint)
    } else if (this.method === "put") {
      request = this.agent.put(this.endpoint)
    } else if (this.method === "delete") {
      request = this.agent.delete(this.endpoint)
    }

    if (request == null) {
      throw new Error("invalid request object in RequestBuilder")
    }
    
    request.set(this.headers)

    return request
  }

  close(): void {
    this.agent.close()
  }
}

export const renderJson = (object: any): any => {
  return JSON.parse(JSON.stringify(object))
}

export const binaryParser = (res: any, callback: any) => {
  res.setEncoding("binary")
  res.data = ""
  res.on("data", function (chunk: string) {
    res.data += chunk;
  })
  res.on("end", function () {
    callback(null, Buffer.from(res.data, "binary"));
  });
}

export const sleep = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay)
  })
}