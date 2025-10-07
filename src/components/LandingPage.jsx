import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useSelectedUser } from "./SelectedUserContext";

function LandingPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedUser } = useSelectedUser();

  const isLoggingOut = useRef(false); // prevent false redirects

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Skip if logout is in progress
      if (isLoggingOut.current) return;

      if (!user) {
        // Not logged in → redirect to login
        navigate("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.warn("No user document found. Logging out...");
          handleLogout(); // optional auto-logout
        }
      } catch (err) {
        console.error("Error fetching userDoc:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      isLoggingOut.current = true;
      await signOut(auth);
      localStorage.clear();
      setUserData(null);
      setSelectedUser(null);

      // Redirect to login page
      window.location.replace("/"); 
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Something went wrong while logging out. Try again.");
    }
  };

  const handleRoleClick = (selectedDesignation) => {
    if (!userData) return;

    const userRole = userData.role || userData.designation || "";

    if (userRole === "Principal") {
      if (selectedDesignation === "Teacher" || selectedDesignation === "Admin") setSelectedUser(null);
      else if (selectedDesignation === "Principal") setSelectedUser(userData);
      navigate("/dashboard", { state: { selectedDesignation } });
    } else if (userRole === "Admin") {
      if (selectedDesignation === "Teacher") setSelectedUser(null);
      else if (selectedDesignation === "Admin") setSelectedUser(userData);
      else return alert("You don't have permission for this role.");
      navigate("/dashboard", { state: { selectedDesignation } });
    } else if (userRole === "Teacher") {
      if (selectedDesignation === "Teacher") {
        setSelectedUser(userData);
        navigate("/dashboard", { state: { selectedDesignation } });
      } else alert("You don't have permission for this role.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen !text-gray-600 text-lg">
        Loading user info...
      </div>
    );
  }

  return (
    <div className="bg-[linear-gradient(to_bottom_right,#04283d,#8000FF,#FF00FF)] min-h-screen w-full flex flex-col items-center justify-center">
      <div className="w-[95%] flex flex-col gap-5 rounded !bg-white p-4.5 shadow-[0_5px_15px_rgba(0,0,0,0.35)] mds:w-[90%] mds:gap-10 mds:rounded-2xl mds:p-10 mdln:w-[900px]">
        
        {/* Header section with logo + logout */}
        <div className="flex flex-col items-center gap-3.5 mds:gap-0 mds:flex-row mds:justify-between">
          <div className="w-full flex flex-col items-start">
            <img className="rounded w-[200px]" src={`/Images/tasksync.png`} alt="TaskSync Logo" />
          </div>

          {/* Role Buttons + Logout */}
          <div className="w-full flex flex-row gap-5 items-center justify-between">
            <button
              onClick={() => handleRoleClick("Admin")}
              disabled={!userData}
              className={`uppercase text-sm tracking-wider !text-[#5d5c5c] ${
                !userData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              Admin
            </button>

            <button
              onClick={() => handleRoleClick("Principal")}
              disabled={!userData}
              className={`uppercase text-sm tracking-wider !text-[#5d5c5c] ${
                !userData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              Principal
            </button>

            <button
              onClick={() => handleRoleClick("Teacher")}
              disabled={!userData}
              className={`uppercase text-sm tracking-wider !text-[#5d5c5c] ${
                !userData ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              Teacher
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="!bg-red-500 !hover:bg-red-600 !text-white px-3 py-1 rounded-md text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Hero section */}
        <div className="flex flex-col-reverse items-center gap-3 mds:gap-0 mds:flex-row mdln:gap-10">
          <div className="flex flex-col items-center gap-8">
            <h1 className="!text-[#113449] !text-5xl font-extrabold mds:text-6xl">
              Achieve More, Effortlessly
            </h1>
            <p className="!text-[17px] font-medium !text-[#434345]! mds:pr-10">
              Simplify your workflow, organize projects, and collaborate seamlessly with our intuitive platform.
            </p>
          </div>
          <div className="w-[290px] mds:w-full">
            <img className="w-full" src={`/Images/Landing_Page.png`} alt="Landing Illustration" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;