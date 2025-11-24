const STORAGE_KEY = "simpleDo.todos";

export const TODOS_DAL = {
  getAll: () => {
    const todosJson = localStorage.getItem(STORAGE_KEY);
    return todosJson ? JSON.parse(todosJson) : [];
  },
  saveAll: (todos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  },
  add: (todo) => {
    const todos = TODOS_DAL.getAll();
    todos.push(todo);
    TODOS_DAL.saveAll(todos);
  },
  update: (updatedTodo) => {
    const oldTodos = TODOS_DAL.getAll();
    const todos = oldTodos.map((todo) =>
      todo.id === updatedTodo.id ? updatedTodo : todo
    );
    TODOS_DAL.saveAll(todos);
  },
  delete: (todoId) => {
    let todos = TODOS_DAL.getAll();
    todos = todos.filter((todo) => todo.id !== todoId);
    TODOS_DAL.saveAll(todos);
  },
};
