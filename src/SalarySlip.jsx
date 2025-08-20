import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './SalarySlip.css';
import companyLogo from './logo.jpg'; // Import your company logo here

const SalarySlip = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    designation: '',
    dateOfJoining: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    panNumber: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    // Attendance fields
    totalWorkingDays: '30',
    paidDays: '30',
    leaves: '0',
    lopDays: '0',
    // New bank transaction date field
    bankTransactionDate: '',
  });

  const [earnings, setEarnings] = useState([
    { id: 1, title: 'Basic Salary', amount: '' },
    { id: 2, title: 'House Rent Allowance', amount: '' },
    { id: 3, title: 'Travel Allowance', amount: '' },
    { id: 4, title: 'Performance Pay', amount: '' },
    { id: 5, title: 'Joining Bonus', amount: '' },
  ]);

  const [deductions, setDeductions] = useState([
    { id: 1, title: 'Professional Tax', amount: '' },
  ]);

  const [view, setView] = useState('form'); // 'form', 'preview'
  const [newEarningTitle, setNewEarningTitle] = useState('');
  const [newDeductionTitle, setNewDeductionTitle] = useState('');
  const [editingField, setEditingField] = useState(null); // { type: 'earning'/'deduction', id: number }

  const componentRef = useRef();

  // Optimized PDF generation function with reduced file size
  const handleDownloadPDF = () => {
    const element = componentRef.current;
    
    // Apply styles that will make the content better for PDF generation
    element.classList.add('for-pdf-export');
    
    // Optimized configuration for smaller file size while maintaining quality
    html2canvas(element, {
      scale: 1.5, // Reduced from 2 to 1.5 for smaller file size
      useCORS: true,
      logging: false,
      letterRendering: true,
      backgroundColor: '#ffffff',
      windowWidth: 800, // Reduced window width
      windowHeight: element.scrollHeight,
      // Optimize image quality vs size
      allowTaint: false,
      removeContainer: true,
      imageTimeout: 0,
      // Reduce image quality slightly for smaller files
      quality: 0.85
    }).then(canvas => {
      // Remove temporary class after capture
      element.classList.remove('for-pdf-export');
      
      // Convert to JPEG with compression for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG with 85% quality
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable PDF compression
      });
      
      // Calculate dimensions to maximize content on page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate width and height with improved ratio
      const imgWidth = pageWidth * 0.95; // Slightly reduced padding
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image with minimal margins
      const xPosition = (pageWidth - imgWidth) / 2;
      const yPosition = 3; // Small top margin
      
      // Check if content exceeds page height
      if (imgHeight > pageHeight - 6) {
        // Content is too tall, scale it to fit the page height with small margins
        const newImgHeight = pageHeight - 6;
        const newImgWidth = (canvas.width * newImgHeight) / canvas.height;
        
        const newXPosition = (pageWidth - newImgWidth) / 2;
        // Use JPEG format in PDF for smaller size
        pdf.addImage(imgData, 'JPEG', newXPosition, yPosition, newImgWidth, newImgHeight, undefined, 'MEDIUM');
      } else {
        // Content fits, use original calculations
        pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight, undefined, 'MEDIUM');
      }
      
      // Additional compression
      pdf.compress = true;
      
      pdf.save(`Salary_Slip_${formData.employeeName}_${formData.month}_${formData.year}.pdf`);
    }).catch(error => {
      console.error('Error generating PDF:', error);
      // Remove class in case of error
      element.classList.remove('for-pdf-export');
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAmountChange = (type, id, value) => {
    if (type === 'earning') {
      setEarnings(
        earnings.map((item) =>
          item.id === id ? { ...item, amount: value } : item
        )
      );
    } else {
      setDeductions(
        deductions.map((item) =>
          item.id === id ? { ...item, amount: value } : item
        )
      );
    }
  };

  const calculateTotalEarnings = () => {
    return earnings.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  const calculateTotalDeductions = () => {
    return deductions.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  const calculateNetPay = () => {
    return calculateTotalEarnings() - calculateTotalDeductions();
  };

  const addEarning = () => {
    if (newEarningTitle.trim()) {
      const newId = earnings.length > 0 ? Math.max(...earnings.map(e => e.id)) + 1 : 1;
      setEarnings([...earnings, { id: newId, title: newEarningTitle, amount: '' }]);
      setNewEarningTitle('');
    }
  };

  const addDeduction = () => {
    if (newDeductionTitle.trim()) {
      const newId = deductions.length > 0 ? Math.max(...deductions.map(d => d.id)) + 1 : 1;
      setDeductions([...deductions, { id: newId, title: newDeductionTitle, amount: '' }]);
      setNewDeductionTitle('');
    }
  };

  const removeItem = (type, id) => {
    if (type === 'earning') {
      setEarnings(earnings.filter((item) => item.id !== id));
    } else {
      setDeductions(deductions.filter((item) => item.id !== id));
    }
  };

  const startEditing = (type, id, currentTitle) => {
    setEditingField({ type, id, title: currentTitle });
  };

  const saveEdit = () => {
    if (editingField) {
      if (editingField.type === 'earning') {
        setEarnings(
          earnings.map((item) =>
            item.id === editingField.id ? { ...item, title: editingField.title } : item
          )
        );
      } else {
        setDeductions(
          deductions.map((item) =>
            item.id === editingField.id ? { ...item, title: editingField.title } : item
          )
        );
      }
      setEditingField(null);
    }
  };

  const handleEditingChange = (e) => {
    setEditingField({ ...editingField, title: e.target.value });
  };

  const submitForm = () => {
    setView('preview');
  };

  const backToEdit = () => {
    setView('form');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const renderForm = () => (
    <div className="salary-form">
      <h2>Salary Slip Generator</h2>
      
      <div className="form-section">
        <h3>Pay Period</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Month</label>
            <select
              name="month"
              value={formData.month}
              onChange={handleInputChange}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Employee Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Employee Name</label>
            <input
              type="text"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleInputChange}
              placeholder="Enter employee name"
            />
          </div>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              placeholder="Enter employee ID"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              placeholder="Enter designation"
            />
          </div>
          <div className="form-group">
            <label>Date of Joining</label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              placeholder="Enter bank name"
            />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input
              type="text"
              name="accountNo"
              value={formData.accountNo}
              onChange={handleInputChange}
              placeholder="Enter account number"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleInputChange}
              placeholder="Enter IFSC code"
            />
          </div>
          <div className="form-group">
            <label>PAN Number</label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleInputChange}
              placeholder="Enter PAN number"
            />
          </div>
        </div>
      </div>

      {/* Attendance Details Section */}
      <div className="form-section">
        <h3>Attendance Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>STD days</label>
            <input
              type="number"
              name="totalWorkingDays"
              value={formData.totalWorkingDays}
              onChange={handleInputChange}
              placeholder="Enter total working days"
            />
          </div>
          <div className="form-group">
            <label>Paid Days</label>
            <input
              type="number"
              name="paidDays"
              value={formData.paidDays}
              onChange={handleInputChange}
              placeholder="Enter paid days"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Leaves</label>
            <input
              type="number"
              name="leaves"
              value={formData.leaves}
              onChange={handleInputChange}
              placeholder="Enter leaves"
            />
          </div>
          <div className="form-group">
            <label>LOP Days</label>
            <input
              type="number"
              name="lopDays"
              value={formData.lopDays}
              onChange={handleInputChange}
              placeholder="Enter LOP days"
            />
          </div>
        </div>
        {/* Bank Transaction Date Field */}
        <div className="form-row">
          <div className="form-group">
            <label>Bank Transaction Date</label>
            <input
              type="date"
              name="bankTransactionDate"
              value={formData.bankTransactionDate}
              onChange={handleInputChange}
              placeholder="Select bank transaction date"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Earnings</h3>
        {earnings.map((earning) => (
          <div key={earning.id} className="form-row item-row">
            {editingField && editingField.type === 'earning' && editingField.id === earning.id ? (
              <>
                <input
                  type="text"
                  value={editingField.title}
                  onChange={handleEditingChange}
                  className="edit-field"
                />
                <button className="btn save-btn" onClick={saveEdit}>
                  Save
                </button>
              </>
            ) : (
              <>
                <div className="item-title">{earning.title}</div>
                <input
                  type="number"
                  value={earning.amount}
                  onChange={(e) => handleAmountChange('earning', earning.id, e.target.value)}
                  className="amount-field"
                  placeholder="0.00"
                />
                <div className="item-actions">
                  <button 
                    className="btn edit-btn" 
                    onClick={() => startEditing('earning', earning.id, earning.title)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn remove-btn" 
                    onClick={() => removeItem('earning', earning.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        <div className="form-row add-item-row">
          <input
            type="text"
            placeholder="Add new earning"
            value={newEarningTitle}
            onChange={(e) => setNewEarningTitle(e.target.value)}
          />
          <button className="btn add-btn" onClick={addEarning}>
            Add
          </button>
        </div>
      </div>

      <div className="form-section">
        <h3>Deductions</h3>
        {deductions.map((deduction) => (
          <div key={deduction.id} className="form-row item-row">
            {editingField && editingField.type === 'deduction' && editingField.id === deduction.id ? (
              <>
                <input
                  type="text"
                  value={editingField.title}
                  onChange={handleEditingChange}
                  className="edit-field"
                />
                <button className="btn save-btn" onClick={saveEdit}>
                  Save
                </button>
              </>
            ) : (
              <>
                <div className="item-title">{deduction.title}</div>
                <input
                  type="number"
                  value={deduction.amount}
                  onChange={(e) => handleAmountChange('deduction', deduction.id, e.target.value)}
                  className="amount-field"
                  placeholder="0.00"
                />
                <div className="item-actions">
                  <button 
                    className="btn edit-btn" 
                    onClick={() => startEditing('deduction', deduction.id, deduction.title)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn remove-btn" 
                    onClick={() => removeItem('deduction', deduction.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        <div className="form-row add-item-row">
          <input
            type="text"
            placeholder="Add new deduction"
            value={newDeductionTitle}
            onChange={(e) => setNewDeductionTitle(e.target.value)}
          />
          <button className="btn add-btn" onClick={addDeduction}>
            Add
          </button>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn submit-btn" onClick={submitForm}>
          Generate Salary Slip
        </button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="preview-container">
      <div className="preview-actions">
        <button className="btn edit-btn" onClick={backToEdit}>
          Back to Edit
        </button>
        <button className="btn print-btn" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
      <div className="salary-slip-preview" ref={componentRef}>
        <div className="salary-slip">
          <div className="slip-header">
            <div className="company-logo">
              <img src={companyLogo} alt="Company Logo" className="logo-image" />
            </div>
            <div className="slip-title">
              <h3>PAY SLIP</h3>
              <h2>{formData.month} {formData.year}</h2>
            </div>
          </div>

          <div className="employee-details">
            <div className="detail-row">
              <div className="detail-group">
                <label>Employee Name:</label>
                <span>{formData.employeeName}</span>
              </div>
              <div className="detail-group">
                <label>Employee ID:</label>
                <span>{formData.employeeId}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-group">
                <label>Designation:</label>
                <span>{formData.designation}</span>
              </div>
              <div className="detail-group">
                <label>Date of Joining:</label>
                <span>{formData.dateOfJoining && new Date(formData.dateOfJoining).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-group">
                <label>Bank Name:</label>
                <span>{formData.bankName}</span>
              </div>
              <div className="detail-group">
                <label>Account No.:</label>
                <span>{formData.accountNo}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-group">
                <label>IFSC Code:</label>
                <span>{formData.ifscCode}</span>
              </div>
              <div className="detail-group">
                <label>PAN Number:</label>
                <span>{formData.panNumber}</span>
              </div>
            </div>
          </div>

          {/* Attendance Details Section in Preview */}
          <div className="employee-details">
            <div className="detail-row">
              <div className="detail-group">
                <label>STD days:</label>
                <span>{formData.totalWorkingDays}</span>
              </div>
              <div className="detail-group">
                <label>Paid Days:</label>
                <span>{formData.paidDays}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-group">
                <label>Leaves:</label>
                <span>{formData.leaves}</span>
              </div>
              <div className="detail-group">
                <label>LOP Days:</label>
                <span>{formData.lopDays}</span>
              </div>
            </div>
            {/* Display Bank Transaction Date in Preview */}
            <div className="detail-row">
              <div className="detail-group">
                <label>Transaction Date:</label>
                <span>{formData.bankTransactionDate && new Date(formData.bankTransactionDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="salary-details">
            <div className="earnings-section">
              <h3>Earnings</h3>
              {earnings.map((earning) => (
                <div key={earning.id} className="salary-item">
                  <span className="item-title">{earning.title}</span>
                  <span className="item-amount">{formatCurrency(earning.amount || 0)}</span>
                </div>
              ))}
              <div className="salary-item total">
                <span className="item-title">Total Earnings</span>
                <span className="item-amount">{formatCurrency(calculateTotalEarnings())}</span>
              </div>
            </div>

            <div className="deductions-section">
              <h3>Deductions</h3>
              {deductions.map((deduction) => (
                <div key={deduction.id} className="salary-item">
                  <span className="item-title">{deduction.title}</span>
                  <span className="item-amount">{formatCurrency(deduction.amount || 0)}</span>
                </div>
              ))}
              <div className="salary-item total">
                <span className="item-title">Total Deductions</span>
                <span className="item-amount">{formatCurrency(calculateTotalDeductions())}</span>
              </div>
            </div>
          </div>

          <div className="net-pay-section">
            <div className="net-pay">
              <span className="net-pay-label">Net Pay:</span>
              <span className="net-pay-amount">{formatCurrency(calculateNetPay())}</span>
            </div>
            <div className="net-pay-words">
              <span>{`(${numberToWords(calculateNetPay())} Only)`}</span>
            </div>
          </div>

          <div className="slip-footer">
            <p>This is a computer-generated salary slip and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to convert number to words
  function numberToWords(num) {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertLessThanOneThousand(n) {
      if (n === 0) return '';
      
      if (n < 20) {
        return units[n];
      }
      
      const digit = n % 10;
      if (n < 100) {
        return tens[Math.floor(n / 10)] + (digit ? ' ' + units[digit] : '');
      }
      
      return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
    }
    
    if (num === 0) return 'Zero';
    
    // Handle rupees and paise separately
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = '';
    
    // Convert rupees to words
    if (rupees > 0) {
      let rupeesInWords = '';
      let remainingRupees = rupees;
      
      if (remainingRupees >= 10000000) { // Crore
        rupeesInWords += convertLessThanOneThousand(Math.floor(remainingRupees / 10000000)) + ' Crore ';
        remainingRupees = remainingRupees % 10000000;
      }
      
      if (remainingRupees >= 100000) { // Lakh
        rupeesInWords += convertLessThanOneThousand(Math.floor(remainingRupees / 100000)) + ' Lakh ';
        remainingRupees = remainingRupees % 100000;
      }
      
      if (remainingRupees >= 1000) { // Thousand
        rupeesInWords += convertLessThanOneThousand(Math.floor(remainingRupees / 1000)) + ' Thousand ';
        remainingRupees = remainingRupees % 1000;
      }
      
      rupeesInWords += convertLessThanOneThousand(remainingRupees);
      
      result = rupeesInWords.trim() + ' Rupees';
    }
    
    // Convert paise to words if there are any
    if (paise > 0) {
      result += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
    }
    
    return result;
  }

  return <div className="salary-slip-container">{view === 'form' ? renderForm() : renderPreview()}</div>;
};

export default SalarySlip;