import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useSelectedUser } from "./SelectedUserContext";

function LandingPage() {

  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedUser } = useSelectedUser();

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleClick = (selectedDesignation) => {
  if (!userData) return;

  const userRole = userData.role || userData.designation || "";

  if (userRole === "Principal") {
    if (selectedDesignation === "Teacher" || selectedDesignation === "Admin") {
      setSelectedUser(null); // search/default state
    } else if (selectedDesignation === "Principal") {
      setSelectedUser(userData); // own dashboard
    }
    navigate("/dashboard", { state: { selectedDesignation } });

  } else if (userRole === "Admin") {
    if (selectedDesignation === "Teacher") {
      setSelectedUser(null); // search state
    } else if (selectedDesignation === "Admin") {
      setSelectedUser(userData); // own dashboard
    } else {
      alert("You don't have permission for this role.");
      return;
    }
    navigate("/dashboard", { state: { selectedDesignation } });

  } else if (userRole === "Teacher") {
    if (selectedDesignation === "Teacher") {
      setSelectedUser(userData); // own dashboard
      navigate("/dashboard", { state: { selectedDesignation } });
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
            <button onClick={() => handleRoleClick("Admin")}
              disabled={loading || !userData}
              className={`uppercase text-sm tracking-wider text-[#5d5c5c] 
                ${loading || !userData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>Admin</button>

            <button onClick={() => handleRoleClick("Principal")}
              disabled={loading || !userData}
              className={`uppercase text-sm tracking-wider text-[#5d5c5c] 
                ${loading || !userData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>Principal</button>

            <button onClick={() => handleRoleClick("Teacher")}
              disabled={loading || !userData}
              className={`uppercase text-sm tracking-wider text-[#5d5c5c] 
                ${loading || !userData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>Teacher</button>
          </div>
        </div>
        {loading &&  
          <div className="flex items-center justify-center">
            <p className="text-[#2c2b2b] text-xl font-semibold">Loading user info...</p>
          </div>
        }
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