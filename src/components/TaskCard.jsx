import React,{useEffect, useState} from 'react'
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function TaskCard() {

  const navigate = useNavigate();
  const { taskId } = useParams();
  const [task, setTask] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const docRef = doc(db, "tasks", taskId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const taskData = { id: docSnap.id, ...docSnap.data() };

          setTask(taskData);
        } else {
          console.log("No such task found for ID:", taskId);
        }
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  if (!task) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading task...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 px-5 pt-5 pb-8 bg-[#f4f6f9] z-10 mdl:px-10">
      <div className="flex flex-row w-full justify-start">
        <img onClick={() => navigate("/recieved-task")} className="" src={`/Images/task-back.png`} alt="" />
        <h2 className="w-full font-semibold text-[#2e2f31] text-[18px] text-center">Task</h2>
      </div>
      <div className="w-full flex justify-center items-center">
        <h1 className="w-full !text-[26px] text-left">{task.title}</h1>
      </div>
      <div className="flex flex-col justify-center items-center gap-2 md:w-[500px]">
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/Date-picker.png`} alt="" />
            <p className="text-[#a5a7a9]">Assign Date</p>
          </div>
          <p className="text-[#252626] text-left">{task.assignDate}</p>
        </div>
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/Date-picker.png`} alt="" />
            <p className="text-[#a5a7a9]">Due Date</p>
          </div>
          <p className="text-[#252626] text-left">{task.dueDate}</p>
        </div>
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/priority.png`} alt="" />
            <p className="text-[#a5a7a9]">Priority Level</p>
          </div>
          <p className="text-[#252626] text-left">{task.priority}</p>
        </div>
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/task-status.png`} alt="" />
            <p className="text-[#a5a7a9]">Assign By</p>
          </div>
          <p className="text-[#252626] text-left">{task.createdByName}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 items-start justify-center">
        <h2 className="!text-xl text-left">Description</h2>
        <p className="text-sm">{task.description}</p>
      </div>

      {task.attachments && task.attachments.length > 0 ? (
        <div className="flex flex-col gap-3 bg-white py-3 px-2 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)]">
          <h2 className="!text-xl text-left">Attachments</h2>
            <div className="mt-2 flex flex-col gap-1">
            {task.attachments.map((file, index) => (
                <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#565757]"> 
                {file.name || `Attachment ${index + 1}`}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p>No attachments</p>
      )}
        
      {task.assignedToObjects && task.assignedToObjects.length > 0 ? (
        <div className="flex flex-col gap-3 bg-white py-3 px-2 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)]">
          <h2 className="!text-xl text-left">Assign To</h2>
            <div className="mt-2 flex flex-col gap-1">
            {task.assignedToObjects.map((user, index) => (
              <div key={index}>
                {user.firstName} {user.lastName} 
                <span className="text-sm text-[#565757]"> ({user.designation})</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No users assigned</p>
      )}
    </div>
  )
}

export default TaskCard;