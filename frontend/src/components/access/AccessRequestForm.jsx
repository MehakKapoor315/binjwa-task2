import React, { useState } from 'react';
import { Send, User, Mail, Building, Globe, Phone, FileText, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AccessRequestForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    organization: '',
    investor_type: '',
    capital_band: '',
    geography: '',
    purpose: '',
    phone: '',
    designation: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/access-requests', formData);
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass p-10 text-center max-w-2xl mx-auto animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-white mb-4">Request Received!</h2>
        <p className="text-text-muted mb-8 leading-relaxed">
          Thank you for your interest in LandVista. Our governance team will review your application and notify you via email once approved.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn btn-primary px-8"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-2">
        <Icon size={14} className="text-primary" /> {label}
      </label>
      <input 
        className="input-field"
        {...props}
        onChange={handleChange}
        required
      />
    </div>
  );

  const SelectField = ({ label, icon: Icon, options, ...props }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-2">
        <Icon size={14} className="text-primary" /> {label}
      </label>
      <select 
        className="input-field"
        {...props}
        onChange={handleChange}
        required
      >
        <option value="">Select {label}</option>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lab = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
    </div>
  );

  return (
    <div className="container max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold text-white mb-4">Request Platform Access</h1>
        <p className="text-text-muted max-w-xl mx-auto leading-relaxed">
          LandVista is an exclusive real estate intelligence platform. Please provide your details to request administrative approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 md:p-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Full Name" icon={User} name="full_name" value={formData.full_name} placeholder="John Doe" />
          <InputField label="Email Address" icon={Mail} type="email" name="email" value={formData.email} placeholder="john@example.com" />
          <InputField label="Organization" icon={Building} name="organization" value={formData.organization} placeholder="Acme Capital" />
          <InputField label="Designation" icon={FileText} name="designation" value={formData.designation} placeholder="Managing Director" />
          
          <SelectField 
            label="Investor Type" 
            icon={User} 
            name="investor_type" 
            value={formData.investor_type}
            options={[
              { label: 'VC', value: 'vc' },
              { label: 'Family Office', value: 'family_office' },
              { label: 'PE', value: 'pe' },
              { label: 'Angel', value: 'angel' },
              { label: 'Institutional', value: 'institutional' },
              { label: 'Other', value: 'other' }
            ]}
          />
          <SelectField 
            label="Capital Band" 
            icon={Building} 
            name="capital_band" 
            value={formData.capital_band}
            options={['1cr - 5cr', '5cr - 25cr', '25cr - 100cr', '100cr+']}
          />
          <SelectField 
            label="Geography" 
            icon={Globe} 
            name="geography" 
            value={formData.geography}
            options={['India', 'US', 'Europe', 'Global']}
          />
          <InputField label="Phone Number" icon={Phone} name="phone" value={formData.phone} placeholder="+91 98765 43210" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-2">
            <FileText size={14} className="text-primary" /> Purpose of Access
          </label>
          <textarea 
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            className="input-field min-h-[120px] resize-none"
            placeholder="Tell us why you would like to join the platform..."
            required
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-4 text-lg"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                SUBMITTING REQUEST...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={20} /> SUBMIT APPLICATION
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccessRequestForm;
