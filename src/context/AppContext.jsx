import React, { createContext, useContext, useState } from 'react';
import { agentStatus as initialAgentStatus, runHistory as initialRunHistory } from '../data/sampleData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [agentStatuses, setAgentStatuses] = useState(initialAgentStatus);
  const [runHistory, setRunHistory] = useState(initialRunHistory);
  const [isRunning, setIsRunning] = useState(false);

  // Simulation logic for launching agents
  const launchAgents = () => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Reset statuses to "Queued"
    setAgentStatuses(prev => prev.map(a => ({ ...a, status: 'Queued' })));

    // Simulate Agent 1: Testing Agent
    setTimeout(() => {
        setAgentStatuses(prev => prev.map(a => a.title === 'Testing Agent' ? { ...a, status: 'Running' } : a));
    }, 1000);

    setTimeout(() => {
        setAgentStatuses(prev => prev.map(a => a.title === 'Testing Agent' ? { ...a, status: 'Complete' } : a));
        setAgentStatuses(prev => prev.map(a => a.title === 'Security Agent' ? { ...a, status: 'Running' } : a));
    }, 3500);

    // Simulate Agent 2: Security Agent
    setTimeout(() => {
        setAgentStatuses(prev => prev.map(a => a.title === 'Security Agent' ? { ...a, status: 'Complete' } : a));
        setAgentStatuses(prev => prev.map(a => a.title === 'Deployment Agent' ? { ...a, status: 'Running' } : a));
    }, 6000);

    // Simulate Agent 3: Deployment Agent
    setTimeout(() => {
        setAgentStatuses(prev => prev.map(a => a.title === 'Deployment Agent' ? { ...a, status: 'Complete' } : a));
        setIsRunning(false);
        // Update Run History with a new random completion
        setRunHistory(prev => [...prev.slice(1), { name: 'Now', tests: Math.floor(Math.random() * 100) + 150, alerts: Math.floor(Math.random() * 5) }]);
    }, 8500);
  };

  const value = {
    isLiveMode,
    setIsLiveMode,
    apiUrl,
    setApiUrl,
    projectBrief,
    setProjectBrief,
    agentStatuses,
    runHistory,
    isRunning,
    launchAgents
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
