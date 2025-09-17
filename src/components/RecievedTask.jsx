import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged}from "firebase/auth";
import RecieveTaskCard from './RecieveTaskCard';
import { useNavigate } from "react-router-dom";

function RecievedTask() {

  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
    if (!user) return;

    console.log("Logged-in UID:", user.uid);

    const q = query(
      collection(db, "tasks"),
      where("assignedToUids", "array-contains", user.uid)
    );

    const unsubscribeSnapshot = onSnapshot(q, snapshot => {
      console.log("Snapshot size:", snapshot.size);
      const taskData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0; 
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
        console.log("Tasks received:", taskData);
        setTasks(taskData);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col p-5 bg-[#f4f6f9] z-10">
      <h2 className='text-[#222323] text-center font-semibold text-[28px] pt-5 pb-1 mds:text-left'>List of Recieved Task</h2>
      <div className="flex flex-col py-5 gap-2 justify-center items-center mds:items-start mds:grid mds:grid-cols-2 md:grid-cols-1 mdl:grid-cols-2 lgm:grid-cols-3">
        {tasks.length === 0 ? (
        <p>No tasks assigned to you yet.</p>
      ) : (
        tasks.map((task) => (
          <RecieveTaskCard key={task.id} task={task} onClick={() => navigate(`/task/${task.id}`)}/>
        ))
      )}
      </div>
    </div>
  )
}

export default RecievedTask;