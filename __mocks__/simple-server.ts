/**
 * SimpleMockServer
 * A lightweight alternative to MSW for this specific environment.
 * Mocks global.fetch and allows registering handlers.
 */
class SimpleMockServer {
  private handlers: Map<string, (req: any) => Promise<any>> = new Map()

  listen() {
    global.fetch = jest.fn(async (url: string, init?: any) => {
      const handler = this.handlers.get(url) || [...this.handlers.entries()].find(([key]) => url.includes(key))?.[1]
      
      if (handler) {
        const response = await handler(init)
        return {
          ok: response.status ? response.status < 400 : true,
          status: response.status || 200,
          json: async () => response.data,
          text: async () => JSON.stringify(response.data),
        }
      }
      
      return {
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: { message: 'Not Found' } }),
      }
    }) as any
  }

  use(url: string, handler: (req: any) => Promise<any>) {
    this.handlers.set(url, handler)
  }

  resetHandlers() {
    this.handlers.clear()
  }

  close() {
    (global.fetch as jest.Mock).mockRestore?.()
  }
}

export const simpleServer = new SimpleMockServer()
