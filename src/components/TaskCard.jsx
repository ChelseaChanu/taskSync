import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import AddAttachment from "./AddAttachment";

function TaskCard() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const location = useLocation();

  const [task, setTask] = useState(null);
  const [taskOwner, setTaskOwner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [resetAttachments, setResetAttachments] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [buttonType, setButtonType] = useState(null); // 'submit' | 'view' | null

  const currentUserId = auth.currentUser?.uid;

  // Define hierarchy from lowest to highest
  const hierarchy = ["teacher", "headmistress", "vice-principal", "principal"];

  const isLowerOrSameHierarchy = (viewerRole, viewedRole) => {
    return hierarchy.indexOf(viewerRole) >= hierarchy.indexOf(viewedRole);
  };

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

          // Fetch task owner info
          if (taskData.createdBy) {
            const ownerSnap = await getDoc(doc(db, "users", taskData.createdBy));
            if (ownerSnap.exists()) setTaskOwner(ownerSnap.data());
          }
        } else {
          console.log("No such task found for ID:", taskId);
        }
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    if (taskId) fetchTask();
  }, [taskId]);

  // Determine which button to show
  useEffect(() => {
    if (!task || !taskOwner) return;

    const viewerId = currentUserId;
    const viewerRole = auth.currentUser?.role || "teacher";
    const ownerRole = taskOwner.role || "teacher";

    const isViewingOwnData = task.assignedToObjects?.some(u => u.uid === viewerId);

    // Viewing own tasks
    if (isViewingOwnData) {
      setButtonType("submit");
    } 
    // Viewer is lower or same hierarchy
    else if (isLowerOrSameHierarchy(viewerRole, ownerRole)) {
      // Task assigned by the viewed user
      if (task.createdBy === taskOwner.uid) {
        setButtonType("view");
      } 
      // Task assigned to the viewed user
      else if (task.assignedToObjects?.some(u => u.uid === taskOwner.uid)) {
        setButtonType("view");
      } 
      else {
        setButtonType(null);
      }
    } 
    // Viewer is lower than task owner
    else {
      setButtonType(null);
    }
  }, [task, taskOwner, currentUserId]);

  const handleSubmit = async () => {
    try {
      if (!auth.currentUser) {
        alert("Please login first");
        return;
      }

      const submissionRef = doc(collection(db, "taskSubmissions"));
      await setDoc(submissionRef, {
        taskId,
        submittedBy: currentUserId,
        submittedAt: serverTimestamp(),
        description: submissionDescription,
        attachments,
        assignBy: task.createdByName || "",
      });

      setShowModal(false);
      setSubmissionDescription("");
      setAttachments([]);
      setResetAttachments(prev => !prev);
      alert("Task submitted successfully!");
    } catch (error) {
      console.error("Error submitting task:", error);
      alert("Failed to submit task.");
    }
  };

  const fetchSubmissions = async () => {
    const q = query(collection(db, "taskSubmissions"), where("taskId", "==", taskId));
    const querySnapshot = await getDocs(q);
    const subs = [];
    querySnapshot.forEach(doc => subs.push(doc.data()));
    setSubmissions(subs);
  };

  const handleBack = () => {
    if (location.state?.selectedUser) {
      navigate("/view-users", { state: location.state });
    } else {
      navigate(-1);
    }
  };

  if (!task) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading task...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 px-5 pt-5 pb-8 !bg-[#f4f6f9] z-10 mdl:px-10">
      <div className="flex flex-row w-full justify-start">
        <img
          onClick={handleBack}
          className="cursor-pointer"
          src={`/Images/task-back.png`}
          alt="Back"
        />
        <h2 className="w-full font-semibold !text-[#2e2f31] text-[18px] text-center">Task</h2>
      </div>

      <div className="w-full flex justify-center items-center">
        <h1 className="w-full !text-[26px] text-left">{task.title}</h1>
      </div>

      <div className="flex flex-col justify-center items-center gap-2 md:w-[500px]">
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/Date-picker.png`} alt="" />
            <p className="!text-[#a5a7a9]">Assign Date</p>
          </div>
          <p className="!text-[#252626] text-left">{task.assignDate}</p>
        </div>
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/Date-picker.png`} alt="" />
            <p className="!text-[#a5a7a9]">Due Date</p>
          </div>
          <p className="!text-[#252626] text-left">{task.dueDate}</p>
        </div>
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/priority.png`} alt="" />
            <p className="!text-[#a5a7a9]">Priority Level</p>
          </div>
          <p className="!text-[#252626] text-left">{task.priority}</p>
        </div>
        <div className="w-full flex flex-row items-center gap-6">
          <div className="w-[50%] flex flex-row items-center gap-2">
            <img src={`/Images/task-status.png`} alt="" />
            <p className="!text-[#a5a7a9]">Assign By</p>
          </div>
          <p className="!text-[#252626] text-left">{task.createdByName}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 items-start justify-center">
        <h2 className="!text-xl text-left">Description</h2>
        <p className="text-sm">{task.description}</p>
      </div>

      {task.attachments?.length > 0 && (
        <div className="flex flex-col gap-3 !bg-white py-3 px-2 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)]">
          <h2 className="!text-xl text-left">Attachments</h2>
          <div className="mt-2 flex flex-col gap-1">
            {task.attachments.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm !text-[#565757]"
              >
                {file.name || `Attachment ${index + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      {task.assignedToObjects?.length > 0 && (
        <div className="flex flex-col gap-3 !bg-white py-3 px-2 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)]">
          <h2 className="!text-xl text-left">Assign To</h2>
          <div className="mt-2 flex flex-col gap-1">
            {task.assignedToObjects.map((user, index) => (
              <div key={index}>
                {user.firstName} {user.lastName}{" "}
                <span className="text-sm !text-[#565757]">({user.designation})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Button Section */}
      <div className="flex justify-center w-full mt-4">
        {buttonType === "submit" && (
          <button
            onClick={() => setShowModal(true)}
            type="button"
            className="w-[280px] bg-[linear-gradient(135deg,_#282b36,_#4c4566)] !text-[#efefef] py-2 px-3 rounded"
          >
            Submit
          </button>
        )}
        {buttonType === "view" && (
          <button
            onClick={() => {
              fetchSubmissions();
              setViewModal(true);
            }}
            type="button"
            className="w-[280px] !bg-green-600 !text-white py-2 px-3 rounded"
          >
            View Submissions
          </button>
        )}
      </div>

      {/* Assignee Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center !bg-gray-800/40 backdrop-blur-md z-50">
          <div className="!bg-white rounded-lg p-6 w-[90%] max-w-md">
            <h3 className="text-xl font-semibold mb-4">Submit Task</h3>
            <label className="block mb-3 !text-[#6b7070]">
              Description:
              <textarea
                rows={5}
                className="mt-1 block w-full border px-2 py-1 rounded focus:outline-none resize-none"
                value={submissionDescription}
                onChange={(e) => setSubmissionDescription(e.target.value)}
                placeholder="Add notes or comments..."
              />
            </label>
            <AddAttachment
              onAttachmentsChange={setAttachments}
              reset={resetAttachments}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 !bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 !bg-blue-600 !text-white rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigner Modal */}
      {viewModal && (
        <div className="fixed inset-0 flex items-center justify-center !bg-gray-800/40 backdrop-blur-md z-50">
          <div className="!bg-gray-100 rounded-lg p-6 w-[90%] max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Submissions</h3>
            {submissions.length === 0 ? (
              <p>No submissions yet.</p>
            ) : (
              submissions.map((sub, idx) => {
                const userObj = task.assignedToObjects.find(u => u.uid === sub.submittedBy);
                const name = userObj ? `${userObj.firstName} ${userObj.lastName}` : sub.submittedBy;
                return (
                  <div key={idx} className="border-b mb-3 pb-2">
                    <p className="font-medium">
                      {name}{" "}
                      <span className="text-xs !text-gray-500">
                        {sub.submittedAt?.seconds
                          ? new Date(sub.submittedAt.seconds * 1000).toLocaleString()
                          : ""}
                      </span>
                    </p>
                    <p className="mt-1 text-sm">{sub.description}</p>
                    {sub.attachments?.length > 0 && (
                      <div className="mt-1 flex flex-col gap-1">
                        {sub.attachments.map((file, i) => (
                          <a
                            key={i}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="!text-blue-600 underline text-sm"
                          >
                            {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <button
              onClick={() => setViewModal(false)}
              className="mt-4 px-4 py-2 !bg-gray-300 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskCard;