import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import {  
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged
} from "firebase/auth";

function AuthPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [waitingVerification, setWaitingVerification] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [seePassword, setSeePassword] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);

  // Polling for email verification
  useEffect(() => {
    let interval;
    if (waitingVerification && auth.currentUser) {
      interval = setInterval(async () => {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          setMessage({ text: "Email verified! Redirecting...", type: "success" });
          navigate("/dashboard");
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
        // SIGNUP
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await sendEmailVerification(user);

        // FIRESTORE DOC
        const userRef = doc(db, "users", user.uid);
        let initialData = {
          uid: user.uid,
          firstName,
          lastName,
          designation,
          email: user.email,
          createdAt: serverTimestamp(),
        };

        if (designation === "Teacher") {
          initialData.tasks = [];
          initialData.receivedTasks = [];
        }

        await setDoc(userRef, initialData);

        // Update designationIndex for fast search
        const designationRef = doc(db, "designationIndex", designation);
        await updateDoc(designationRef, {
          users: arrayUnion(user.uid)
        }).catch(async (err) => {
          if (err.code === "not-found") {
            await setDoc(designationRef, { users: [user.uid] });
          }
        });

        localStorage.setItem("userUID", user.uid);
        localStorage.setItem("userRole", designation);
        localStorage.setItem("userName", `${firstName} ${lastName}`);

        setMessage({ text: "Verification email sent! Please check your inbox.", type: "success" });
        setWaitingVerification(true); 
        return;
      }

      // LOGIN
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setMessage({ text: "Please verify your email.", type: "error" });
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let userData;
      if (!userSnap.exists()) {
        userData = {
          uid: user.uid,
          firstName,
          lastName,
          designation,
          email,
          tasks: designation === "Teacher" ? [] : undefined,
          receivedTasks: designation === "Teacher" ? [] : undefined,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
      } else {
        userData = userSnap.data();
        if (designation === "Teacher") {
          if (!userData.tasks) userData.tasks = [];
          if (!userData.receivedTasks) userData.receivedTasks = [];
        }
      }

      const role = userData.designation || designation;
      const name = `${userData.firstName || firstName} ${userData.lastName || lastName}`;
      localStorage.setItem("userUID", user.uid);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", name);

      setMessage({ text: "Login successful!", type: "success" });
      navigate("/dashboard"); 

    } catch (err) {
      console.error("Auth error:", err.code, err.message);
      if (err.code === "auth/invalid-credentials") setMessage({ text: "Wrong password or email. If new user please sign-up.", type: "error" });
      else if (err.code === "auth/email-already-in-use") {
        setMessage({ text: "User exists. Please login.", type: "error" });
        setIsSignup(false);
      } else if (err.code === "auth/wrong-password") setMessage({ text: "Incorrect password.", type: "error" });
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#C7CFE2]">
      <form 
        onSubmit={handleSubmit}
        className="w-full h-screen bg-[linear-gradient(135deg,_#C7CFE2,_#DDE1EE,_#E6EBF5)] flex flex-col items-center justify-center gap-3 p-6 xs:w-[320px] xs:!h-[550px] xs:rounded-2xl xs:shadow-[0_5px_15px_rgba(0,0,0,0.35)]"
      >
        <h2 className="text-2xl font-bold mb-2">{isSignup ? "Sign Up" : "Login"}</h2>

        {isSignup && (
          <>
            <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl px-3.5 py-2.5">
              <img src={`/Images/name.png`} alt="" />
              <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full focus:outline-none bg-transparent"/>
            </div>
            <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl px-3.5 py-2.5">
              <img src={`/Images/name.png`} alt="" />
              <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full focus:outline-none bg-transparent"/>
            </div>
          </>
        )}

        <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl px-3.5 py-2.5">
          <img src={`/Images/Designation.png`} alt="" />
          <select value={designation} onChange={e => setDesignation(e.target.value)} required className="w-full focus:outline-none bg-transparent">
            <option value="" disabled>Select Designation</option>
            <option value="Principal">Principal</option>
            <option value="Vice-Principal">Vice-Principal</option>
            <option value="Headmistress">Headmistress</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>

        <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl px-3.5 py-2.5">
          <img src={`/Images/mail.png`} alt="" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full focus:outline-none bg-transparent"/>
        </div>

        <div className="w-[270px] flex flex-row gap-3 border-[2px] rounded-3xl p-2.5">
          <img src="/Images/password.png" alt="" />
          <input type={seePassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full focus:outline-none bg-transparent"/>
          <img src={seePassword ? "/Images/password-close.png" : "/Images/password-open.png"} onClick={() => setSeePassword(!seePassword)} alt="Toggle Password" className="w-[20px] h-[20px] cursor-pointer"/>
        </div>

        {message && <p className={`${message.type === "error" ? "!text-red-600" : "!text-green-600"} text-xs`}>{message.text}</p>}

        <button type='submit' className="w-[270px] rounded-3xl bg-[#444665] text-[#efefef] hover:bg-[#171a3d] text-base font-medium px-5 py-2.5">{isSignup ? "Sign Up" : "Login"}</button>

        <button type="button" className="focus:outline-none text-sm !hover:text-gray-600">
          <Link to="/forgot-password">Forgot Password?</Link>
        </button>

        <div className="flex flex-row items-center justify-between gap-3.5">
          <p className="text-sm !text-blue-600 cursor-pointer" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button type="button" onClick={() => setIsSignup(!isSignup)} className="focus:outline-none text-sm cursor-pointer !text-blue-600 !hover:text-gray-600">
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AuthPage;