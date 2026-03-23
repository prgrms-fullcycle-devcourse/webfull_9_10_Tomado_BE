import * as todosRepository from '../repositories/todos.repository.js';

export const getTodos = async (userId: string, assignedDate: string) => {
    return todosRepository.findTodosByDate(userId, assignedDate);
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

    return todosRepository.createTodo({
        userId,
        title: body.title,
        description: body.description,
        assignedDate: body.assigned_date,
        sortOrder,
    });
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

    return todosRepository.updateTodo(todoId, {
        title: body.title,
        description: body.description,
        assignedDate: body.assigned_date,
    });
};
