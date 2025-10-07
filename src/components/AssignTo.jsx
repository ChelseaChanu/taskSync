import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function AssignTo(props) {
  const { onUsersChange, reset } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all users once on mount
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, "users");
      const userSnapshot = await getDocs(usersRef);
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllUsers(userList);
    };

    fetchUsers();
  }, []);

  // Filter users whenever search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers([]);
      setIsDropdownOpen(false);
      return;
    }

    const filtered = allUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });

    setFilteredUsers(filtered);
    setIsDropdownOpen(filtered.length > 0);
  }, [searchTerm, allUsers]);

  useEffect(() => {
    setSelectedUsers([]);
    setSearchTerm("");
    setIsDropdownOpen(false);
  }, [reset]);

  // Toggle selection
  const toggleSelect = (user) => {
    let updatedUsers;
    if (selectedUsers.find((u) => u.id === user.id)) {
      updatedUsers = selectedUsers.filter((u) => u.id !== user.id);
    } else {
      updatedUsers = [...selectedUsers, user];
    }
    setSelectedUsers(updatedUsers);
    onUsersChange(updatedUsers);
    setSearchTerm("");          
    setIsDropdownOpen(false);   
  };

  return (
    <div class="flex flex-col gap-3 !bg-white py-3 px-2.5 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)]
      xsm:py-5 xsm:px-7">
      <div>
        <p class="!text-[#6b7070]">Assign To</p>
        <div class="flex flex-col justify-center items-center gap-3 pt-3">
          <input
            type="text"
            placeholder="Search..."
            class="w-full py-2 px-2.5 border border-[#9fa5a5] rounded-xl focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* <button class="w-40 bg-[#043d4d] text-[#dce7e7] py-2 px-3 rounded">
            Select
          </button> */}
        </div>
        <div class="">
            {/* Dropdown for matching users */}
            {isDropdownOpen && (
              <div className="absolute  left-[20px] z-10 w-[280px] border !border-gray-300 rounded mt-3 !bg-white max-h-40 overflow-y-auto shadow-lg">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                    onClick={() => toggleSelect(user)}
                  >
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="!text-gray-500 text-sm">{user.designation}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Selected Users */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="!bg-[#2ccdd6] !text-[#373a3a] px-3 py-2 rounded-full text-sm flex items-center gap-1"
                >
                  {user.firstName} {user.lastName}
                  <button
                    onClick={() => toggleSelect(user)}
                    className="ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
        </div>
      </div>
    </div>
  )
}

export default AssignTo;