// import { io, Socket } from 'socket.io-client'

// const SOCKET_URL =
//   process.env.NEXT_PUBLIC_SOCKET_URL
// export const reworkSocket: Socket = io(`${SOCKET_URL}/rework`, {
//   transports: ['websocket'],
//   autoConnect: false,
// })

import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

console.log('SOCKET URL:', SOCKET_URL)

export const reworkSocket: Socket = io(`${SOCKET_URL}/rework`, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
})

export const rejectionSocket: Socket = io(`${SOCKET_URL}/rejection`, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
})

export const tlsSocket: Socket = io(`${SOCKET_URL}/tlsissue`, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
})

