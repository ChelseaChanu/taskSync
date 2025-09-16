import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom"; 

function Layout() {
  return (
    <div class="w-full min-h-screen md:flex">
      <Sidebar />
      <div class=" flex-1 h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;