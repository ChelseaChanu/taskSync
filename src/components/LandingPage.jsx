import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

function LandingPage() {

  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed, user:", user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        console.log("Firestore doc exists:", userDoc.exists());
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          console.log("userData set:", userDoc.data());
        }
      }
    });

    return () => unsubscribe();
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
    <div className="bg-[linear-gradient(to_bottom_right,#04283d,#8000FF,#FF00FF)] min-h-screen w-full flex flex-col items-center justify-center">
      <div className="w-[95%] flex flex-col gap-5 rounded bg-white p-4.5 shadow-[0_5px_15px_rgba(0,0,0,0.35)] mds:w-[90%] mds:gap-10 mds:rounded-2xl mds:p-10 mdln:w-[900px]">
        <div className="flex flex-col items-center gap-3.5 mds:gap-0 mds:flex-row mds:justify-between">
          <div className="w-full flex flex-col items-start">
            <img className="rounded w-[200px]" src={`/Images/tasksync.png`} alt="" />
          </div>
          <div className="w-full flex flex-row gap-5 items-center justify-between">
            <button onClick={() => handleRoleClick("Admin")} className="uppercase text-sm tracking-wider cursor-pointer text-[#5d5c5c]">Admin</button>
            <button onClick={() => handleRoleClick("Principal")} className="uppercase text-sm tracking-wider cursor-pointer text-[#5d5c5c]">Principal</button>
            <button onClick={() => handleRoleClick("Teacher")} className="uppercase text-sm tracking-wider cursor-pointer text-[#5d5c5c]">Teacher</button>
          </div>
        </div>
        <div className="flex flex-col-reverse items-center gap-3 mds:gap-0 mds:flex-row mdln:gap-10">
          <div className="flex flex-col items-center gap-8">
            <h1 className="text-[#113449] !text-5xl font-extrabold mds:text-6xl">Achieve More, Effortlessly</h1>
            <p className="text-[17px] font-medium text-[#434345] mds:pr-10">Simplify your workflow, organize projects, and collaborate seamlessly with our intuitive platform.</p>
          </div>
          <div className="w-[290px] mds:w-full">
            <img className="w-full" src={`/Images/Landing_Page.png`} alt="" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage;