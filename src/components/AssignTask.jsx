import React,{ useState } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import AssignTo from './AssignTo';
import AddAttachment from './AddAttachment';
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";

function AssignTask() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignDate, setAssignDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");


  const priorityLevels = ["High", "Medium", "Low"];
  const today = new Date();

  const formatDate = (date) => {
    if (!date) return "Select Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const assignTasktoUser = async () => { 
    if (!title || !description || !assignDate || !dueDate || !selectedPriority) {
      alert("Please fill in all fields before assigning.");
      return;
    }

    setLoading(true);
    try {
      // fetch current user's Firestore profile
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      let createdByName = "Unknown";
      let createdByDesignation = "Unknown";
      if (userDoc.exists()) {
        const data = userDoc.data();
        createdByName = `${data.firstName} ${data.lastName}`;
        createdByDesignation = data.designation || "Unknown";
      }
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        assignDate: assignDate.toLocaleDateString("en-GB"),
        dueDate: dueDate.toLocaleDateString("en-GB"),
        priority: selectedPriority,
        createdBy: auth.currentUser.uid,         
        createdByName,                           
        createdByDesignation,                  
        assignedToObjects: assignedUsers.map(user => ({
          uid: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          designation: user.designation
        })),                                  
        assignedToUids: assignedUsers.map(user => user.uid),
        attachments,
        createdAt: serverTimestamp(),
      });

      // RESET fields after submit
      setTitle("");
      setDescription("");
      setAssignDate("");
      setDueDate("");
      setSelectedPriority("");
      setAssignedUsers([]);
      setAttachments([]);
      setResetCounter(prev => prev + 1);
      setSuccessMessage("Task assigned successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (error) {
      console.error("Error assigning task:", error);
      alert("Failed to assign task.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full flex flex-col p-5 bg-[#f4f6f9] z-10 mdl:items-center mdl:justify-center">
      <h2 className='!text-[#222323] font-semibold text-[28px] pt-5 pb-1 '>Assign a Task</h2>
      <div className="flex flex-col py-5 gap-2 mdl:w-[500px]">
        <div className="flex flex-col gap-3 bg-white py-3 px-2.5 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)]
        xsm:py-5 xsm:px-7">
          {/* title */}
          <div className="flex flex-col gap-2">
            <p className="!text-[#6b7070]">Task Name</p>
            <input 
              type="text" 
              placeholder='Enter the title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-[#9fa5a5] rounded-3xl px-4 py-1.5 focus:outline-none"/>
          </div>
          {/* description */}
          <div className="flex flex-col gap-2">
            <p className="!text-[#6b7070]">Description</p>
            <textarea 
              type="text" 
              placeholder='Enter task description...'
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border !border-[#9fa5a5] rounded-xl px-4 py-1.5 focus:outline-none"/>
          </div>
          {/* dates */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-center gap-2">
              <p className="!text-[#6b7070]">Assign Date</p>
              <div className="custom-datepicker">
                <DatePicker
                  selected={assignDate}
                  onChange={(date) => setAssignDate(date)}
                  dateFormat="dd MMMM, yyyy"
                  popperPlacement="bottom-center"
                  minDate={today}
                  customInput={
                    <button
                      type="button"
                      style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                    }}>
                      <img
                        src={`/Images/Date-picker.png`}
                        alt="Calendar"
                        className="w-5 h-5"
                      />
                      <p className="w-full !text-[#6b7070] text-left">{formatDate(assignDate)}</p>
                    </button>
                  }
                />
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <p className="!text-[#6b7070]">Due Date</p>
              <div className="custom-datepicker">
                <DatePicker
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  dateFormat="dd MMMM, yyyy"
                  popperPlacement="bottom-center"
                  minDate={today}
                  customInput={
                    <button
                      type="button"
                      style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                    }}>
                      <img
                        src={`/Images/Date-picker.png`}
                        alt="Calendar"
                        className="w-5 h-5"
                      />
                      <p className="w-full !text-[#6b7070] text-left">{formatDate(dueDate)}</p>
                    </button>
                  }
                />
              </div>
            </div>
          </div>
          {/* priority */}
          <div className="flex flex-col gap-2">
            <p className="!text-[#6b7070]">Priority</p>
            <ul className="flex flex-row justify-between items-center">
              {
                priorityLevels.map((priority) => (
                  <li 
                    key={priority}
                    onClick={()=> setSelectedPriority(priority)}
                    className={`w-[85px] text-center rounded-3xl px-3 py-1.5 focus:outline-none border 
                    ${selectedPriority === priority ? '!border-[#3bdcdc] !text-[#3b99dc] !bg-[#d1e4f1]': '!border-[#9fa5a5] !text-[#6b7070]'} cursor-pointer`}>
                    {priority}
                </li>
                ))
              }
            </ul>
          </div>
        </div>
        {/* Assign To */}
        <AssignTo onUsersChange={setAssignedUsers} reset={resetCounter}/>
        <AddAttachment onAttachmentsChange={setAttachments} reset={resetCounter}/>
        <button
          onClick={assignTasktoUser}
          type="button"
          className="bg-[linear-gradient(135deg,_#282b36,_#4c4566)] !text-[#efefef] py-2 px-3 rounded mt-5">
            {loading ? "Assigning..." : "Assign Task"}
        </button>
        {successMessage && (
          <p className="!text-green-600 font-semibold mt-2">{successMessage}</p>
        )}
      </div>
    </div>
  )
}

export default AssignTask;