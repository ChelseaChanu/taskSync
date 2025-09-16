import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function Sidebar() {

  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState({ firstName: "", lastName: "" });
  const [designation, setDesignation] = useState("");

  async function getUserData(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return { firstName: data.firstName, lastName: data.lastName, designation: data.designation };
      } else {
        console.log("No such user document!");
        return { firstName: "", lastName: "" };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { firstName: "", lastName: "" };
    }
  }

  useEffect(() => {
    // Auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const data = await getUserData(user);
        setUserName({ firstName: data.firstName, lastName: data.lastName });
        setDesignation(data.designation || "");
      }
    });

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
        <div class="sticky top-0 left-0 z-20 w-full h-16 flex flex-row items-center justify-between p-5 bg-gradient-to-r from-[#282b36] via-[#4c4566] to-[#66617a] shadow-[0_10px_20px_rgba(0,0,0,0.19),_0_6px_6px_rgba(0,0,0,0.23)]
        md:hidden">
          <div class="w-8 cursor-pointer" onClick={() => setIsOpen(true)}>
            <img src="/Assets/Icons/Menu Button.png" alt="Menu" />
          </div>
          <div class="w-8">
            <img src="/Assets/Icons/user-head.png" alt="User" />
          </div>
        </div>
      )}

    {/* expand slidebar (mobile view on click) */}
      {isOpen && (
        <div class="fixed top-0 left-0 w-full min-h-screen z-20 bg-[linear-gradient(135deg,_#282b36,_#4c4566)] flex flex-col p-5 items-start gap-5
        md:hidden ">
          <div class="w-full md:hidden" onClick={() => setIsOpen(false)}>
            <img src="/Assets/Icons/Menu Button.png" alt="Menu" class="w-8"/>
          </div>
          <div class="w-full flex flex-row items-center gap-5 py-7 border-b border-gray-50">
            <div class='w-14 h-14 bg-cyan-200 flex items-center justify-center rounded-full'>
              <div class='w-[54px] h-[54px] bg-gray-700 flex items-center justify-center rounded-full'>
                <img src="/Assets/Icons/user-head.png" alt="User" />
              </div>
            </div>
            <div class="flex flex-col gap-0.5">
              <h6 class="text-[#efefef] text-xl font-medium">{`${userName.firstName} ${userName.lastName}`}</h6>
              <p class="text-[#efefef] text-sm">{designation}</p>
            </div>
          </div>
          <ul class="w-full flex flex-col space-y-2 py-8">
            <li class="py-4">
              <Link
                to="/dashboard"
                class="flex flex-row items-center gap-3"
                onClick={() => setIsOpen(false)}>
                <img src="/public/Assets/Icons/Dashboard.png" alt="" />
                <p class="text-[#efefef]">Dashboard</p>
              </Link>
            </li>
            <li class="py-4">
              <Link
                to="/assign-task" 
                class="flex flex-row items-center gap-3"
                onClick={() => setIsOpen(false)}>
                <img src="/public/Assets/Icons/Assign-task.png" alt="" />
                <p class="text-[#efefef]">Assign Task</p>
              </Link>
            </li>
            <li class="py-4">
              <Link
                to="/recieved-task"
                class="flex flex-row items-center gap-3"
                onClick={() => setIsOpen(false)}>
                <img src="/public/Assets/Icons/recieve-icon.png" alt="" />
                <p class="text-[#efefef]">Received Tasks</p>
              </Link>
            </li>
            <li class="py-4">
              <Link
                to="/history"
                class="flex flex-row items-center gap-3"
                onClick={() => setIsOpen(false)}>
                <img src="/public/Assets/Icons/History.png" alt="" />
                <p class="text-[#efefef]">History</p>
              </Link>
            </li>
            <li class="py-4">
              <Link
                to="/history"
                class="flex flex-row items-center gap-3"
                onClick={() => setIsOpen(false)}>
                <img src="/public/Assets/Icons/" alt="" />
                <p class="text-[#efefef]">Logout</p>
              </Link>
            </li>
          </ul>
        </div>
      )}
      <div class="max-[790px]:hidden w-[260px] min-h-screen z-20 bg-[linear-gradient(135deg,_#282b36,_#4c4566)] flex flex-col p-5 items-start gap-5 flex-shrink-0">
        <div class="w-full md:hidden" onClick={() => setIsOpen(false)}>
          <img src="/Assets/Icons/Menu Button.png" alt="Menu" class="w-8"/>
        </div>
        <div class="w-full flex flex-row items-center gap-5 py-7 border-b border-gray-50">
          <div class='w-14 h-14 bg-cyan-200 flex items-center justify-center rounded-full'>
            <div class='w-[54px] h-[54px] bg-gray-700 flex items-center justify-center rounded-full'>
              <img src="/Assets/Icons/user-head.png" alt="User" />
            </div>
          </div>
          <div class="flex flex-col gap-0.5">
            <h6 class="text-[#efefef] text-xl font-medium">{`${userName.firstName} ${userName.lastName}`}</h6>
            <p class="text-[#efefef] text-sm">{designation}</p>
          </div>
        </div>
        <ul class="w-full flex flex-col space-y-2 py-8">
          <li class="py-4">
            <Link
              to="/dashboard"
              class="flex flex-row items-center gap-3"
              onClick={() => setIsOpen(false)}>
              <img src="/public/Assets/Icons/Dashboard.png" alt="" />
              <p class="text-[#efefef]">Dashboard</p>
            </Link>
          </li>
          <li class="py-4">
            <Link
              to="/assign-task" 
              class="flex flex-row items-center gap-3"
              onClick={() => setIsOpen(false)}>
              <img src="/public/Assets/Icons/Assign-task.png" alt="" />
              <p class="text-[#efefef]">Assign Task</p>
            </Link>
          </li>
          <li class="py-4">
            <Link
              to="/recieved-task"
              class="flex flex-row items-center gap-3"
              onClick={() => setIsOpen(false)}>
              <img src="/public/Assets/Icons/recieve-icon.png" alt="" />
              <p class="text-[#efefef]">Received Tasks</p>
            </Link>
          </li>
          <li class="py-4">
            <Link
              to="/history"
              class="flex flex-row items-center gap-3"
              onClick={() => setIsOpen(false)}>
              <img src="/public/Assets/Icons/History.png" alt="" />
              <p class="text-[#efefef]">History</p>
            </Link>
          </li>
          <li class="py-4">
              <Link
                to="/history"
                class="flex flex-row items-center gap-3"
                onClick={() => setIsOpen(false)}>
                <img src="/public/Assets/Icons/" alt="" />
                <p class="text-[#efefef]">Logout</p>
              </Link>
            </li>
        </ul>
      </div>
    </>
  )
}

export default Sidebar;