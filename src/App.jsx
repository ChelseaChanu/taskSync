import Login from "./components/Login.jsx";
import { Routes, Route } from "react-router-dom";
import ForgotPassword from "./components/ForgotPassword.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Layout from "./components/Layout.jsx";
import AssignTask from "./components/AssignTask.jsx";
import RecievedTask from "./components/RecievedTask.jsx";
import TaskCard from "./components/TaskCard.jsx";
import LandingPage from "./components/LandingPage.jsx";

function App() {


  return (
    <div class="w-screen flex justify-center">
      <Routes>
        <Route path="/" element={<Login/>} />          
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/landing-page" element={<LandingPage/>} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assign-task" element={<AssignTask />} />
          <Route path="/recieved-task" element={<RecievedTask/>} />
          <Route path="/task/:taskId" element={<TaskCard />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App;