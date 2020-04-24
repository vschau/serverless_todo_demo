import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { S3 } from 'aws-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('Todo Log')

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly s3: S3 = new XAWS.S3(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex =  process.env.TODO_INDEX,
    private readonly bucketName =  process.env.TODO_S3_BUCKET,
    private readonly urlExpiration =  process.env.SIGNED_URL_EXPIRATION) {
  }

  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.04.html
  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')

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

  // async getTodoById(todoId: string): Promise<TodoItem> {
  //   console.log('Getting todo item by id')

  //   const result = await this.docClient.get({
  //     TableName: this.todosTable,
  //     Key: {
  //       todoId
  //     }
  //   }).promise();

  //   return result.Item as TodoItem;
  // }

  async getTodoById(todoId: string, userId: string): Promise<TodoItem> {
    console.log('Getting todo by id', todoId)

    const params = {
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
        ExpressionAttributeValues: {
            ':todoId': todoId,
            ':userId': userId,
        },
        ScanIndexForward: false
    };
    const result = await this.docClient.query(params).promise();
    const items = result.Items;
    return items[0] as TodoItem;
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    console.log('Creating todo')

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo;
  }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate) {
    logger.info({
      message: 'Log: Updating todo',
      item: todoUpdate
    });

    console.log('Updating todo')
    console.log('todoupdate item', todoUpdate);
    console.log('userId', userId);
    console.log('todoId', todoId);

    // var params = {
    //   TableName: this.todosTable,
    //   Key: {
    //     userId,
    //     todoId
    //   },
    //   UpdateExpression: "set name = :name, dueDate = :dueDate, done = :done",
    //   ExpressionAttributeValues: {
    //     ":name": todoUpdate.name,
    //     ":dueDate": todoUpdate.dueDate,
    //     ":done": todoUpdate.done
    //   },
    //   ReturnValues: 'UPDATED_NEW'
    // };

    // const data = await this.docClient.update(params).promise();
    // console.log('data updated:', data);
  

    const response = await this.docClient.update({
      TableName: this.todosTable,
      Key: {
          userId,
          todoId
      },
      UpdateExpression: 'set name = :name, done = :done, dueDate = :dueDate',
      ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':done': todoUpdate.done,
          ':dueDate': todoUpdate.dueDate
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    console.log('todo response', response);
  }

  // todo: change any
  async deleteTodo(userId: string, todoId: string){
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

  async updateTodoUrl(todoId: string) {
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`;
    var params = {
      TableName: this.todosTable,
      Key: {
        todoId
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": attachmentUrl
      }
    };

    await this.docClient.update(params).promise();
  }
}
