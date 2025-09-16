import React, { useState } from 'react';
import {sendPasswordResetEmail} from "firebase/auth";
import { auth } from '../firebase';
import { Link } from 'react-router-dom';

function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const handleForgotPassword = async (e) =>{
    e.preventDefault();
    setMessage({ text: "", type: "" });

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        text: "Password reset email sent! Check your inbox.",
        type: "success"
      });
    } catch (err) {
      console.error("Password reset error:", err.code, err.message);
      if (err.code === "auth/invalid-credential") {
        setMessage({text: "No account found with this email.", type: "error"});
      } else if (err.code === "auth/invalid-email") {
        setMessage({text: "Invalid email address.", type: "error"});
      } else {
        setMessage({text: "Something went wrong. Please try again.", type: "error"});
      }
    }
  }

  return (
    <div class="w-full min-h-screen flex items-center justify-center bg-[#C7CFE2]">
      <form onSubmit={handleForgotPassword}
        class="w-full h-screen bg-[linear-gradient(135deg,_#C7CFE2,_#DDE1EE,_#E6EBF5)] flex 
          flex-col items-center justify-center gap-5 p-6 xs:w-[320px] xs:h-4/5 xs:rounded-2xl xs:shadow-[0_5px_15px_rgba(0,0,0,0.35)]">
        <div class="w-full">
          <button type='button' class="p-0">
            <Link to="/">
              <img src="/public/Assets/Icons/back-icon.png" alt="" class="w-9"/>
            </Link>
          </button>
        </div>
        <div class="w-40">
          <img src='/public/Assets/Icons/email-icon.png' alt='email-icon' class="" />
        </div>
        <h2 class="text-2xl font-bold">Forgot Password ?</h2>
        <p class="text-xs text-[#2385c6]">Enter your email to reset the password</p>
        <div class="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl border-[#7b7b7e] px-3.5 py-2.5">
          <img src="/public/Assets/Icons/mail.png" alt="" class="w-5"/>
          <input 
            type="email" 
            placeholder='Enter your email' 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            class="focus:outline-none bg-transparent"/>
          </div>
          {message && <p class={`${message.type === "error" ? "text-red-600" : "text-green-600"} text-xs`}>
            {message.text}
          </p>}
          <button 
            type='submit'
            class="w-[270px] rounded-3xl bg-[#444665] text-[#efefef] hover:bg-[#171a3d] text-base font-medium px-5 py-2.5">
              Send Email
          </button>
      </form>
    </div>
  )
}

export default ForgotPassword;