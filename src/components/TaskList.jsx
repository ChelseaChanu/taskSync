import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import RecieveTaskCard from './RecieveTaskCard';
import { useNavigate } from "react-router-dom";
import { useSelectedUser } from "./SelectedUserContext";

function TaskList() {
  const navigate = useNavigate();
  const { selectedUser } = useSelectedUser();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [receivedTasks, setReceivedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("received");

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setLoggedInUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!loggedInUser) return;

    const uidToUse = selectedUser?.uid || loggedInUser.uid;

    // Received Tasks
    const receivedQuery = query(
      collection(db, "tasks"),
      where("assignedToUids", "array-contains", uidToUse)
    );

    const unsubscribeReceived = onSnapshot(receivedQuery, snapshot => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
      setReceivedTasks(data);
    });

    // Assigned Tasks
    const assignedQuery = query(
      collection(db, "tasks"),
      where("createdBy", "==", uidToUse)
    );

    const unsubscribeAssigned = onSnapshot(assignedQuery, snapshot => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
      setAssignedTasks(data);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeAssigned();
    };
  }, [loggedInUser, selectedUser]);

  const tasksToShow = activeTab === "received" ? receivedTasks : assignedTasks;

  return (
    <div className="w-full min-h-screen flex flex-col p-5 !bg-[#f4f6f9] z-10">
      <h2 className='!text-[#222323] text-center font-semibold text-[28px] pt-5 pb-3 mds:text-left'>
        Tasks
      </h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-5">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 rounded-full border ${activeTab === "received" ? "bg-[#3b99dc] text-white border-[#3b99dc]" : "bg-white text-[#3b7070] border-gray-300"}`}
        >
          Received Tasks
        </button>
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2 rounded-full border ${activeTab === "assigned" ? "bg-[#3b99dc] text-white border-[#3b99dc]" : "bg-white text-[#3b7070] border-gray-300"}`}
        >
          Assigned Tasks
        </button>
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