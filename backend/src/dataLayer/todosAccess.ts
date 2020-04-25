import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { S3 } from 'aws-sdk'

import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('Todo Log - Data Layer')

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly s3: S3 = new XAWS.S3({signatureVersion: 'v4'}),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex =  process.env.TODO_INDEX,
    private readonly bucketName =  process.env.TODO_S3_BUCKET,
    private readonly urlExpiration =  process.env.SIGNED_URL_EXPIRATION) {
  }

  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.04.html
  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info({
      message: 'Getting all todos'
    });

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName : this.userIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()    

    return result.Items as TodoItem[]
  }

  async getTodoById(userId: string, todoId: string): Promise<TodoItem> {
    logger.info({
      message: 'Getting todo by todoId',
      userId,
      todoId
    });

    const result = await this.docClient.query({
      TableName : this.todosTable,
      // IndexName : this.userIdIndex,
      KeyConditionExpression: 'userId = :userId and todoId = :todoId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':todoId': todoId
      }
    }).promise()

    return result.Items[0] as TodoItem;
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info({
      message: 'Creating todo',
      todoItem
    });

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise();

    return todoItem;
  }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<void> {
    logger.info({
      message: 'Updating todo',
      userId,
      todoId,
      item: todoUpdate
    });

    var params = {
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'SET #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
      }
    };

    await this.docClient.update(params).promise();
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info({
      message: 'Deleting todo',
      userId,
      todoId
    });

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    }).promise();
  }

  async generateUploadUrl(todoId: string): Promise<string> {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
  }

  async updateTodoUrl(userId: string, todoId: string): Promise<void> {
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`;
    var params = {
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    };

    await this.docClient.update(params).promise();
  }

  async deleteS3Image(todoId: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: todoId
    }).promise();
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info({
      message: 'Creating a local DynamoDB instance'
    });

    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
