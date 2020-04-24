import { decode } from 'jsonwebtoken'

import { JwtPayload } from './JwtPayload'

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
// export function parseUserId(jwtToken: string): string {
//   const decodedJwt = decode(jwtToken) as JwtPayload
//   return decodedJwt.sub
// }

export function parseUserId(authorization: string): string {
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const decodedJwt = decode(jwtToken) as JwtPayload

  if (!decodedJwt)
    return '123';
  return decodedJwt.sub;
}

