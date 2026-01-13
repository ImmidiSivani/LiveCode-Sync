
import React, { useState, useRef, useEffect } from "react";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import "../App.css";

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef("");
    const chatWindowRef = useRef(null);
    const inputBoxRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
    const { roomId } = useParams();
    const [clients, setClients] = useState([]);
    const [darkMode, setDarkMode] = useState(true);
    
    const username = location.state?.username;

    const toggleTheme = () => setDarkMode(prev => !prev);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();

            const handleErrors = (e) => {
                console.error("Socket error", e);
                toast.error("Socket connection failed.");
                reactNavigator("/");
            };

            socketRef.current.on("connect_error", handleErrors);
            socketRef.current.on("connect_failed", handleErrors);
            const userId = localStorage.getItem("userId");
           

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
                userId: userId
                
            });

            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                }

                setClients(clients);
                console.log("Clients List Updated: ", clients);
                 if (socketId === socketRef.current.id) {
    socketRef.current.emit(ACTIONS.REQUEST_CODE, { roomId });
  }
            });

            socketRef.current.on(ACTIONS.SYNC_CODE, ({ code }) => {
  if (code) {
    codeRef.current = code;
  }
});

            
     

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
               
               toast(`${username} has disconnected`);
                setClients((prev) =>
                    prev.filter((client) => client.socketId !== socketId)
                );
            });

            socketRef.current.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
                if (chatWindowRef.current) {
                    chatWindowRef.current.value += message;
                    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
                }
            });
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.SEND_MESSAGE);
            }
        };
    }, [roomId, location.state?.username, reactNavigator]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === "Enter" && document.activeElement === inputBoxRef.current) {
                e.preventDefault();
                sendMessage();
            }
        };
        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, []);

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("Room ID copied");
        } catch (err) {
            toast.error("Could not copy Room ID");
        }
    };

    const leaveRoom = () => reactNavigator("/");

    const sendMessage = () => {
        if (!inputBoxRef.current) return;
        const message = inputBoxRef.current.value.trim();
        if (!message) return;

        const fullMessage = `${location.state?.username}: ${message}\n`;

        if (chatWindowRef.current) {
            chatWindowRef.current.value += fullMessage;
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }

        socketRef.current.emit(ACTIONS.SEND_MESSAGE, {
            roomId,
            message: fullMessage,
        });

        inputBoxRef.current.value = "";
    };

    const runCode = async () => {
        const langMap = {
            "3": "cpp",
            "4": "java",
            "5": "python",
            "6": "c"
        };

        const lang = document.getElementById("languageOptions")?.value;
        const input = document.getElementById("input")?.value;
        const code = codeRef.current;

        if (!code?.trim()) {
            toast.error("Write some code first!");
            return;
        }

        const submission = {
            language: langMap[lang] || "python",
            version: "*",
            files: [{ content: code }],
            stdin: input?.trim() || " ",
        };

        const loadingToast = toast.loading("Running your code...");

        try {
            const res = await axios.post("https://emkc.org/api/v2/piston/execute", submission);
            toast.dismiss(loadingToast);

            const output = res.data.run.output;
            const outputElement = document.getElementById("output");
            if (outputElement) {
                outputElement.value = output || "No output.";
            }
            toast.success("Execution finished!");
        } catch (err) {
            toast.dismiss(loadingToast);
            const outputElement = document.getElementById("output");
            if (outputElement) {
                outputElement.value = "Execution error.";
            }
            toast.error("Something went wrong.");
        }
    };

    if (!location.state) return <Navigate to="/" />;

    return (
        <div className={`mainWrap ${darkMode ? 'dark' : 'light'}`}>
            <div className="leftWrap">
                <div className="topSection">
                     <img src='../logo.png' alt="LiveCode Sync" />
                   <h1 className="homePageLogo" style={{ fontSize: '2.75rem', fontWeight: 'bold',  marginBottom: '1rem' ,fontFamily:'lucida'} }>
  LiveCode Sync
</h1>

                    <button className="toggleBtn" onClick={toggleTheme}>
                        {darkMode ? "🌞" : "🌙"}
                    </button>
                </div>

                <div className="editorSection">
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        onCodeChange={(code) => { codeRef.current = code; }}
                        theme={darkMode ? "dracula" : "default"}
                        username={location.state?.username}
                    />
                </div>

                <div className="bottomSection">
                    <div className="inputWrap">
                        <label>Input</label>
                        <textarea id="input" className="textarea-style" placeholder="Enter input here"></textarea>
                    </div>
                    <div className="outputWrap">
                        <label>Output</label>
                        <textarea id="output" className="textarea-style" placeholder="Output will appear here" readOnly></textarea>
                    </div>
                    <div className="configWrap">
                        <div>
                            <label>Language: </label>
                            <select id="languageOptions" defaultValue="5" className="languageSelect">
                                <option value="3">C++</option>
                                <option value="4">Java</option>
                                <option value="5">Python</option>
                                <option value="6">C</option>
                            </select>
                        </div>
                        <button className="btn runBtn" onClick={runCode}>Run</button>
                    </div>
                </div>
            </div>

            <div className="rightWrap">
                <div className="chatSection">
                    <textarea
                        ref={chatWindowRef}
                        id="chatWindow"
                        className="chatArea"
                        placeholder="Chat messages will appear here"
                        disabled
                    />
                    <div className="sendChatWrap">
                        <input
                            ref={inputBoxRef}
                            id="inputBox"
                            type="text"
                            placeholder="Type message..."
                            className="inputField"
                        />
                        <button className="btn sendBtn" onClick={sendMessage}>
                            Send
                        </button>
                    </div>
                </div>

                <div className="controlSection">
                    <div className="membersWrap">
                        <h3>Online ({clients.length})</h3>
                        <div className="clientsList">
                            {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="roomControlsWrap">
                        <button className="btn copyBtn" onClick={copyRoomId}>
                            Copy Room ID
                        </button>
                        <button className="btn leaveBtn" onClick={leaveRoom}>
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;