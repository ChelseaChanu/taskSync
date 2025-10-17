import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState({ firstName: "", lastName: "" });
  const [designation, setDesignation] = useState("");
  const navigate = useNavigate();

  // Fetch logged-in user data
  async function getUserData(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return { firstName: data.firstName, lastName: data.lastName, designation: data.designation };
      } else {
        console.log("No such user document!");
        return { firstName: "", lastName: "", designation: "" };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { firstName: "", lastName: "", designation: "" };
    }
  }

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

  // Define links
  const links = [
    { name: "Dashboard", path: "/dashboard", icon: "/Images/Dashboard.png" },
    { name: "Assign Task", path: "/assign-task", icon: "/Images/Assign-task.png" },
    { name: "Task List", path: "/task-list", icon: "/Images/recieve-icon.png" },
    // Team Overview only if logged-in user is not a Teacher
    ...(designation !== "Teacher"
      ? [{ name: "Team Overview", path: "/view-users", icon: "/Images/recieve-icon.png" }]
      : []),
  ];

  const renderLinks = () => (
    <ul className="w-full flex flex-col space-y-2 py-8">
      {designation && links.map((link, idx) => (
        <li key={idx} className="py-4">
          <Link
            to={link.path}
            className="flex flex-row items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <img src={link.icon} alt={link.name} />
            <p className="!text-[#efefef]">{link.name}</p>
          </Link>
        </li>
      ))}
      {designation && (
        <li className="py-4">
          <button
            onClick={handleLogout}
            className="flex flex-row items-center gap-3"
          >
            <p className="!text-[#efefef]">Logout</p>
          </button>
        </li>
      )}
    </ul>
  );

  return (
    <>
      {/* Mobile collapsed */}
      {!isOpen && (
        <div className="sticky top-0 left-0 z-20 w-full h-16 flex flex-row items-center justify-between p-5 bg-gradient-to-r !from-[#282b36] !via-[#4c4566] !to-[#66617a] shadow-[0_10px_20px_rgba(0,0,0,0.19),_0_6px_6px_rgba(0,0,0,0.23)] md:hidden">
          <div className="w-8 cursor-pointer" onClick={() => setIsOpen(true)}>
            <img src={`/Images/Menu Button.png`} alt="Menu" />
          </div>
          <div className="w-8">
            <img src={`/Images/user-head.png`} alt="User" />
          </div>
        </div>
      )}

      {/* Mobile expanded */}
      {isOpen && (
        <div className="fixed top-0 left-0 w-full min-h-screen z-20 bg-[linear-gradient(135deg,_#282b36,_#4c4566)] flex flex-col p-5 items-start gap-5 md:hidden">
          <div className="w-full" onClick={() => setIsOpen(false)}>
            <img src={`/Images/Menu Button.png`} alt="Menu" className="w-8"/>
          </div>
          <div className="w-full flex flex-row items-center gap-5 py-7 border-b !border-gray-50">
            <div className='w-14 h-14 !bg-cyan-200 flex items-center justify-center rounded-full'>
              <div className='w-[54px] h-[54px] !bg-gray-700 flex items-center justify-center rounded-full'>
                <img src={`/Images/user-head.png`} alt="User" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <h6 className="!text-[#efefef] text-xl font-medium">{`${userName.firstName} ${userName.lastName}`}</h6>
              <p className="!text-[#efefef] text-sm">{designation}</p>
            </div>
          </div>
          {renderLinks()}
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="max-[790px]:hidden w-[260px] min-h-screen z-20 bg-[linear-gradient(135deg,_#282b36,_#4c4566)] flex flex-col p-5 items-start gap-5 flex-shrink-0">
        <div className="w-full flex flex-row items-center gap-5 py-7 border-b !border-gray-50">
          <div className='w-14 h-14 !bg-cyan-200 flex items-center justify-center rounded-full'>
            <div className='w-[54px] h-[54px] !bg-gray-700 flex items-center justify-center rounded-full'>
              <img src={`/Images/user-head.png`} alt="User" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <h6 className="!text-[#efefef] text-xl font-medium">{`${userName.firstName} ${userName.lastName}`}</h6>
            <p className="!text-[#efefef] text-sm">{designation}</p>
          </div>
        </div>
        {renderLinks()}
      </div>
    </>
  )
}

export default Sidebar;
