import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { generateUploadUrl } from '../../businessLogic/todosLogic';
import { createLogger } from '../../utils/logger'

const logger = createLogger('Todo Log - Lambda');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info({
    message: 'Processing event: Generate upload Url'
  });

  const todoId = event.pathParameters.todoId;

  try {
    const uploadUrl = await generateUploadUrl(todoId, event.headers.Authorization);

    // return a presigned URL to upload a file for a TODO item with the provided id
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl
      })
    }
  } catch(error) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: error.message
      })
    }
  }
}
