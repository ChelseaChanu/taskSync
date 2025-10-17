import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

function AssignTo({ onUsersChange, reset }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const hierarchy = ["Principal", "Vice-Principal", "Headmistress", "Teacher"];

  // Fetch users below current user's designation
  useEffect(() => {
    const fetchUsers = async () => {
      const currentUserRef = doc(db, "users", auth.currentUser.uid);
      const currentUserSnap = await getDoc(currentUserRef);
      const currentDesignation = currentUserSnap.exists()
        ? currentUserSnap.data().designation
        : "Teacher";

      const currentIndex = hierarchy.indexOf(currentDesignation);

      const usersRef = collection(db, "users");
      const userSnapshot = await getDocs(usersRef);

      const userList = userSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => hierarchy.indexOf(u.designation) > currentIndex); // enforce hierarchy

      setAllUsers(userList);
    };

    fetchUsers();
  }, []);

  // Filter users whenever search term or selectedUsers change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      setIsDropdownOpen(false);
      return;
    }

    const filtered = allUsers
      .filter(u => !selectedUsers.some(su => su.id === u.id)) // exclude already selected
      .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

    setFilteredUsers(filtered);
    setIsDropdownOpen(filtered.length > 0);
  }, [searchTerm, allUsers, selectedUsers]);

  // Reset selected users when parent triggers reset
  useEffect(() => {
    setSelectedUsers([]);
    setSearchTerm("");
    setIsDropdownOpen(false);
    setSelectAll(false);
    onUsersChange([]);
  }, [reset, onUsersChange]);

  // Toggle individual user selection
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
    setSelectAll(updatedUsers.filter(u => u.designation === "Teacher").length === allUsers.filter(u => u.designation === "Teacher").length);
  };

  // Select or deselect all teachers only
  const handleSelectAll = () => {
    const teachers = allUsers.filter(u => u.designation === "Teacher");
    if (!selectAll) {
      setSelectedUsers(teachers);
      onUsersChange(teachers);
      setSelectAll(true);
    } else {
      setSelectedUsers([]);
      onUsersChange([]);
      setSelectAll(false);
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-3 bg-white py-3 px-2.5 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)] xsm:py-5 xsm:px-7">
      <p className="!text-[#6b7070]">Assign To</p>

      {/* Select All Checkbox */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
        />
        <label className="!text-[#6b7070]">Select All Teachers</label>
      </div>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search..."
        className="w-full py-2 px-2.5 border border-[#9fa5a5] rounded-xl focus:outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-10 w-full border !border-gray-300 rounded mt-1 !bg-white max-h-40 overflow-y-auto shadow-lg">
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
            <button onClick={() => toggleSelect(user)} className="ml-1 font-bold">
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default AssignTo;