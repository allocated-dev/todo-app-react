import { useState } from "react";
import "../style/TodoPage.css";
import { getClasses } from "../lib/helpers";

export default function TodoPage() {
  const [todoItem, setTodoItem] = useState("");
  const [todos, setTodos] = useState([
    {
      id: 1,
      item: "Study",
      completed: true,
    },
    {
      id: 2,
      item: "Read a book",
      completed: false,
    },
    {
      id: 3,
      item: "Go for a walk",
      completed: false,
    },
  ]);

  const handleEnterTodo = (e) => {
    setTodoItem(e.target.value);
  };

  const handleAddTodo = () => {
    if (!todoItem.trim()) {
      return;
    }
    const newTodo = {
      id: todos.length > 0 ? todos[todos.length - 1].id + 1 : 1,
      item: todoItem,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setTodoItem("");
  };

  const handleCompleteTodo = (value, targetId) => {
    setTodos((oldList) =>
      oldList.map((item) =>
        item.id === targetId ? { ...item, completed: value } : item
      )
    );
  };

  return (
    <section className="todo-section">
      <header className="todo-header">
        <h1 className="todo-title">Todo List</h1>
      </header>
      <form
        className="todo-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAddTodo();
        }}
        aria-label="Add todo item"
      >
        <label htmlFor="input-todo" className="todo-label">
          Enter todo item
        </label>
        <input
          type="text"
          id="input-todo"
          name="input-todo"
          placeholder="Type..."
          className="todo-input"
          value={todoItem}
          onChange={handleEnterTodo}
        />
        <button type="submit" className="todo-add-btn">
          Add
        </button>
      </form>
      <main>
        <ul className="todo-list">
          {todos.length > 0
            ? todos.map((todo) => {
                return (
                  <li
                    key={todo.id}
                    className={getClasses(
                      "todo-list-item",
                      todo.completed ? "completed" : ""
                    )}
                  >
                    <label className="todo-checkbox-label">
                      <input
                        type="checkbox"
                        className="todo-checkbox"
                        checked={todo.completed}
                        onChange={(e) => {
                          handleCompleteTodo(e.target.checked, todo.id);
                        }}
                      />
                      <span className="todo-item-text">{todo.item}</span>
                    </label>
                  </li>
                );
              })
            : null}
        </ul>
      </main>
    </section>
  );
}
