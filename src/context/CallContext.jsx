import { createContext, useContext } from 'react';
import { useWebRTC } from '../hooks/useWebRTC.js';
import CallPanel from '../components/CallPanel.jsx';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  // Mounted once at app level rather than inside Messages, so an incoming
  // call rings even when the user is browsing listings.
  const call = useWebRTC();

  return (
    <CallContext.Provider value={call}>
      {children}
      <CallPanel call={call} />
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}