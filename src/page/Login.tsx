import React, { useState } from "react";
import '../styles/Login.css';
import { asyncPost } from "../utils/fetch";
import { auth_api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Login: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim()) {
        setError("請輸入帳號");
        return;
      } else if (!password.trim()) {
        setError("請輸入密碼");
        return
      }
      try {
        const response = await asyncPost(auth_api.login, {
            body: {
                email,
                password
            }
        })

        if (response.status === 200 && response.body) {
          localStorage.setItem("token", response.body.token);
          login();
          navigate("/");
        } else {
          setError("帳號密碼錯誤")
        }
      } catch (e) {
        setError("伺服器錯誤");
      }
    }
    return (
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-left"></div>
          <div className="login-right">
            <h1>Hello Garbi</h1>
            <form className="login-form" onSubmit={handleLogin}>
                <label>
                    帳號 / Account
                    <input
                      type="text"
                      name="account"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}  
                    />
                </label>
                <label>
                    密碼 / Password
                    <input
                      type="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                { error && 
                  <div className="error-text"> { error} </div>
                }
                <button type="submit">登入</button>
            </form>
          </div>
        </div>
      </div>
    );
};