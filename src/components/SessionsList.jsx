import React, { useState, useEffect } from 'react';
import "../../style.css";

window.isLiveData = false;

const SessionsList = ({ onDataReceived, liveData, onSelectSession, onAssetLoaded, setIsLoading }) => {
    const [sessions, setSessions] = useState([]);
    const [isLiveData, setIsLiveData] = useState(false);
    const [isPlaybackStarted, setIsPlaybackStarted] = useState(false);    
    
    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css';
        document.head.appendChild(link);
      
        return () => {
          document.head.removeChild(link); // Cleanup
        };
    }, []);
      
    
    const fetchSessions = async () => {
        const response = await fetch('http://localhost:8080/api/sessions-list');
        const sessions = await response.json();
        setSessions(sessions);
    };

    const formatTime = (timestamp) => {
        const options = { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
        };
        return new Date(timestamp).toLocaleString('en-US', options);
    };   

    const handleSessionClick = (session) => {        
        console.log(`Session ${session.name} selected`);            
        window.isLiveData = true;
        setIsLiveData(true);
        setIsPlaybackStarted(true);  
        onDataReceived(liveData, true);
        onAssetLoaded(true);
        onSelectSession(session);               
    };
    
    return (
        <div>        
        {
            sessions.length > 0 ? sessions.map((session) => (
                <button className="show-sessions-btn" style={{fontSize: '20px', fontWeight: 'bold'}}  key={session.id} onClick={() => handleSessionClick(session)}>
                Session Name: {session.name} <br/> Session Start Time: {formatTime(session.startTime)}
                </button>
            )) : 
            <p style={{fontWeight: 'bold', fontSize: '20px'}}>No sessions list available<br/>Please check if Web Socket Server has been started</p>            
        }
        </div>
    );
};

export default SessionsList;