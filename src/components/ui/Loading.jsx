import React, {useState, useEffect} from 'react';

const Loading = () => {

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css';
        document.head.appendChild(link);
      
        return () => {
          document.head.removeChild(link); // Cleanup
        };
    }, []);

    return (
        <div>
            <p style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '20px',
                fontWeight: 'bold',
                padding: '20px',
            }}>
                Waiting for data transmission...
            </p>
        </div>
    );   
    
};

export default Loading;
