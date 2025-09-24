import { createContext, useState, useContext } from "react";

// Context to store selected user (teacher or principal)
const SelectedUserContext = createContext();

export const SelectedUserProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState(null); // UID of selected teacher or principal

  return (
    <SelectedUserContext.Provider value={{ selectedUser, setSelectedUser }}>
      {children} 
    </SelectedUserContext.Provider>
  );
};

// Custom hook to use the context easily
export const useSelectedUser = () => useContext(SelectedUserContext);