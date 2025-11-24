import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trash, Plus } from "lucide-react";
import { TODOS_DAL } from "../lib/data-access";
import AddTodoInline from "./AddTodoInline";
import { formatTodoDateTime } from "@/lib/utils";
import { useTodos } from "@/hooks/useTodos";

export default function TasksList() {
  const { todos, refresh } = useTodos();
  const [showAddTask, setShowAddTask] = useState(false);

  return (
    <Card className="shadow-none">
      <CardContent>
        <ul className="divide-y">
          {/* ======================= TODOS ======================= */}
          {todos?.map((todo) => {
            const checkboxId = `todo-${todo.id}`;

            return (
              <li
                key={todo.id}
                className="group flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={checkboxId}
                  checked={!!todo.completed}
                  onCheckedChange={(checked) => {
                    TODOS_DAL.update({ ...todo, completed: checked });
                    refresh();
                  }}
                  className="w-5 h-5 cursor-pointer"
                />

                <div className="flex-1 flex items-center justify-start gap-3 cursor-pointer">
                  <Label
                    htmlFor={checkboxId}
                    className={`text-base font-medium ${
                      todo.completed
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.title}
                  </Label>
                  {todo.priority && todo.priority !== "none" && (
                    <Badge>{todo.priority.toUpperCase()}</Badge>
                  )}
                </div>

                <div className="text-sm text-gray-500 font-medium">
                  {formatTodoDateTime(todo.date, todo.time)}
                </div>

                {/* DELETE ICON */}
                <Trash
                  onClick={() => {
                    TODOS_DAL.delete(todo.id);
                    refresh();
                  }}
                  className="
                    text-red-500 w-5 h-5 cursor-pointer
                    opacity-0 group-hover:opacity-100
                    translate-x-2 group-hover:translate-x-0
                    transition-all duration-200
                  "
                />
              </li>
            );
          })}

          {/* ======================= ADD TODO INPUT ======================= */}
          {showAddTask && (
            <AddTodoInline key="add-inline" setShowAddTask={setShowAddTask} />
          )}

          {/* ======================= ADD BUTTON ======================= */}
          {!showAddTask && (
            <li key="add-btn" className="flex justify-center items-center">
              <Button
                variant="secondary"
                className="w-full my-2 py-5"
                onClick={() => setShowAddTask(true)}
              >
                <Plus />
              </Button>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
