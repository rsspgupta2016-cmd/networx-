import React from "react";

const ChatView = ({ connection }) => (
    <div className="h-full p-4 bg-networx-dark">
        <h3 className="text-networx-light">Chat with {connection.name}</h3>
        {/* Render chat messages here */}
    </div>
);

export default ChatView;
