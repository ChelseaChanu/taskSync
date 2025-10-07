import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import RecieveTaskCard from './RecieveTaskCard';
import { useNavigate } from "react-router-dom";
import { useSelectedUser } from "./SelectedUserContext";

function RecievedTask() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const { selectedUser } = useSelectedUser(); // teacher selected by admin/principal
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    // Get current logged-in user
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setLoggedInUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!loggedInUser) return;

    let uidToFetch;

    // Determine which UID to fetch tasks for
    if (selectedUser && selectedUser.uid !== loggedInUser.uid) {
      // Principal/Admin viewing a selected teacher
      uidToFetch = selectedUser.uid;
    } else {
      // Personal dashboard (teacher or admin/principal)
      uidToFetch = loggedInUser.uid;
    }

    const q = query(
      collection(db, "tasks"),
      where("assignedToUids", "array-contains", uidToFetch)
    );

    const unsubscribeSnapshot = onSnapshot(q, snapshot => {
      const taskData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0; 
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
      setTasks(taskData);
    });

    return () => unsubscribeSnapshot();
  }, [loggedInUser, selectedUser]);

  return (
    <div className="w-full min-h-screen flex flex-col p-5 !bg-[#f4f6f9] z-10">
      <h2 className='!text-[#222323] text-center font-semibold text-[28px] pt-5 pb-1 mds:text-left'>
        List of Recieved Task
      </h2>
      <div className="flex flex-col py-5 gap-2 justify-center items-center mds:items-start mds:grid mds:grid-cols-2 md:grid-cols-1 mdl:grid-cols-2 lgm:grid-cols-3">
        {tasks.length === 0 ? (
          <p>
            {selectedUser && selectedUser.uid !== loggedInUser?.uid
              ? "No tasks assigned to this teacher yet."
              : "No tasks assigned to you yet."}
          </p>
        ) : (
          tasks.map((task) => (
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

export default RecievedTask;