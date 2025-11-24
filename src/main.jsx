import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TodosProvider } from "./context/TodosProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TodosProvider>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </TodosProvider>
  </StrictMode>
);
