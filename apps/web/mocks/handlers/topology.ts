import { http, HttpResponse, delay } from 'msw'
import { makeTopologyData } from '../factories/topology.factory'

const TOPOLOGY = makeTopologyData('ws-default')

export const topologyHandlers = [
  http.get('/api/workspaces/:wsId/topology', async () => {
    await delay(300)
    return HttpResponse.json({ data: TOPOLOGY })
  }),
]
