import AuthPage from "./components/AuthPage.jsx";
import { Routes, Route } from "react-router-dom";
import ForgotPassword from "./components/ForgotPassword.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Layout from "./components/Layout.jsx";
import AssignTask from "./components/AssignTask.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskCard from "./components/TaskCard.jsx";
import ViewUsers from "./components/ViewUsers.jsx";

function App() {
  return (
    <div className="w-screen flex justify-center">
      <Routes>
        <Route path="/" element={<AuthPage/>} />          
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assign-task" element={<AssignTask />} />
          <Route path="/task-list" element={<TaskList/>} />
          <Route path="/task/:taskId" element={<TaskCard />} />
          <Route path="/view-users" element={<ViewUsers/>} />
        </Route>
      </Routes>
    </div>
  )
}

export default App;