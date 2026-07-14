import React, { useState } from 'react';

const Demo = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    address: '',
    phone: '',
    code: '',
    date: '15',
    month: 'Jan',
    year: '2018',
    bank: '',
    branch: '',
    email: '',
    account_name: '',
    account_number: '',
    expiryDate: '15',
    expiryMonth: 'Jan',
    expiryYear: '2018',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'radio' ? (checked ? value : prev[name]) : value,
    }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const steps = ['General', 'Locations', 'Devices', 'Inventory', 'Linked Ads', 'Summary'];

  return (
    <div className="wizard-container">
      <div className="stepper">
        {steps.map((label, i) => {
          let className = 'step';
          if (i === step) className += ' current';
          else if (i < step) className += ' complete';
          else if (i === step + 1) className += ' next';

          return (
            <div key={i} className={className} onClick={() => setStep(i)}>
              {label}
            </div>
          );
        })}
      </div>

      <form className="wizard-form" onSubmit={(e) => e.preventDefault()}>
        {step === 0 && (
          <div className="form-section">
            <div className="form-group">
              <label>First Namess</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-section">
            <div className="form-group">
              <label>Address</label>
              <input name="address" value={formData.address} onChange={handleChange} />
            </div>
          </div>
        )}
        
        {step === 5 && (
          <div className="form-section confirm">
            <h3>Summary</h3>
            <p><strong>Full Name:</strong> {formData.first_name} {formData.last_name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Phone:</strong> {formData.phone}</p>
          </div>
        )}

        <div className="wizard-buttons">
          {step > 0 && <button type="button" onClick={prevStep}>Previous</button>}
          {step < 5 ? (
            <button type="button" onClick={nextStep}>Next</button>
          ) : (
            <button type="submit">Submit</button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Demo;
