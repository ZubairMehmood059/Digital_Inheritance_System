import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// Adjust this import to match your existing firebase config file path
import { db, auth } from '../firebase/config';

const LegacyTrigger = () => {
  const [days, setDays] = useState('30');
  const [trustedContact, setTrustedContact] = useState('');
  const [message, setMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null); // New: Track when countdown starts
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch existing legacy trigger settings on mount
  useEffect(() => {
    const fetchLegacyData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'legacyTrigger', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDays(data.days?.toString() || '30');
            setTrustedContact(data.trustedContact || '');
            setMessage(data.message || '');
            
            // New: Format and display the last updated date
            if (data.updatedAt) {
              const date = data.updatedAt.toDate();
              setLastUpdated(date.toLocaleDateString() + ' at ' + date.toLocaleTimeString());
            }
          }
        } catch (error) {
          console.error("Error fetching legacy data:", error);
        }
      }
    };

    fetchLegacyData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    
    const user = auth.currentUser;
    if (!user) {
      setFeedback({ type: 'error', text: 'You must be logged in to save legacy settings.' });
      return;
    }

    setIsLoading(true);

    try {
      const legacyRef = doc(db, 'legacyTrigger', user.uid);
      await setDoc(legacyRef, {
        uid: user.uid,
        days: parseInt(days, 10),
        trustedContact,
        message,
        // The timestamp below now acts as the starting point for your inactivity countdown
        updatedAt: serverTimestamp() 
      }, { merge: true });

      setFeedback({ type: 'success', text: 'Legacy trigger settings saved successfully.' });
      
      // Update UI to show the current time as the new countdown start
      setLastUpdated(new Date().toLocaleDateString() + ' at ' + new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error("Error saving legacy data:", error);
      setFeedback({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="legacy-trigger-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Digital Legacy Trigger</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Define your inactivity timeline. If you do not log in for the selected duration, your trusted contact will receive your final legacy message.
      </p>

      {/* New: Status Indicator showing countdown start date */}
      {lastUpdated && (
        <div style={{ 
          padding: '10px 15px', 
          marginBottom: '24px', 
          backgroundColor: '#00ff0040', 
          borderLeft: '4px solid #3b82f6',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Status:</strong> Active. Countdown started on <span>{lastUpdated}</span>.
        </div>
      )}

      {feedback.text && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          borderRadius: '4px',
          backgroundColor: feedback.type === 'success' ? '#d4edda' : '#f8d7da',
          color: feedback.type === 'success' ? '#155724' : '#721c24'
        }}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="inactivityDays" style={{ fontWeight: 'bold' }}>Inactivity Duration</label>
          <select 
            id="inactivityDays"
            value={days} 
            onChange={(e) => setDays(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          >
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="trustedContact" style={{ fontWeight: 'bold' }}>Trusted Contact (Email or Phone)</label>
          <input 
            type="text" 
            id="trustedContact"
            value={trustedContact}
            onChange={(e) => setTrustedContact(e.target.value)}
            placeholder="e.g., trusted@example.com or +1234567890"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="message" style={{ fontWeight: 'bold' }}>Final Legacy Message</label>
          <textarea 
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your final instructions, goodbye message, or vault access details here..."
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '120px', resize: 'vertical' }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: isLoading ? '#9ca3af' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: 'var(--radius-btn)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {isLoading ? 'Saving...' : 'Save Legacy Settings'}
        </button>
      </form>
    </div>
  );
};

export default LegacyTrigger;