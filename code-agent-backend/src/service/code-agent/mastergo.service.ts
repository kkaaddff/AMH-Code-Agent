import { Config, Provide, Scope, ScopeEnum } from '@midwayjs/core'
import axios from 'axios'
import * as https from 'https'

export interface MasterGoDslResponse {
  dsl: Record<string, unknown>
  componentDocumentLinks: string[]
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class MasterGoServiceV1 {
  @Config('mastergo')
  private mastergoConfig: {
    baseUrl: string
    token: string
  }

  private getCommonHeader() {
    const token = this.mastergoConfig.token
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-MG-UserAccessToken': token,
    }
  }

  private getBaseUrl() {
    const baseUrl = this.mastergoConfig.baseUrl

    try {
      const urlObj = new URL(baseUrl)
      const protocol = urlObj.protocol
      const hostname = urlObj.hostname
      const port = urlObj.port

      let result = `${protocol}//${hostname}`
      if (port) {
        result += `:${port}`
      }

      return result
    } catch {
      throw new Error(`无效的URL格式: ${baseUrl}。请提供正确的URL格式，例如: https://mastergo.com`)
    }
  }

  private extractComponentDocumentLinks(dsl: Record<string, unknown>): string[] {
    const documentLinks = new Set<string>()

    const traverse = (node: any) => {
      if (node?.componentInfo?.componentSetDocumentLink?.[0]) {
        documentLinks.add(node.componentInfo.componentSetDocumentLink[0])
      }
      node.children?.forEach?.(traverse)
    }

    const dslNodes = (dsl as any)?.nodes
    if (Array.isArray(dslNodes)) {
      dslNodes.forEach(traverse)
    }

    return Array.from(documentLinks)
  }

  /**
   * Extract fileId and layerId from a MasterGo URL
   */
  async extractIdsFromUrl(url: string): Promise<{ fileId: string; layerId: string }> {
    let targetUrl = url

    // Handle short links
    if (url.includes('/goto/')) {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      })

      const response = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 300 && status < 400,
        httpsAgent,
      })

      const redirectUrl = response.headers.location
      if (!redirectUrl) {
        throw new Error('No redirect URL found for short link')
      }
      targetUrl = redirectUrl
    }

    // Parse the URL
    const urlObj = new URL(targetUrl)
    const pathSegments = urlObj.pathname.split('/')
    const searchParams = new URLSearchParams(urlObj.search)

    // Extract fileId and layerId
    const fileId = pathSegments.find((segment) => /^\d+$/.test(segment))
    const layerId = searchParams.get('layer_id')

    if (!fileId) throw new Error('Could not extract fileId from URL')
    if (!layerId) throw new Error('Could not extract layerId from URL')

    return { fileId, layerId }
  }

  /**
   * Get DSL data from MasterGo
   */
  async getDsl(fileId: string, layerId: string): Promise<MasterGoDslResponse> {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })

    const response = await axios.get(`${this.getBaseUrl()}/mcp/dsl`, {
      timeout: 30000,
      params: { fileId, layerId },
      headers: this.getCommonHeader(),
      httpsAgent,
    })

    const dslData = response.data

    return {
      dsl: dslData,
      componentDocumentLinks: this.extractComponentDocumentLinks(dslData),
    }
  }

  /**
   * Get DSL data from MasterGo URL
   */
  async getDslFromUrl(mastergoUrl: string): Promise<MasterGoDslResponse> {
    const { fileId, layerId } = await this.extractIdsFromUrl(mastergoUrl)
    return await this.getDsl(fileId, layerId)
  }
}
