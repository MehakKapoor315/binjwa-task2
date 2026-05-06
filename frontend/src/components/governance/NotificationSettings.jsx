import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, Bell, Clock, FileText, Zap, Save, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    email_alerts: true,
    sms_alerts: false,
    inapp_alerts: true,
    nda_reminders: true,
    deal_updates: true,
    critical_updates: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await api.get('/notifications/preferences');
        if (response.data.data) {
          setPreferences(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/notifications/preferences', preferences);
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );

  const SettingRow = ({ icon: Icon, title, description, prefKey, color }) => (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl border border-transparent hover:border-border-white">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
          <Icon size={22} />
        </div>
        <div>
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-text-muted text-sm">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={preferences[prefKey]} 
          onChange={() => handleToggle(prefKey)}
        />
        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );

  return (
    <div className="container max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-heading font-bold text-white mb-2">Notification Settings</h1>
      <p className="text-text-muted mb-8">Manage how and when you receive updates from LandVista.</p>

      <div className="space-y-8">
        {/* Delivery Channels */}
        <section className="glass p-6">
          <h3 className="text-xl text-white font-heading mb-6 flex items-center gap-2">
            <Smartphone size={20} className="text-primary" />
            Delivery Channels
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <SettingRow 
              icon={Mail} 
              title="Email Notifications" 
              description="Receive detailed summaries and critical alerts via email" 
              prefKey="email_alerts"
              color="blue-400"
            />
            <SettingRow 
              icon={Bell} 
              title="In-App Alerts" 
              description="Real-time notifications while you browse the platform" 
              prefKey="inapp_alerts"
              color="primary"
            />
          </div>
        </section>

        {/* Content Types */}
        <section className="glass p-6">
          <h3 className="text-xl text-white font-heading mb-6 flex items-center gap-2">
            <FileText size={20} className="text-secondary" />
            Notification Content
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <SettingRow 
              icon={Clock} 
              title="NDA Reminders" 
              description="Alerts when your NDAs are about to expire" 
              prefKey="nda_reminders"
              color="warning"
            />
            <SettingRow 
              icon={Zap} 
              title="Deal Updates" 
              description="Stay informed when deals in your pipeline change status" 
              prefKey="deal_updates"
              color="success"
            />
            <SettingRow 
              icon={CheckCircle} 
              title="Critical Updates" 
              description="Security breaches and system-wide critical announcements" 
              prefKey="critical_updates"
              color="danger"
            />
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary min-w-[150px]"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={18} />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
