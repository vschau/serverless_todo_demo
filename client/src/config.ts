const apiId = 'ya19qf0frk'
export const apiEndpoint = `https://${apiId}.execute-api.us-west-2.amazonaws.com/dev`
// export const apiEndpoint = `http://localhost:3003`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'gllrds43.auth0.com',            // Auth0 domain
  clientId: '0jZQZIh67PV65ho9vOoTckPlDDFaGJi7',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
