import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import 
  {  
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    sendEmailVerification,
    onAuthStateChanged
  } 
from "firebase/auth";

function Login() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [waitingVerification, setWaitingVerification] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        navigate("/landing-page");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (waitingVerification && auth.currentUser) {
      interval = setInterval(async () => {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          setMessage({ text: "Email verified! Redirecting...", type: "success" });
          navigate("/landing-page");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [waitingVerification, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);
        console.log("Signup user:", user);

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, 
          firstName: firstName,
          lastName: lastName,
          designation: designation,
          email: user.email,
          createdAt: serverTimestamp(),
        });
        setMessage({ text: "Verification email sent! Please check your inbox.", type: "success" });
        setWaitingVerification(true); 
        return;
      }

      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (!methods || methods.length === 0 && isSignup) {
        setMessage({ text: "New user - please sign up.", type: "error" });
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setMessage({
          text: "Verify your email.",
          type: "error",
        });
        return;
      }

      // Ensure Firestore doc exists for this user
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          firstName: firstName || "",
          lastName: lastName || "",
          designation: designation || "",
          email: user.email,
          createdAt: serverTimestamp(),
        });
      }

      setMessage({ text: "Login successful!", type: "success" });
      navigate("/landing-page");

    } catch (err) {
      console.error("Auth error:", err.code, err.message);

      if (err.code === "auth/invalid-credential") {
        setMessage({
          text: "New user - please sign up.",
          type: "error",
        });
      } else if (err.code === "auth/too-many-requests") {
        setMessage({
          text: "Too many attempts. Try again later.",
          type: "error",
        });
      } else if (err.code === "auth/invalid-email") {
        setMessage({ 
          text: "Invalid email.", 
          type: "error" 
        });
      } else if (err.code === "auth/email-already-in-use" && isSignup) {
        setMessage({
          text: "User exists. Please Login.",
          type: "error",
        });
        setIsSignup(false);
      } else {
        setMessage({
          text: "Something went wrong. Please try again.",
          type: "error",
        });
      }
    }
  };

  const handleToggleMode = async () => {
    setIsSignup(!isSignup);
    setMessage({ text: "", type: "" });
  }

  return (
    <div class="w-full min-h-screen flex items-center justify-center bg-[#C7CFE2]">
      <form 
        onSubmit={handleSubmit}
        class="w-full h-screen bg-[linear-gradient(135deg,_#C7CFE2,_#DDE1EE,_#E6EBF5)] flex 
          flex-col items-center justify-center gap-3 p-6 xs:w-[320px] xs:!h-[550px] xs:rounded-2xl xs:shadow-[0_5px_15px_rgba(0,0,0,0.35)]">
        <h2 class="text-2xl font-bold mb-2">{isSignup ? "Sign Up" : "Login"}</h2>
        {
          isSignup && (
          <div class="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl border-[#7b7b7e] px-3.5 py-2.5">
            <img src="/public/Assets/Icons/name.png" alt="" class=""/>
            <input 
              type="text" 
              placeholder='First Name' 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              class="w-full focus:outline-none bg-transparent"/>
          </div>)
        }
        {
          isSignup && (
          <div class="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl border-[#7b7b7e] px-3.5 py-2.5">
            <img src="/public/Assets/Icons/name.png" alt="" class=""/>
            <input 
              type="text" 
              placeholder='Last Name' 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              class="w-full focus:outline-none bg-transparent"/>
          </div>)
        }
        {
          isSignup && (
          <div class="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl border-[#7b7b7e] px-3.5 py-2.5">
            <img src="/public/Assets/Icons/Designation.png" alt="" class=""/>
            <input 
              type="text" 
              placeholder='Designation' 
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
              class="w-full focus:outline-none bg-transparent"/>
          </div>)
        }
        <div class="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl border-[#7b7b7e] px-3.5 py-2.5">
          <img src="/public/Assets/Icons/mail.png" alt="" class=""/>
          <input 
            type="email" 
            placeholder='Email' 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            class="w-full focus:outline-none bg-transparent"
          />
        </div>
        <div class="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl border-[#7b7b7e] p-2.5">
          <img src="/public/Assets/Icons/password.png" alt="" class=""/>
          <input 
            type="password" 
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            class="w-full focus:outline-none bg-transparent"/>
        </div>
        {message && <p class={`${message.type === "error" ? "text-red-600" : "text-green-600"} text-xs`}>
          {message.text}
        </p>}
        <button 
          type='submit'
          class="w-[270px] rounded-3xl bg-[#444665] text-[#efefef] hover:bg-[#171a3d] text-base font-medium px-5 py-2.5">
            {isSignup ? "Sign Up" : "Login"}
        </button>
        <button
          type="button"
          class="focus:outline-none text-sm hover:text-gray-600"
        >
          <Link to="/forgot-password">Forgot Password?</Link>
        </button>
        <div class="flex flex-row items-center justify-between gap-3.5">
          <p
            class="text-sm text-blue-600"
            onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button
            type="button"
            onClick={handleToggleMode}
            class="focus:outline-none text-sm cursor-pointer text-blue-600 hover:text-gray-600">
            {isSignup ? "Login":"Sign Up"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login;