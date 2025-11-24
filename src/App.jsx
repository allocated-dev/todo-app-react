import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import MyTasks from "@/components/MyTasks";
import { Toaster } from "sonner";

function App() {
  const [currentView, setCurrentView] = useState("all-tasks");

  const VIEWS = {
    "all-tasks": <MyTasks />,
    important: <div>Important Tasks View</div>,
    completed: <div>Completed Tasks View</div>,
    incomplete: <div>Incomplete Tasks View</div>,
  };

  return (
    <div className="flex w-full">
      <AppSidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 w-full p-10">{VIEWS[currentView]}</main>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
