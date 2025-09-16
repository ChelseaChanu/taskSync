import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function LandingPage() {

  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, []);

  const handleRoleClick = (role) => {
    if (!userData) return;

    const designation = userData.designation;

    if (designation === "Principal") {
      navigate("/dashboard", { state: { role } });
    } else if (designation === "Admin") {
      if (role === "Admin" || role === "Teacher") {
        navigate("/dashboard", { state: { role } });
      } else {
        alert("You don't have permission for this role.");
      }
    } else if (designation === "Teacher") {
      if (role === "Teacher") {
        navigate("/dashboard", { state: { role } });
      } else {
        alert("You don't have permission for this role.");
      }
    }
  };

  return (
    <div class="bg-[linear-gradient(to_bottom_right,#04283d,#8000FF,#FF00FF)] min-h-screen w-full flex flex-col items-center justify-center">
      <div class="w-[95%] flex flex-col gap-5 rounded bg-white p-4.5 shadow-[0_5px_15px_rgba(0,0,0,0.35)] mds:w-[90%] mds:gap-10 mds:rounded-2xl mds:p-10 mdln:w-[900px]">
        <div class="flex flex-col items-center gap-3.5 mds:gap-0 mds:flex-row mds:justify-between">
          <div class="w-full flex flex-col items-start">
            <img class="rounded w-[200px]" src="/public/Assets/Icons/tasksync.png" alt="" />
          </div>
          <ul class="w-full flex flex-row gap-5 items-center justify-between">
            <li onClick={() => handleRoleClick("Admin")} class="uppercase text-sm tracking-wider cursor-pointer text-[#5d5c5c]">Admin</li>
            <li onClick={() => handleRoleClick("Principal")} class="uppercase text-sm tracking-wider cursor-pointer text-[#5d5c5c]">Principal</li>
            <li onClick={() => handleRoleClick("Teacher")} class="uppercase text-sm tracking-wider cursor-pointer text-[#5d5c5c]">Teacher</li>
          </ul>
        </div>
        <div class="flex flex-col-reverse items-center gap-3 mds:gap-0 mds:flex-row mdln:gap-10">
          <div class="flex flex-col items-center gap-8">
            <h1 class="text-[#113449] !text-5xl font-extrabold mds:text-6xl">Achieve More, Effortlessly</h1>
            <p class="text-[17px] font-medium text-[#434345] mds:pr-10">Simplify your workflow, organize projects, and collaborate seamlessly with our intuitive platform.</p>
          </div>
          <div class="w-[290px] mds:w-full">
            <img class="w-full" src="/public/Assets/Icons/Landing_Page.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage;