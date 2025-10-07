import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen overflow-x-hidden bg-[#060C1A]">
      <Sidebar/>
      <div className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div> 
  );
}

export default Layout;