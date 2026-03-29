import React, { useState } from 'react';
import AayamScreen from './AayamScreen';
import TripleThreat_Superstar from './TripleThreat_Superstar';

const SuperstarContainer = () => {
  const [activeScreen, setActiveScreen] = useState('aayam'); // 'aayam' or 'triple-threat'

  return (
    <div className="superstar-app-root">
      {activeScreen === 'aayam' ? (
        <AayamScreen onNavigateTripleThreat={() => setActiveScreen('triple-threat')} />
      ) : (
        <TripleThreat_Superstar onExit={() => setActiveScreen('aayam')} />
      )}
    </div>
  );
};

export default SuperstarContainer;
