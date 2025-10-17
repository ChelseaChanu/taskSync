import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import RecieveTaskCard from "./RecieveTaskCard";
import { useNavigate } from "react-router-dom";
import { useSelectedUser } from "./SelectedUserContext";

function TaskList() {
  const navigate = useNavigate();
  const { selectedUser } = useSelectedUser();

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInUserRole, setLoggedInUserRole] = useState(null);
  const [receivedTasks, setReceivedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("received");
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

  // --- Fetch logged-in user & role ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setLoggedInUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role || userDoc.data().designation || "teacher";
          setLoggedInUserRole(role.toLowerCase());
        } else {
          setLoggedInUserRole("teacher");
        }
      }
      setIsRoleLoaded(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Fetch tasks ---
  useEffect(() => {
    if (!loggedInUser) return;

    const viewedUid = selectedUser?.uid || loggedInUser.uid;

    // --- Received tasks ---
    const receivedQuery = query(
      collection(db, "tasks"),
      where("assignedToUids", "array-contains", viewedUid)
    );

    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setReceivedTasks(data);
    });

    // --- Assigned tasks ---
    const assignedQuery = query(
      collection(db, "tasks"),
      where("createdBy", "==", loggedInUser.uid)
    );

    const unsubscribeAssigned = onSnapshot(assignedQuery, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setAssignedTasks(data);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeAssigned();
    };
  }, [loggedInUser, selectedUser]);

  // --- Auto-set visible tab based on role ---
  useEffect(() => {
    if (!isRoleLoaded || !loggedInUserRole) return;

    if (loggedInUserRole === "principal") {
      setActiveTab("assigned"); // Principal sees Assigned tab by default
    } else {
      setActiveTab("received"); // Teachers/Vice-Principals/Headmistress see Received tab by default
    }
  }, [loggedInUserRole, isRoleLoaded]);

  // --- Determine visible tabs based on role ---
  const getVisibleTabs = (role) => {
    if (role === "principal") return ["assigned"];
    if (role === "teacher") return ["received"];
    return ["received", "assigned"]; // Vice-principal, Headmistress, etc.
  };

  const visibleTabs = getVisibleTabs(loggedInUserRole);

  // --- Loading state ---
  if (!isRoleLoaded) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Loading tasks...
      </div>
    );
  }

  const tasksToShow = activeTab === "received" ? receivedTasks : assignedTasks;

  return (
    <div className="w-full min-h-screen flex flex-col p-5 !bg-[#f4f6f9] z-10">
      <h2 className="!text-[#222323] text-center font-semibold text-[28px] pt-5 pb-3 mds:text-left">
        Tasks
      </h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-5">
        {visibleTabs.includes("received") && (
          <button
            onClick={() => setActiveTab("received")}
            className={`px-4 py-2 rounded-full border ${
              activeTab === "received"
                ? "bg-[#3b99dc] text-white border-[#3b99dc]"
                : "bg-white text-[#3b7070] border-gray-300"
            }`}
          >
            Received Tasks
          </button>
        )}

        {visibleTabs.includes("assigned") && (
          <button
            onClick={() => setActiveTab("assigned")}
            className={`px-4 py-2 rounded-full border ${
              activeTab === "assigned"
                ? "bg-[#3b99dc] text-white border-[#3b99dc]"
                : "bg-white text-[#3b7070] border-gray-300"
            }`}
          >
            Assigned Tasks
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="flex flex-col py-5 gap-2 justify-center items-center mds:items-start mds:grid mds:grid-cols-2 md:grid-cols-1 mdl:grid-cols-2 lgm:grid-cols-3">
        {tasksToShow.length === 0 ? (
          <p>
            {activeTab === "received"
              ? selectedUser && selectedUser.uid !== loggedInUser?.uid
                ? "No tasks assigned to this teacher yet."
                : "No tasks assigned to you yet."
              : selectedUser && selectedUser.uid !== loggedInUser?.uid
              ? "This teacher hasn't assigned any tasks yet."
              : "You haven't assigned any tasks yet."}
          </p>
        ) : (
          tasksToShow.map((task) => (
            <RecieveTaskCard
              key={task.id}
              task={task}
              onClick={() => navigate(`/task/${task.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList;