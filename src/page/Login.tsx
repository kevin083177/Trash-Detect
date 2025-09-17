import React, { useState } from "react";
import '../styles/Login.css';
import { asyncPost } from "../utils/fetch";
import { auth_api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    setIsLoading(true);
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
        
        const username = response.body.user.username;
        
        login(username);
        navigate("/");
      } else {
        setError("帳號或密碼錯誤")
      }
    } catch (e) {
      setError("伺服器錯誤");
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="login-wrapper">
      <div className="dog-decoration"></div>
      <div className="login-container">
        <div className="login-left"></div>
        <div className="login-right">
          <h1>Hello Garbi</h1>
          <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                  <div className="label-nav">
                      <span className="label-text">電子郵件</span>
                      <div className="label-divider"></div>
                      <span className="label-text">Email</span>
                  </div>
                  <input
                    type="text"
                    name="account"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="請輸入您的電子郵件"
                  />
              </div>
              
              <div className="form-group">
                  <div className="label-nav">
                      <span className="label-text">密碼</span>
                      <div className="label-divider"></div>
                      <span className="label-text">Password</span>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入您的密碼"
                  />
              </div>
              
              { error && 
                <div className="error-text">{ error }</div>
              }
              <button type="submit" disabled={isLoading}>
                {isLoading ? '登入中...' : '登入'}
              </button>
          </form>
        </div>
      </div>
    </div>
  );
};