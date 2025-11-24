import { useContext, createContext } from "react";

export const TodosContext = createContext();

export function useTodos() {
  return useContext(TodosContext);
}
