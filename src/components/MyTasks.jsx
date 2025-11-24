import TaskList from "./TasksList";

export default function MyTasks() {
  return (
    <section className="">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">All Tasks</h1>
      </header>
      <TaskList />
    </section>
  );
}
