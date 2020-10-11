import jwt from "jsonwebtoken"
import config from "config"
import request from "superagent"
import chai from "chai";

export const authRequest = (server: any) => new RequestBuilder(server)

class RequestBuilder {
  private server: any
  private headers: Record<string, string>
  private method: "post" | "get" | null = null
  private endpoint: string | null = null

  constructor(server: any) {
    this.server = server
    this.headers = {
      "content-type": "application/json"
    }
  }

  loginAsPatient(patientId: number): this {
    const token = jwt.sign({
      user: {
        patientId,
      }
    }, config.get("JWTSecret"), { expiresIn: '1h' })

    this.headers['Authorization'] = `Bearer ${token}`
    return this
  }

  loginAsDoctor(doctorId: number): this {
    const token = jwt.sign({
      user: {
        doctorId
      },
    }, config.get("JWTSecret"), { expiresIn: '1h' })

    this.headers['Authorization'] = `Bearer ${token}`
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

  build(): request.SuperAgentRequest {
    const agent = chai.request(this.server)

    if (this.method == null) {
      throw new Error("missing request method in the RequestBuilder")
    }

    if (this.endpoint == null) {
      throw new Error("missing endpoint in RequestBuilder")
    }

    let request: any = null
    if (this.method === "post") {
      request = agent.post(this.endpoint)
    } else if (this.method === "get") {
      request = agent.get(this.endpoint)
    }

    if (request == null) {
      throw new Error("invalid request object in RequestBuilder")
    }
    
    request.set(this.headers)

    return request
  }
}

export const renderJson = (object: any): any => {
  return JSON.parse(JSON.stringify(object))
}