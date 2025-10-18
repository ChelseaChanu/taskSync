import React, { useState, useEffect } from 'react';
import DashboardCard from './DashboardCard';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { auth, db } from "../firebase";
import { useSelectedUser } from "./SelectedUserContext";

function Dashboard() {
  const [userName, setUserName] = useState({ firstName: "", lastName: "" });
  const [counts, setCounts] = useState({ assignedByMe: 0, received: 0, completed: 0, overdue: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const { selectedUser, setSelectedUser } = useSelectedUser();

  async function getUserData(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: user.uid,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || data.designation || ""
        };
      } else return { firstName: "", lastName: "", role: "" };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { firstName: "", lastName: "", role: "" };
    }
  }

  function resetDashboardState() {
    setUserName({ firstName: "", lastName: "" });
    setCounts({ assignedByMe: 0, received: 0, completed: 0, overdue: 0 });
    setUpcomingTasks([]);
    setNotifications([]);
    setRecentActivities([]);
    setLoading(true);
  }

  // ------------------- Fetch Functions (Counts, Notifications, Activities) -------------------
  async function fetchDashboardData(userId) {
    if (!userId) return;

    // Counts
    const tasksRef = collection(db, "tasks");
    const assignedByMeSnap = await getDocs(query(tasksRef, where("createdBy", "==", userId)));
    const receivedSnap = await getDocs(query(tasksRef, where("assignedToUids", "array-contains", userId)));
    const receivedTasks = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const today = new Date();
    today.setHours(0,0,0,0);

    setCounts({
      assignedByMe: assignedByMeSnap.size,
      received: receivedTasks.length,
      completed: receivedTasks.filter(t => t.status === "completed").length,
      overdue: receivedTasks.filter(t => {
        if (!t.dueDate) return false;
        const [day, month, year] = t.dueDate.split("/").map(Number);
        const due = new Date(year, month - 1, day);
        return due < today && t.status !== "completed";
      }).length
    });

    // Upcoming tasks
    const upcoming = receivedTasks.filter(t => {
      if (!t.dueDate || t.status === "completed") return false;
      const [day, month, year] = t.dueDate.split("/").map(Number);
      const due = new Date(year, month - 1, day);
      due.setHours(0,0,0,0);
      const diffDays = Math.round((due - today)/(1000*60*60*24));
      return diffDays >=0 && diffDays <=3;
    });

    upcoming.sort((a,b)=>{
      const [dA,mA,yA]=a.dueDate.split("/").map(Number);
      const [dB,mB,yB]=b.dueDate.split("/").map(Number);
      return new Date(yA,mA-1,dA) - new Date(yB,mB-1,dB);
    });

    setUpcomingTasks(upcoming.map(t=>{
      const [day, month, year] = t.dueDate.split("/").map(Number);
      return `${format(new Date(year, month-1, day), "MMM d")} → ${t.title}`;
    }));

    // Notifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7);

    let recentEvents = [];
    receivedTasks.forEach(t=>{
      if(t.createdAt?.toDate && t.createdAt.toDate() >= sevenDaysAgo){
        recentEvents.push({text:`You received task: ${t.title}`, date: t.createdAt.toDate()});
      }
    });

    const taskIdsCreated = assignedByMeSnap.docs.map(d=>({id:d.id, title:d.data().title}));
    if(taskIdsCreated.length>0){
      const submissionsRef = collection(db,"taskSubmissions");
      const submissionsSnap = await getDocs(query(submissionsRef, where("taskId","in",taskIdsCreated.map(t=>t.id))));
      for(const docSnap of submissionsSnap.docs){
        const data = docSnap.data();
        if(!data.submittedAt?.toDate || data.submittedAt.toDate < sevenDaysAgo) continue;

        const taskObj = taskIdsCreated.find(t=>t.id===data.taskId);
        const taskTitle = taskObj ? taskObj.title : data.taskId;

        const submitterRef = doc(db,"users",data.submittedBy);
        const submitterSnap = await getDoc(submitterRef);
        const submitterName = submitterSnap.exists()
          ? `${submitterSnap.data().firstName} ${submitterSnap.data().lastName}`
          : data.submittedBy;

        recentEvents.push({text:`Task "${taskTitle}" was submitted by ${submitterName}`, date:data.submittedAt.toDate()});
      }
    }

    recentEvents.sort((a,b)=>b.date - a.date);
    setNotifications(recentEvents);

    // Recent Activities
    let activities = [];
    receivedTasks.forEach(t=>{
      if(t.createdAt?.toDate && t.createdAt.toDate>=sevenDaysAgo) activities.push({text:`Created task "${t.title}"`, date:t.createdAt.toDate()});
      if(t.updatedAt?.toDate && t.updatedAt.toDate>=sevenDaysAgo && t.status==="completed") activities.push({text:`Marked "${t.title}" as completed`, date:t.updatedAt.toDate()});
      if(t.extensionRequested && t.updatedAt?.toDate && t.updatedAt.toDate>=sevenDaysAgo) activities.push({text:`Extension requested for "${t.title}"`, date:t.updatedAt.toDate()});
    });

    const subsRef = collection(db,"taskSubmissions");
    const subsSnap = await getDocs(query(subsRef, where("submittedBy","==",userId)));
    for(const docSnap of subsSnap.docs){
      const data = docSnap.data();
      if(data.submittedAt?.toDate && data.submittedAt.toDate >= sevenDaysAgo){
        const taskDoc = await getDoc(doc(db,"tasks",data.taskId));
        const taskTitle = taskDoc.exists() ? taskDoc.data().title : data.taskId;
        activities.push({text:`You submitted task "${taskTitle}"`, date:data.submittedAt.toDate()});
      }
    }

    activities.sort((a,b)=>b.date - a.date);
    setRecentActivities(activities);
  }

  // ------------------- Main Effect -------------------
  useEffect(()=>{
    const unsubscribe = auth.onAuthStateChanged(async(user)=>{
      resetDashboardState();
      if(!user) return;

      const data = await getUserData(user);
      setUserName({firstName:data.firstName,lastName:data.lastName});
      setSelectedUser(data);

      await fetchDashboardData(data.uid);
      setLoading(false);
    });

    return ()=>unsubscribe();
  }, []);

  if(loading) return <div className="p-5 text-lg">Loading dashboard...</div>;

  return (
    <div className="w-full min-h-screen">
      <div className="!bg-[#f4f6f9] w-full p-5 xs:px-10 xs:py-8">
        <div className="mb-4">
          <button type='button' className="p-0">
            <img src={`/Images/back-icon.png`} alt="" className="w-9"/>
          </button>
        </div>

        <h2 className="!text-[#222323] font-semibold text-[28px] pt-4 pb-1">
          Welcome {userName.firstName} {userName.lastName}
        </h2>
        <p className="!text-[#303232] text-xl">This is your task dashboard</p>

        {/* Dashboard cards */}
        <div className="flex flex-col gap-4 pt-5">
          <h3 className="text-2xl font-semibold">Updates</h3>
          <div className="w-full flex flex-row overflow-x-auto hide-scrollbar pb-10 gap-5
            md:grid md:grid-cols-2 md:gap-x-5 md:w-[490px] lg:grid-cols-3 lg:w-[745px] xl:grid-cols-4 xl:w-full xl:grid-x-3">

            {selectedUser?.role !== "Teacher" && 
              <DashboardCard 
              title="Assigned by Me" 
              description={counts.assignedByMe>0?`${counts.assignedByMe} 
              task${counts.assignedByMe>1?'s':''}`:"No task yet. Start by assigning one!"
              } icon="Assign-task-icon.png" width="w-[2.3rem]"/>
              }

            {selectedUser?.role !== "Principal" && 
              <DashboardCard 
              title="Received Tasks" 
              description={counts.received>0?`${counts.received} 
              task${counts.received>1?'s':''}`:"No task assigned. Come back later!"} 
              icon="Recieve.png" width="w-[2.3rem]"/>
              }
            
            {selectedUser?.role !== "Principal" && 
              <DashboardCard 
                title="Completed" 
                description={counts.completed>0?`${counts.completed} 
                task${counts.completed>1?'s':''}`:"Will appear once you complete a task!"} 
                icon="complete-icon.png" width="w-[2.3rem]"
              />}

            {selectedUser?.role !== "Principal" && 
              <DashboardCard 
                title="Overdue" 
                description={counts.overdue>0?`${counts.overdue} 
                task${counts.overdue>1?'s':''}`:"No overdue tasks!"} 
                icon="overdue-icon.png" 
                width="w-[2.3rem]"
              />
            }
          </div>
        </div>

        {/* Notifications */}
        <div className="flex flex-col gap-4 pt-5 border-t !border-[#303232]">
          <div className="flex flex-row items-center gap-3">
            <img src={`/Images/notification.png`} alt="" />
            <h3 className="text-2xl font-semibold">Notifications</h3>
          </div>
          <ul className="flex flex-col justify-center gap-2.5 p-4">
            {notifications.length>0?notifications.map((n,i)=><li key={i}>{n.text}</li>):<li>No new notifications in the past 7 days</li>}
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
              {upcomingTasks.length>0?upcomingTasks.map((task,index)=><li key={index}>{task}</li>):<li>No tasks nearing deadline</li>}
            </ul>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="flex flex-col gap-4 pt-5 border-t !border-[#303232]">
          <div className="flex flex-row items-center gap-3">
            <img src={`/Images/recent-activities.png`} alt="" />
            <h3 className="text-2xl font-semibold">Recent Activities</h3>
          </div>
          <ul className="flex flex-col justify-center gap-2.5 p-4">
            {recentActivities.length>0?recentActivities.map((a,i)=><li key={i}>{a.text}</li>):<li>No recent activities in the past week</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;