import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todosLogic';
import { createLogger } from '../../utils/logger'

const logger = createLogger('Todo Log - Lambda');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info({
    message: 'Processing event: Create todo item'
  });

  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const item = await createTodo(newTodo, event.headers.Authorization)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item
    })
  }
}
