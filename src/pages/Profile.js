import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:5001/api/auth/profile", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!res.ok) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }

                const data = await res.json();
                console.log("Profile data received:", data);
                setUserData(data);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                Loading profile...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                Error: {error}
            </div>
        );
    }

    if (!userData) {
        return (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                No user data available
            </div>
        );
    }

    return (
        <div style={{ 
            color: 'white', 
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ color: 'white', marginBottom: '20px' }}>Profile Page</h1>
            <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <p style={{ color: 'white', fontSize: '18px', margin: '10px 0' }}>
                    <strong>Welcome, {userData.username}!</strong>
                </p>
                <p style={{ color: 'white', fontSize: '16px', margin: '10px 0' }}>
                    <strong>Email:</strong> {userData.email}
                </p>
            </div>
            
            
        </div>
    );
};

export default Profile;