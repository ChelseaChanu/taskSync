import React from 'react';
import { useState } from 'react';

function ResetPassword() {

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleResetPassword = async (e) =>{
    e.preventDefault();

    if(newPassword === confirmPassword){
      setMessage({ text: "Password updated successfully!", type: "success" });
    }
    else{
      setMessage({ text: "Passwords do not match.", type: "error" });
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center !bg-[#C7CFE2]">
      <form onSubmit={handleResetPassword()}
        className="w-full min-h-screen bg-[linear-gradient(135deg,_#C7CFE2,_#DDE1EE,_#E6EBF5)] flex 
          flex-col items-center justify-center gap-5 p-6 xs:w-[320px] xs:h-4/5 xs:rounded-2xl xs:shadow-[0_5px_15px_rgba(0,0,0,0.35)]">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <p className="text-xs">Please set your new password</p>
        <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl !border-[#7b7b7e] px-3.5 py-2.5">
          <img src={`/Images/mail.png`} alt="" className="w-5"/>
          <input 
            type="password" 
            placeholder='New Password' 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="focus:outline-none bg-transparent"/>
          </div>
          <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl !border-[#7b7b7e] p-2.5">
            <img src={`/Images/lock.png`} alt="" className="w-5"/>
            <input 
              type="password" 
              placeholder='Confirm Password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              className="focus:outline-none bg-transparent"/>
          </div>
          {message && <p className={`${message.type === "error" ? "!text-red-600" : "!text-green-600"} text-xs`}>
            {message.text}
          </p>}
          <button 
            type='submit'
            className="w-[270px] rounded-3xl !bg-[#444665] !text-[#efefef] !hover:bg-[#171a3d] text-base font-medium">
              Update
          </button>
      </form>
    </div>
  )
}

export default ResetPassword;