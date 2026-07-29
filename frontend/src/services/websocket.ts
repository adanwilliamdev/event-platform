import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { TicketAvailabilityUpdate } from '../types'

let client: Client | null = null

function getClient(): Client {
  if (client) return client

  client = new Client({
    webSocketFactory: () => new SockJS('/ws') as any,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000
  })

  client.activate()
  return client
}

export function subscribeToEventTickets(
  eventId: string,
  onUpdate: (update: TicketAvailabilityUpdate) => void
): () => void {
  const c = getClient()
  let subscription: { unsubscribe: () => void } | null = null

  const trySubscribe = () => {
    subscription = c.subscribe(`/topic/events/${eventId}/tickets`, (message: IMessage) => {
      try {
        onUpdate(JSON.parse(message.body))
      } catch (e) {
        console.error('Failed to parse ticket update', e)
      }
    })
  }

  if (c.connected) {
    trySubscribe()
  } else {
    c.onConnect = trySubscribe
  }

  return () => {
    subscription?.unsubscribe()
  }
}
