import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { deleteTodo } from '../../businessLogic/todosLogic';
import { createLogger } from '../../utils/logger'

const logger = createLogger('Todo Log - Lambda');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info({
    message: 'Processing event: Delete todo item'
  });

  const todoId = event.pathParameters.todoId
  
  try {
    await deleteTodo(todoId, event.headers.Authorization);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: null
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
