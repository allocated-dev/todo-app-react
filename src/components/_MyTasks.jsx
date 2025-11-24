import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import TaskList from "./TasksList";

export default function MyTasks() {
  const [todos, setTodos] = useState([
  ]);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(""); // optional

  const [time, setTime] = useState("");

  // date limits
  const today = new Date();
  const maxDate = new Date();
  const [date, setDate] = useState(today);
  maxDate.setDate(today.getDate() + 30);

  function handleCreateTask() {
    if (!title.trim() || !date || !time) return;

    const newTask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      time: `${date.toDateString()} at ${time}`,
      tag: priority
        ? priority === "high"
          ? "High Priority"
          : "Low Priority"
        : null,
    };

    setTodos((prev) => [...prev, newTask]);

    setTitle("");
    setPriority("");
    setDate(null);
    setTime("");
  }

  return (
    <section className="">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          My Tasks - Today
        </h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" /> New Task
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block mb-1 font-medium text-sm">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task"
                />
              </div>

              {/* Priority optional */}
              <div>
                <label className="block mb-1 font-medium text-sm">
                  Priority
                </label>

                <RadioGroup
                  value={priority}
                  onValueChange={setPriority}
                  className="flex items-center gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="priority-high" />
                    <label htmlFor="priority-high">High</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="priority-low" />
                    <label htmlFor="priority-low">Low</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block mb-1 font-medium text-sm">
                  Due Date <span className="text-red-500">*</span>
                </label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {date ? date.toDateString() : "Pick a date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(day) => day < today || day > maxDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker (shadcn approved way) */}
              <div>
                <label className="block mb-1 font-medium text-sm">
                  Time <span className="text-red-500">*</span>
                </label>

                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreateTask}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <TaskList todos={todos} />
    </section>
  );
}
