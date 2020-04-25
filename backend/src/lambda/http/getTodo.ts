import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import 'source-map-support/register'

import { getTodoById } from '../../businessLogic/todosLogic';
import { createLogger } from '../../utils/logger'

const logger = createLogger('Todo Log - Lambda');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info({
    message: 'Processing event: Get todo item'
  });

  const todoId = event.pathParameters.todoId

  const todo = await getTodoById(todoId, event.headers.Authorization)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      item: todo
    })
  }
}
