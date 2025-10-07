import React,{useState, useEffect} from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import DashboardCard from './DashboardCard';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { auth, db } from "../firebase";
import { useSelectedUser } from "./SelectedUserContext";

function Dashboard() {

  const [userName, setUserName] = useState({ firstName: "", lastName: "" });
  const location = useLocation(); 
  const selectedDesignation = location.state?.selectedDesignation || ""; 
  const [loggedInUserRole, setLoggedInUserRole] = useState("");
  const [counts, setCounts] = useState({
    assignedByMe: 0,
    received: 0,
    completed: 0,
    overdue: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const [displayUser, setDisplayUser] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  async function getUserData(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log("Fetched Firestore data:", data);
        return { 
          uid: user.uid,
          firstName: data.firstName, 
          lastName: data.lastName,
          role: data.role || data.designation || ""
        };
      } else {
        console.log("No such user document!");
        return { firstName: "", lastName: "", role: "" };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { firstName: "", lastName: "", role: "" };
    }
  }

  async function fetchDashboardCounts(userId) {
    const tasksRef = collection(db, "tasks");

    // Assigned by Me
    const assignedByMeQuery = query(tasksRef, where("createdBy", "==", userId));
    const assignedByMeSnap = await getDocs(assignedByMeQuery);
    const assignedByMeCount = assignedByMeSnap.size;

    // Received Tasks
    const receivedQuery = query(tasksRef, where("assignedToUids", "array-contains", userId));
    const receivedSnap = await getDocs(receivedQuery);
    const receivedTasks = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const receivedCount = receivedTasks.length;

    // Completed Tasks
    const completedCount = receivedTasks.filter(t => t.status === "completed").length;

    // Overdue Tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = receivedTasks.filter(t => {
      if (!t.dueDate) return false;
      const [day, month, year] = t.dueDate.split("/");
      const due = new Date(`${year}-${month}-${day}`);
      return due < today && t.status !== "completed";
    }).length;

    setCounts({
      assignedByMe: assignedByMeCount,
      received: receivedCount,
      completed: completedCount,
      overdue: overdueCount
    });

    // Upcoming tasks 2-3 days
    const upcoming = receivedTasks.filter(t => {
      if (!t.dueDate || t.status === "completed") return false;
      const [day, month, year] = t.dueDate.split("/").map(Number);
      const due = new Date(year, month - 1, day);
      due.setHours(0, 0, 0, 0);

      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    upcoming.sort((a,b) => {
      const [dA, mA, yA] = a.dueDate.split("/").map(Number);
      const [dB, mB, yB] = b.dueDate.split("/").map(Number);
      return new Date(yA, mA -1, dA) - new Date(yB, mB -1, dB);
    });

    const formattedTasks = upcoming.map(t => {
      const [day, month, year] = t.dueDate.split("/").map(Number);
      const due = new Date(year, month -1, day);
      return `${format(due, "MMM d")} → ${t.title}`;
    });

    setUpcomingTasks(formattedTasks);
  }

  const handleSearch = async () => {
    setHasSearched(true); 
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("designation", "in", ["Teacher","Admin"]));
    const snapshot = await getDocs(q);
    const matches = snapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));

    setSearchResults(matches);
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let user = auth.currentUser;
        if (!user) {
          user = await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((u) => {
              unsubscribe();
              resolve(u);
            });
          });
        }
        if (!user) return;

        const data = await getUserData(user);
        setUserName({ firstName: data.firstName, lastName: data.lastName });
        setLoggedInUserRole(data.role || data.designation || "");

        let dashboardUser = selectedUser;

        if (!dashboardUser) {
          // personal dashboard
          if ((selectedDesignation || data.role || data.designation).toLowerCase() === (data.role || data.designation).toLowerCase()) {
            dashboardUser = data;
          } else if ((loggedInUserRole === "Principal" || loggedInUserRole === "Admin") && selectedDesignation.toLowerCase() === "teacher") {
            // principal/admin viewing teacher: do not auto-pick any teacher
            dashboardUser = null;
          } else {
            // fetch first user of other roles
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("designation", "==", selectedDesignation));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const firstDoc = snapshot.docs[0];
              const firstUser = firstDoc.data();
              dashboardUser = {
                id: firstDoc.id,
                firstName: firstUser.firstName,
                lastName: firstUser.lastName,
                role: firstUser.role || firstUser.designation || "",
                uid: firstUser.uid || firstDoc.id
              };
            } else {
              dashboardUser = null;
            }
          }
        }

        setDisplayUser(dashboardUser);
        setSelectedUser(dashboardUser);

        if (dashboardUser) fetchDashboardCounts(dashboardUser.uid || dashboardUser.id);
      } catch (error) {
        console.error("Error in dashboard fetch:", error);
      }
    };

    fetchDashboard();
  }, [selectedUser, selectedDesignation]);


  const showSearchBar = 
    (loggedInUserRole === "Principal" || loggedInUserRole === "Admin") &&
    selectedDesignation.toLowerCase() === "teacher";

  const isPersonalDashboard = displayUser?.uid === auth.currentUser?.uid;

  const isViewingOtherTeacher = 
    (loggedInUserRole === "Principal" || loggedInUserRole === "Admin") &&
    selectedDesignation.toLowerCase() === "teacher" &&
    !selectedUser;

  return (
    <div className="w-full min-h-screen">
      <div className="!bg-[#f4f6f9] w-full p-5 xs:px-10 xs:py-8">
        <div className="mb-4">
          <button type='button' className="p-0" onClick={() => navigate("/landing-page")}>
            <img src={`/Images/back-icon.png`} alt="" className="w-9"/>
          </button>
        </div>

        {showSearchBar && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Search {selectedDesignation} Dashboard</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Enter ${selectedDesignation} name...`}
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <button onClick={handleSearch} className="!bg-blue-500 !text-white px-4 py-2 rounded">
                Search
              </button>
            </div>
            {searchResults.length > 0 ? (
              searchResults.map(u => (
                <div
                  key={u.uid}
                  className="cursor-pointer !text-[#10455f] font-medium"
                  onClick={() => {
                    setSelectedUser(u);
                    setDisplayUser(u);
                    fetchDashboardCounts(u.uid);
                    setHasSearched(false);
                  }}
                >
                  {u.firstName} {u.lastName}
                </div>
              ))
            ) : hasSearched ? (
              <div className="!text-red-600 mt-2">User not found</div>
            ) : null}
          </div>
        )}

        {displayUser && (
          <>
            <h2 className="!text-[#222323] font-semibold text-[28px] pt-4 pb-1">
              {isPersonalDashboard
                ? `Welcome ${displayUser.firstName} ${displayUser.lastName}`
                : `Viewing ${displayUser.firstName} ${displayUser.lastName}'s Dashboard`}
            </h2>
            <p className="!text-[#303232] text-xl">This is your task dashboard</p>
          </>
        )}

        {/* Dashboard Cards */}
        <div className="flex flex-col gap-4 pt-5">
          <h3 className="text-2xl font-semibold">Updates</h3>
          <div className="w-full flex flex-row overflow-x-auto hide-scrollbar pb-10 gap-5
            md:grid md:grid-cols-2 md:gap-x-5 md:w-[490px] lg:grid-cols-3 lg:w-[745px] xl:grid-cols-4 xl:w-full xl:grid-x-3">
            
            {displayUser && (
              <>
                <DashboardCard 
                  title="Assigned by Me"
                  description={counts.assignedByMe > 0 ? `${counts.assignedByMe} task${counts.assignedByMe > 1 ? 's' : ''}` : "No task yet. Start by assigning one!"}
                  icon="Assign-task-icon.png"
                  width="w-[2.3rem]"
                />
                <DashboardCard 
                  title="Recieved Tasks"
                  description={counts.received > 0 ? `${counts.received} task${counts.received > 1 ? 's' : ''}` : "No task assigned. Come back later!"}
                  icon="Recieve.png"
                  width="w-[2.3rem]"
                />
                <DashboardCard 
                  title="Completed"
                  description={counts.completed > 0 ? `${counts.completed} task${counts.completed > 1 ? 's' : ''}` : "Will appear once you complete a task!"}
                  icon="complete-icon.png"
                  width="w-[2.3rem]"
                />
                <DashboardCard 
                  title="Overdue"
                  description={counts.overdue > 0 ? `${counts.overdue} task${counts.overdue > 1 ? 's' : ''}` : "No overdue tasks!"}
                  icon="overdue-icon.png"
                  width="w-[2.3rem]"
                />
              </>
            )}

            {!displayUser && isViewingOtherTeacher && (
              <div className="!text-gray-500">No data available. Search for a teacher above.</div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex flex-col gap-4 pt-5 border-t !border-[#303232]">
          <div className="flex flex-row items-center gap-3">
            <img src={`/Images/notification.png`} alt="" />
            <h3 className="text-2xl font-semibold">Notifications</h3>
          </div>
          <ul className="flex flex-col justify-center gap-2.5 p-4">
            <li>Student A submitted HW</li>
            <li>Extension request: Task X</li>
            <li>Deadline missed: Report</li>
          </ul>
        </div>

        {/* Upcoming Deadlines */}
        <div className="flex flex-col gap-4 pt-5 border-t !border-[#303232]">
          <div className="flex flex-row items-center gap-3">
            <img src={`/Images/calendar.png`} alt="" />
            <h3 className="text-2xl font-semibold">Upcoming Deadlines</h3>
          </div>
          <div className="max-h-[8.3rem] overflow-y-auto">
            <ul className="flex flex-col justify-center gap-2.5 p-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task, index) => <li key={index}>{task}</li>)
              ) : (
                <li>No tasks nearing deadline</li>
              )}
            </ul>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="flex flex-col gap-4 pt-5 border-t !border-[#303232]">
          <div className="flex flex-row items-center gap-3">
            <img src={`/Images/recent-activities.png`}alt="" />
            <h3 className="text-2xl font-semibold">Recent Activities</h3>
          </div>
          <ul className="flex flex-col justify-center gap-2.5 p-4">
            <li>You assigned Essay (Sep 10)</li>
            <li>Extension approved (Task X)</li>
            <li>Principal verified Report</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard;