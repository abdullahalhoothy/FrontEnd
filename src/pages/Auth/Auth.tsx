import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HttpReq } from "../../services/apiService";
import { useEffect, useState } from "react";
import urls from "../../urls.json";
import { AuthResponse } from "../../types/allTypesAndInterfaces";
import styles from "./Auth.module.css";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import apiRequest from "../../services/apiRequest";

const Auth = () => {
  const nav = useNavigate();
  const { isAuthenticated, setAuthResponse } = useAuth();

  // RENDER STATE
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // INPUT
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setName] = useState("");

  // MESSAGES
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    // await HttpReq(
    //   urls.login,
    //   (data) => {
    //     console.log("Loged In");
    //     if (!("idToken" in (data as any))) {
    //       setError(new Error("Login Error"));
    //       return;
    //     }
    //     setAuthResponse(data as AuthResponse);
    //     setTimeout(() => {
    //       nav("/");
    //     }, 100);
    //   },
    //   () => {},
    //   () => {},
    //   () => {},
    //   (e) => {
    //     setError(e);
    //   },
    //   "post",
    //   { email, password }
    // );
    try {
      const res = await apiRequest({
        url: urls.login,
        method: "post",
        body: { email, password },
      });

      if (!("idToken" in res.data.data)) {
        throw new Error("Login Error");
      }
      setAuthResponse(res.data.data);
      setTimeout(() => {
        nav("/");
      }, 100);
    } catch (error) {
      console.log(error);
      setError({
        name: "Login Error",
        message: error.response.data.detail || "Login Error",
      });
    }
  };

  const handleRegistration = async (
    email: string,
    password: string,
    username: string
  ) => {
    // await HttpReq(
    //   urls.create_user_profile,
    //   (data) => {
    //     if (!("idToken" in (data as any))) {
    //       setError(new Error("Registeration Error"));
    //       return;
    //     }

    //     setAuthResponse(data as AuthResponse);
    //     setIsRegistered(true);
    //     console.log("registered");
    //   },
    //   setAuthMessage,
    //   setRequestId,
    //   setIsLoading,
    //   setError,
    //   "post",
    //   { email, password, username }
    // );
    setIsLoading(true);
    try {
      const res = await apiRequest({
        url: urls.create_user_profile,
        method: "post",
        body: { email, password, username },
      });
      setAuthResponse(res.data.data);
      setIsRegistered(true);
      // setAuthMessage(res.data.message);
      setRequestId(res.data.request_id);
      nav(0);
    } catch (error) {
      setError({
        name: "Registration Error",
        message: error.response.data.detail || "Registration Error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If no error occurred during registration, proceed with login
    console.log(error?.message);
    if (!error && isRegistered) {
      handleLogin(email, password);
    }
  }, [isRegistered]);

  const handlePasswordReset = async (email: string) => {
    // await HttpReq(
    //   urls.reset_password,
    //   setAuthResponse,
    //   setAuthMessage,
    //   setRequestId,
    //   setIsLoading,
    //   setError,
    //   "post",
    //   { email }
    // );
    setIsLoading(true);
    try {
      const res = await apiRequest({
        url: urls.reset_password,
        method: "post",
        body: { email },
      });
      setAuthResponse(res.data.data);
      setAuthMessage(res.data.message);
      setRequestId(res.data.request_id);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
    if (!error) {
      setAuthMessage("Password reset email sent. Please check your inbox.");
      setIsPasswordReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setError(null);

    if (isPasswordReset) {
      await handlePasswordReset(email);
    } else if (isLogin) {
      await handleLogin(email, password);
    } else {
      await handleRegistration(email, password, username);
    }
  };

  useEffect(() => {
    if (isAuthenticated) nav("/");
  }, []);

  const renderForm = () => {
    if (isPasswordReset) {
      return (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center mb-[15px] bg-[#f0f8f0] rounded">
            <FaEnvelope className="text-[#006400] ml-2.5" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 p-2.5 text-base border-none bg-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex-1 p-2.5 text-base border-none bg-transparent outline-none"
            disabled={isLoading}
          >
            Reset Password
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col">
        {!isLogin && (
          <div className="flex items-center mb-[15px] bg-[#f0f8f0] rounded">
            <FaUser className="text-[#006400] ml-2.5" />
            <input
              type="text"
              placeholder="Name"
              value={username}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 p-2.5 text-base border-none bg-transparent outline-none"
            />
          </div>
        )}
        <div className="flex items-center mb-[15px] bg-[#f0f8f0] rounded">
          <FaEnvelope className="text-[#006400] ml-2.5" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 p-2.5 text-base border-none bg-transparent outline-none"
          />
        </div>
        <div className="flex items-center mb-[15px] bg-[#f0f8f0] rounded">
          <FaLock className="text-[#006400] ml-2.5" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex-1 p-2.5 text-base border-none bg-transparent outline-none"
          />
        </div>
        <button
          type="submit"
          className="flex-1 p-2.5 text-base border-none bg-transparent outline-none"
          disabled={isLoading}
        >
          {isLogin ? "Login" : "Register"}
        </button>
      </form>
    );
  };

  return (
    <div className="flex-1 lg:border-l">
      <div className="flex justify-center items-center h-screen bg-[#115740]">
        <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-[400px]">
          <h2 className="text-2xl text-[#006400] mb-5 text-center">
            {isPasswordReset
              ? "Reset Password"
              : isLogin
              ? "Login"
              : "Register"}
          </h2>
          <div className="text-red-500 mb-2">{error?.message}</div>
          {authMessage && (
            <p className="text-[#ff0000] mb-[15px] text-center">
              {authMessage}
            </p>
          )}
          {renderForm()}
          <div className="flex justify-between mt-[15px]">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setIsPasswordReset(false);
              }}
              className="text-[#006400] bg-transparent border-none cursor-pointer text-sm p-[5px]"
            >
              {isLogin ? "Need to register?" : "Already have an account?"}
            </button>
            {isLogin && (
              <button
                onClick={() => setIsPasswordReset(!isPasswordReset)}
                className="text-[#006400] bg-transparent border-none cursor-pointer text-sm p-[5px]"
              >
                {isPasswordReset ? "Back to Login" : "Forgot Password?"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
