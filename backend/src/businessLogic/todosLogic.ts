import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodosAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { CreateTodoResponse } from '../responses/CreateTodoResponse'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const todoAccess = new TodosAccess()

export async function getAllTodos(authorization: string): Promise<CreateTodoResponse[]> {
  const userId = parseUserId(authorization);
  // return (await todoAccess.getAllTodos(userId))
  //     .map( ({ todoId, createdAt, name, dueDate, done, attachmentUrl}) =>
  //           ({ todoId, createdAt, name, dueDate, done, attachmentUrl}) as CreateTodoResponse
  //     );
  return (await todoAccess.getAllTodos(userId))
        .map(mapToCreateTodoResponse);
}

export async function createTodo(createTodoRequest: CreateTodoRequest, authorization: string): Promise<CreateTodoResponse> {
  const itemId = uuid.v4()
  const userId = parseUserId(authorization)

  const todo = await todoAccess.createTodo({
    userId: userId,
    todoId: itemId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  });

  return mapToCreateTodoResponse(todo);
}

export async function updateTodo(todoId: string, updateTodoRequest: UpdateTodoRequest, authorization: string) {
  const userId = parseUserId(authorization);
  // const todo = await todoAccess.getTodoById(todoId);

  // if (!todo)
  //   throw new Error('Todo item doesn\'t exist')

  todoAccess.updateTodo(userId, todoId, {
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  });

  // if (updatedItem instanceof AWSError)
  //   throw new Error('Todo item doesn\'t exist')
}

// todo: change any
export async function deleteTodo(todoId: string, authorization: string) {
  const userId = parseUserId(authorization);
  // const todo = await todoAccess.getTodoById(todoId);

  // if (!todo)
  //   throw new Error('Todo item doesn\'t exist')

  todoAccess.deleteTodo(userId, todoId);

  // if (updatedItem instanceof AWSError)
  //   throw new Error('Todo item doesn\'t exist')
}

// todo: how do I update the attachment url? or where?
export async function generateUploadUrl(todoId: string): Promise<string>{
  const signedUrl = todoAccess.generateUploadUrl(todoId);
  await todoAccess.updateTodoUrl(todoId);
  return signedUrl;
}

function mapToCreateTodoResponse(data: TodoItem): CreateTodoResponse {
  return {
    todoId: data.todoId,
    createdAt: data.createdAt,
    name: data.name,
    dueDate: data.dueDate,
    done: data.done,
    attachmentUrl: data.attachmentUrl
  } as CreateTodoResponse;
}

