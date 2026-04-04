import { serializeTodo } from '../lib/apiSerializers.js';
import * as todosRepository from '../repositories/todos.repository.js';

export const getTodos = async (userId: string, assignedDate: string) => {
    const todos = await todosRepository.findTodosByDate(userId, assignedDate);
    return todos.map(serializeTodo);
};

export const createTodo = async (
    userId: string,
    body: {
        title: string;
        description?: string;
        assigned_date: string;
    }
) => {
    // 해당 날짜의 마지막 sortOrder 조회 후 +1.0
    const maxOrder = await todosRepository.findMaxSortOrder(userId, body.assigned_date);
    const sortOrder = maxOrder + 1.0;

    const todo = await todosRepository.createTodo({
        userId,
        title: body.title,
        description: body.description,
        assignedDate: body.assigned_date,
        sortOrder,
    });
    return serializeTodo(todo);
};

export const deleteTodo = async (userId: string, todoId: string) => {
    const todo = await todosRepository.findTodoById(todoId);

    if (!todo) {
        const err = new Error('해당 투두를 찾을 수 없습니다.') as any;
        err.code = 'NOT_FOUND';
        throw err;
    }
    if (todo.userId !== userId) {
        const err = new Error('본인의 투두만 삭제할 수 있습니다.') as any;
        err.code = 'FORBIDDEN';
        throw err;
    }
    if (todo.completedAt !== null) {
        const err = new Error('완료된 투두는 삭제할 수 없습니다. 완료 기록은 보존됩니다.') as any;
        err.code = 'VALIDATION_ERROR';
        throw err;
    }

    return todosRepository.deleteTodo(todoId);
};

export const updateTodo = async (
    userId: string,
    todoId: string,
    body: { title?: string; description?: string; assigned_date?: string }
) => {
    const todo = await todosRepository.findTodoById(todoId);

    if (!todo) {
        const err = new Error('해당 투두를 찾을 수 없습니다.') as any;
        err.code = 'NOT_FOUND';
        throw err;
    }
    if (todo.userId !== userId) {
        const err = new Error('본인의 투두만 수정할 수 없습니다.') as any;
        err.code = 'FORBIDDEN';
        throw err;
    }

    const updated = await todosRepository.updateTodo(todoId, {
        title: body.title,
        description: body.description,
        assignedDate: body.assigned_date,
    });
    return serializeTodo(updated);
};

export const toggleComplete = async (userId: string, todoId: string, completed: boolean) => {
    const todo = await todosRepository.findTodoById(todoId);

    if (!todo) {
        const err = new Error('해당 투두를 찾을 수 없습니다.') as any;
        err.code = 'NOT_FOUND';
        throw err;
    }
    if (todo.userId !== userId) {
        const err = new Error('본인의 투두만 수정할 수 있습니다.') as any;
        err.code = 'FORBIDDEN';
        throw err;
    }

    const updated = await todosRepository.toggleTodoComplete(todoId, completed);
    return serializeTodo(updated);
};

export const reorderTodo = async (
    userId: string,
    todoId: string,
    prevOrder: number | null,
    nextOrder: number | null
) => {
    if (prevOrder !== null && nextOrder !== null && prevOrder >= nextOrder) {
        const err = new Error('prev_order는 next_order보다 작아야 합니다.') as any;
        err.code = 'VALIDATION_ERROR';
        throw err;
    }

    const todo = await todosRepository.findTodoById(todoId);

    if (!todo) {
        const err = new Error('해당 투두를 찾을 수 없습니다.') as any;
        err.code = 'NOT_FOUND';
        throw err;
    }
    if (todo.userId !== userId) {
        const err = new Error('본인의 투두만 수정할 수 있습니다.') as any;
        err.code = 'FORBIDDEN';
        throw err;
    }

    let newOrder: number;
    if (prevOrder === null && nextOrder !== null) {
        newOrder = nextOrder / 2;
    } else if (nextOrder === null && prevOrder !== null) {
        newOrder = prevOrder + 1.0;
    } else {
        newOrder = (prevOrder! + nextOrder!) / 2;
    }

    const updated = await todosRepository.reorderTodo(todoId, newOrder);
    return serializeTodo(updated);
};
