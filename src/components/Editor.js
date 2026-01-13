// import React, { useEffect, useRef } from "react";
// import CodeMirror from "codemirror";
// import "codemirror/lib/codemirror.css";
// import "codemirror/theme/dracula.css";
// //import "codemirror/theme/default.css"; // Light theme
// import "codemirror/mode/javascript/javascript";
// import "codemirror/addon/edit/closetag";
// import "codemirror/addon/edit/closebrackets";
// import ACTIONS from "../Actions";

// const Editor = ({ socketRef, roomId, onCodeChange, theme }) => {
//   const editorRef = useRef(null);

//   useEffect(() => {
//     async function init() {
//       editorRef.current = CodeMirror.fromTextArea(
//         document.getElementById("realtimeEditor"),
//         {
//           mode: { name: "javascript", json: true },
//           theme: theme || "default",
//           autoCloseTags: true,
//           autoCloseBrackets: true,
//           lineNumbers: true,
//         }
//       );

//       editorRef.current.on("change", (instance, changes) => {
//         const { origin } = changes;
//         const code = instance.getValue();
//         onCodeChange(code);
//         if (origin !== "setValue") {
//           socketRef.current.emit(ACTIONS.CODE_CHANGE, {
//             roomId,
//             code,
//           });
//         }
//       });
//     }

//     init();
//   }, []);

//   // Change theme dynamically when theme prop updates
//   useEffect(() => {
//     if (editorRef.current) {
//       editorRef.current.setOption("theme", theme || "default");
//     }
//   }, [theme]);

//   useEffect(() => {
//     if (socketRef.current) {
//       socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
//         if (code != null) {
//           editorRef.current.setValue(code);
//         }
//       });
//     }
//     return () => {
//       socketRef.current.off(ACTIONS.CODE_CHANGE);
//     };
//   }, [socketRef.current]);

//   return <textarea id="realtimeEditor"></textarea>;
// };

// export default Editor;  




import React, { useEffect, useRef } from "react";
 import CodeMirror from "codemirror";
 import "codemirror/lib/codemirror.css";
 import "codemirror/theme/dracula.css";
 //import "codemirror/theme/default.css"; // Light theme
 import "codemirror/mode/javascript/javascript";
 import "codemirror/addon/edit/closetag";
 import "codemirror/addon/edit/closebrackets";
 import ACTIONS from "../Actions";
 import { toast } from "react-hot-toast";

 const Editor = ({ socketRef, roomId, onCodeChange, theme ,username}) => {
   const editorRef = useRef(null);

   useEffect(() => {
    async function init() {
       editorRef.current = CodeMirror.fromTextArea(
         document.getElementById("realtimeEditor"),
         {
           mode: { name: "javascript", json: true },
           theme: theme || "default",
           autoCloseTags: true,
           autoCloseBrackets: true,
           lineNumbers: true,
           
         }
       );


        editorRef.current.setSize("100%", "500px");
       editorRef.current.on("change", (instance, changes) => {
         const { origin } = changes;
         const code = instance.getValue();
         onCodeChange(code);
         if (origin !== "setValue") {
           socketRef.current.emit(ACTIONS.CODE_CHANGE, {
             roomId,
             code,
            username,
           });
         }
       });
     }

     init();
   }, []);

   // Change theme dynamically when theme prop updates
   useEffect(() => {
     if (editorRef.current) {
       editorRef.current.setOption("theme", theme || "default");
     }
   }, [theme]);

   useEffect(() => {
     if (socketRef.current) {
       socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code, username: editorName}) => {
         if (code != null) {
           editorRef.current.setValue(code);
            if (editorName && editorName !== username) {
          //toast(`${editorName} is editing...`, { icon: "✏️" });
          toast.dismiss("editing-toast"); // Dismiss previous toast if any
          toast(`${editorName} is editing...`, {
            id: "editing-toast",
            icon: "✏️",
            duration: 1000, // Toast will auto-close after 1 second
          });
        }
         }
       });
     }
     return () => {
       socketRef.current.off(ACTIONS.CODE_CHANGE);
       toast.dismiss("editing-toast");
     };
   }, [socketRef.current,username]);


    // Add this useEffect to handle initial code sync
useEffect(() => {
  if (socketRef.current) {
    socketRef.current.on(ACTIONS.SYNC_CODE, ({ code }) => {
      if (code !== null && editorRef.current) {
        editorRef.current.setValue(code);
      }
    });

    return () => {
      socketRef.current.off(ACTIONS.SYNC_CODE);
    };
  }
}, [socketRef.current]);

   return <textarea id="realtimeEditor"></textarea>;
 };

 export default Editor;














