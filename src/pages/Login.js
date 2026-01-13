import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: signal,
      });
      const data = await res.json();
      console.log(data.token)
      
      if (res.ok) {
        console.log("Login was successful!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id); // Add this line
        //navigate(`/profile`);
         //navigate(`/profile`);
         navigate(`/profile`, { state: { username: form.username } });
        setMessage("Login successful!");
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted.');
      } else {
        console.error(err);
        setMessage("Error logging in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>Login to LiveCode Sync</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            style={isLoading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {message && (
          <p style={{
            ...styles.message,
            ...(message.includes("successful") ? styles.successMessage : styles.errorMessage)
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "Arial, sans-serif",
    padding: "20px"
  },
  loginBox: {
    background: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "400px"
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#333",
    fontSize: "24px",
    fontWeight: "600"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  input: {
    padding: "12px 15px",
    border: "2px solid #e1e5e9",
    borderRadius: "6px",
    fontSize: "16px",
    transition: "border-color 0.3s ease",
    outline: "none"
  },
  inputFocus: {
    borderColor: "#667eea"
  },
  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  buttonDisabled: {
    background: "#ccc",
    cursor: "not-allowed"
  },
  message: {
    textAlign: "center",
    marginTop: "20px",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px"
  },
  successMessage: {
    background: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb"
  },
  errorMessage: {
    background: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb"
  }
};