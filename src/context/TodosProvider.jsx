import { useState } from "react";
import { TODOS_DAL } from "@/lib/data-access";
import { TodosContext } from "@/hooks/useTodos";

export function TodosProvider({ children }) {
  const [todos, setTodos] = useState(() => TODOS_DAL.getAll());

  const refresh = () => {
    setTodos(TODOS_DAL.getAll());
  };

  return (
    <TodosContext.Provider value={{ todos, refresh }}>
      {children}
    </TodosContext.Provider>
  );
}
