import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import RecieveTaskCard from "../components/RecieveTaskCard";

export default function ViewUsers() {
  const navigate = useNavigate();
  const location = useLocation();

  // Restore state from navigation if available
  const initialState = location.state || {};
  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm || "");
  const [selectedUser, setSelectedUser] = useState(initialState.selectedUser || null);
  const [assignedTasks, setAssignedTasks] = useState(initialState.assignedTasks || []);
  const [receivedTasks, setReceivedTasks] = useState(initialState.receivedTasks || []);

  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggedInDesignation, setLoggedInDesignation] = useState("");

  const hierarchy = ["Principal", "Vice-Principal", "Headmistress", "Teacher"];

  // Fetch logged-in user's designation
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setLoggedInDesignation(userSnap.data().designation);
    };
    fetchCurrentUser();
  }, []);

  // Fetch all users below current user's designation
  useEffect(() => {
    const fetchUsers = async () => {
      if (!loggedInDesignation) return;

      const currentIndex = hierarchy.indexOf(loggedInDesignation);
      const snapshot = await getDocs(collection(db, "users"));
      const users = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => hierarchy.indexOf(u.designation) > currentIndex); // only lower hierarchy
      setAllUsers(users);
    };
    fetchUsers();
  }, [loggedInDesignation]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      return;
    }

    const filtered = allUsers.filter(
      (u) =>
        (!selectedUser || selectedUser.id !== u.id) &&
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [searchTerm, allUsers, selectedUser]);

  // Fetch assigned and received tasks for selected user
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setFilteredUsers([]);
    setSearchTerm(`${user.firstName} ${user.lastName}`);
    setLoading(true);

    try {
      const tasksSnapshot = await getDocs(collection(db, "tasks"));
      const allTasks = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const assigned = allTasks.filter((task) => task.createdBy === user.uid);
      const received = allTasks.filter((task) => task.assignedToUids?.includes(user.uid));

      setAssignedTasks(assigned);
      setReceivedTasks(received);
      console.log("Fetched user data:", { assigned, received });
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to task detail page with current state
  const handleOpenTask = (taskId) => {
    navigate(`/task/${taskId}`, {
      state: {
        selectedUser,
        assignedTasks,
        receivedTasks,
        searchTerm
      }
    });
  };

  // Calculate summary stats
  const calculateSummary = () => {
    const completed = [...assignedTasks, ...receivedTasks].filter(
      (t) => t.status?.toLowerCase() === "completed"
    ).length;

    const overdue = [...assignedTasks, ...receivedTasks].filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate.split("/").reverse().join("-"));
      return due < new Date() && t.status?.toLowerCase() !== "completed";
    }).length;

    return {
      assigned: assignedTasks.length,
      received: receivedTasks.length,
      completed,
      overdue
    };
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center py-10 px-6">
      <h2 className="text-3xl font-semibold text-[#222323] mb-6">
        View Users and Tasks
      </h2>

      {/* Search Input */}
      <div className="relative w-full max-w-md mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search user by name"
          className="w-full py-2 px-3 border border-gray-400 rounded-lg focus:outline-none"
        />
        {filteredUsers.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-md max-h-40 overflow-y-auto shadow z-10">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                onClick={() => handleSelectUser(user)}
              >
                <span>
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-gray-500 text-sm">{user.designation}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="text-gray-500 mb-4">Loading data, please wait...</p>}

      {selectedUser && !loading && (
        <div className="w-full flex flex-col gap-8">
          <h3 className="text-xl font-semibold mb-3">
            {selectedUser.firstName} {selectedUser.lastName} (
            {selectedUser.designation})
          </h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-lg text-center shadow-sm">
              <h4 className="font-bold text-lg">{summary.assigned}</h4>
              <p className="text-sm">Tasks Assigned</p>
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-center shadow-sm">
              <h4 className="font-bold text-lg">{summary.received}</h4>
              <p className="text-sm">Tasks Received</p>
            </div>
            <div className="bg-purple-100 text-purple-800 px-4 py-3 rounded-lg text-center shadow-sm">
              <h4 className="font-bold text-lg">{summary.completed}</h4>
              <p className="text-sm">Completed</p>
            </div>
            <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-center shadow-sm">
              <h4 className="font-bold text-lg">{summary.overdue}</h4>
              <p className="text-sm">Overdue</p>
            </div>
          </div>

          {/* Tasks Assigned */}
          <section>
            <h4 className="text-lg font-semibold text-blue-700 mb-2">
              Tasks Assigned
            </h4>
            {assignedTasks.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {assignedTasks.map((task) => (
                  <div key={task.id} onClick={() => handleOpenTask(task.id)}>
                    <RecieveTaskCard task={task} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tasks assigned by this user.</p>
            )}
          </section>

          {/* Tasks Received */}
          <section>
            <h4 className="text-lg font-semibold text-green-700 mb-2">
              Tasks Received
            </h4>
            {receivedTasks.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {receivedTasks.map((task) => (
                  <div key={task.id} onClick={() => handleOpenTask(task.id)}>
                    <RecieveTaskCard task={task} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tasks received by this user.</p>
            )}
          </section>
        </div>
      )}

      {!selectedUser && !loading && (
        <p className="text-gray-500 italic mt-10">
          Search for a user above to view their assigned and received tasks.
        </p>
      )}
    </div>
  );
}