import React,{useState, useEffect} from 'react'
import DashboardCard from './DashboardCard';
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
} from "firebase/firestore";
import { auth, db } from "../firebase";

function Dashboard() {

  const [userName, setUserName] = useState({ firstName: "", lastName: "" });
  const [counts, setCounts] = useState({
    assignedByMe: 0,
    received: 0,
    completed: 0,
    overdue: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  async function getUserName(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return { firstName: data.firstName, lastName: data.lastName };
      } else {
        console.log("No such user document!");
        return { firstName: "", lastName: "" };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { firstName: "", lastName: "" };
    }
  }

  async function fetchDashboardCounts(userId) {
    const tasksRef = collection(db, "tasks");

    // 1. Assigned by Me
    const assignedByMeQuery = query(tasksRef, where("createdBy", "==", userId));
    const assignedByMeSnap = await getDocs(assignedByMeQuery);
    const assignedByMeCount = assignedByMeSnap.size;

    // 2. Received Tasks
    const receivedQuery = query(tasksRef, where("assignedToUids", "array-contains", userId));
    const receivedSnap = await getDocs(receivedQuery);
    const receivedTasks = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const receivedCount = receivedTasks.length;

    // 3. Completed Tasks
    const completedCount = receivedTasks.filter(t => t.status === "completed").length;

    // 4. Overdue Tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = receivedTasks.filter(t => {
      if (!t.dueDate) return false;
      // convert "dd/MM/yyyy" → Date
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

    // fetch upcoming deadlines (2-3 days near due date)
    const upcoming = receivedTasks.filter(t => {
      if (!t.dueDate || t.status === "completed") return false;
      const [day, month, year] = t.dueDate.split("/").map(Number);
      const due = new Date(year, month - 1, day);
      due.setHours(0, 0, 0, 0);

      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24)); 
      return diffDays >= 0 && diffDays <= 3;
    });

    // Sort by nearest due date
    upcoming.sort((a, b) => {
      const [dayA, monthA, yearA] = a.dueDate.split("/").map(Number);
      const [dayB, monthB, yearB] = b.dueDate.split("/").map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA - dateB;
    });

    const formattedTasks = upcoming.map(t => {
      const [day, month, year] = t.dueDate.split("/").map(Number);
      const due = new Date(year, month - 1, day); 
      return `${format(due, "MMM d")} → ${t.title}`;
    });

    setUpcomingTasks(formattedTasks);
  }

  // Get logged-in user and fetch data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        getUserName(user).then((data) => setUserName(data));
        fetchDashboardCounts(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full min-h-screen">
      <div className="bg-[#f4f6f9] w-full p-5 xs:px-10 xs:py-8">
        <h2 className="text-[#222323] font-semibold text-[28px] pt-4 pb-1">{`Welcome ${userName.firstName} ${userName.lastName}`}</h2>
        <p className="text-[#303232] text-xl">This is your task dashboard</p>
        <div className="flex flex-col gap-4 pt-5">
          <h3 className="text-2xl font-semibold">Updates</h3>
          <div className="w-full flex flex-row overflow-x-auto hide-scrollbar pb-10 gap-5
            md:grid md:grid-cols-2 md:gap-x-5 md:w-[490px] lg:grid-cols-3 lg:w-[745px] xl:grid-cols-4 xl:w-full xl:grid-x-3">
            <DashboardCard 
              title = "Assigned by Me"
              description = {counts.assignedByMe > 0 
                ? `${counts.assignedByMe} task${counts.assignedByMe > 1 ? 's' : ''}` 
                : "No task yet. Start by assigning one!"}
              icon = "Assign-task-icon.png"
              width = "w-[2.3rem]"
            />
            <DashboardCard 
              title = "Recieved Tasks"
              description = {counts.received > 0 
                ? `${counts.received} task${counts.received > 1 ? 's' : ''}` 
                : "No task assigned. Come back later!"}
              icon = "Recieve.png"
              width = "w-[2.3rem]"
            />
            <DashboardCard 
              title = "Completed"
              description = {counts.completed > 0 
                ? `${counts.completed} task${counts.completed > 1 ? 's' : ''}` 
                : "Will appear once you complete a task!"}
              icon = "complete-icon.png"
              width = "w-[2.3rem]"
            />
            <DashboardCard 
              title = "Overdue"
              description = {counts.overdue > 0 
                ? `${counts.overdue} task${counts.overdue > 1 ? 's' : ''}` 
                : "No overdue tasks!"}
              icon = "overdue-icon.png"
              width = "w-[2.3rem]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-5 border-t border-[#303232]">
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
        <div className="flex flex-col gap-4 pt-5 border-t border-[#303232]">
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
        <div className="flex flex-col gap-4 pt-5 border-t border-[#303232]">
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