import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { TODOS_DAL } from "../lib/data-access";
import { getRandomUUID } from "@/lib/utils";
import { toast } from "sonner";
import { useTodos } from "../hooks/useTodos";

export default function AddTodoInline({ setShowAddTask }) {
  const { refresh } = useTodos();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);
  maxDate.setHours(0, 0, 0, 0);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("none");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");

  const handleAddTodo = () => {
    if (!title.trim() || !date || !time) {
      toast.error("Please fill in all required fields.");
      return;
    }

    TODOS_DAL.add({
      id: getRandomUUID(),
      title,
      priority,
      date: date.toDateString(),
      time,
    });

    setShowAddTask(false);
    refresh();
  };

  return (
    <li
      className="
        flex flex-col p-5 bg-muted/40 rounded-md mt-2
        transition-all duration-300 opacity-0 animate-fadeIn
      "
    >
      <div className="grid grid-cols-5 gap-4">
        {/* Task Title */}
        <div className="col-span-2">
          <Label htmlFor="task-title" className="text-sm font-medium">
            Task <span className="text-red-500">*</span>
          </Label>
          <Input
            id="task-title"
            placeholder="Enter task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Priority Select */}
        <div>
          <Label className="text-sm font-medium">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div>
          <Label className="text-sm font-medium">
            Due Date <span className="text-red-500">*</span>
          </Label>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start mt-1 text-left"
              >
                {date ? date.toDateString() : "Pick a date"}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(day) => {
                  const d = new Date(day);
                  d.setHours(0, 0, 0, 0);
                  return d < today || d > maxDate;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time */}
        <div>
          <Label className="text-sm font-medium">
            Time <span className="text-red-500">*</span>
          </Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        <Button className="flex-1 h-12 text-base" onClick={handleAddTodo}>
          Add Task
        </Button>
        <Button
          variant="secondary"
          className="flex-1 h-12 text-base"
          onClick={() => setShowAddTask(false)}
        >
          Cancel
        </Button>
      </div>
    </li>
  );
}
