import { PrismaClient, Todo } from '@prisma/client';

const prisma = new PrismaClient();

// 마지막 sortOrder 조회 (새 todo = max + 1.0)
export const findMaxSortOrder = async (userId: string, assignedDate: string): Promise<number> => {
    const result = await prisma.todo.aggregate({
        where: {
            userId,
            assignedDate: new Date(assignedDate),
        },
        _max: { sortOrder: true },
    });
    return result._max.sortOrder ?? 0;
};

// todo 조회
export const findTodosByDate = async (userId: string, assignedDate: string): Promise<Todo[]> => {
    return prisma.todo.findMany({
        where: {
            userId,
            assignedDate: new Date(assignedDate),
        },
        orderBy: { sortOrder: 'asc' },
    });
};

// todo 생성
export const createTodo = async (data: {
    userId: string;
    title: string;
    description?: string;
    assignedDate: string;
    sortOrder: number;
}): Promise<Todo> => {
    return prisma.todo.create({
        data: {
            userId: data.userId,
            title: data.title,
            description: data.description ?? null,
            assignedDate: new Date(data.assignedDate),
            sortOrder: data.sortOrder,
        },
    });
};

// todo 삭제
export const findTodoById = async (id: string): Promise<Todo | null> => {
    return prisma.todo.findUnique({ where: { id } });
};

export const deleteTodo = async (id: string): Promise<void> => {
    await prisma.todo.delete({ where: { id } });
};

// todo 업데이트
export const updateTodo = async (
    id: string,
    data: { title?: string; description?: string; assignedDate?: string }
): Promise<Todo> => {
    return await prisma.todo.update({
        where: { id },
        data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.assignedDate !== undefined && { assignedDate: new Date(data.assignedDate) }),
        },
    });
};

// todo 완료 토글
export const toggleTodoComplete = async (id: string, completed: boolean): Promise<Todo> => {
    return await prisma.todo.update({
        where: { id },
        data: { completedAt: completed ? new Date() : null },
    });
};

// todo 순서 변경
export const reorderTodo = async (id: string, sortOrder: number): Promise<Todo> => {
    return await prisma.todo.update({
        where: { id },
        data: { sortOrder },
    });
};
