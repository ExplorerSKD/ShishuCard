import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  FaDownload, FaPrint, FaTimes, FaCertificate, FaHospital,
  FaUserMd, FaCalendarAlt, FaShieldAlt, FaCheckCircle
} from 'react-icons/fa';

const VaccinationCertificate = ({ 
  isOpen, 
  onClose, 
  childData, 
  vaccineFilter = 'completed' // 'completed' or 'all'
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const certificateRef = useRef();

  useEffect(() => {
    if (isOpen && childData) {
      generateQRCode();
    }
  }, [isOpen, childData]);

  const generateQRCode = async () => {
    try {
      // For MVP, using dummy URL. In production, this would link to actual vaccination record
      const recordUrl = `${window.location.origin}/vaccination-record/${childData._id}?verify=${Date.now()}`;
      const qrDataURL = await QRCode.toDataURL(recordUrl, {
        width: 120,
        margin: 2,
        color: {
          dark: '#2563eb', // Blue
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const getVaccinationData = () => {
    if (!childData?.vaccinationSchedule) return [];
    
    if (vaccineFilter === 'completed') {
      return childData.vaccinationSchedule.filter(v => v.status === 'completed');
    }
    return childData.vaccinationSchedule;
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 1) {
      return 'Newborn';
    } else if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // For MVP, we'll use print to PDF functionality
    // In production, you might want to use libraries like jsPDF or Puppeteer
    const printWindow = window.open('', '_blank');
    const certificateHTML = certificateRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vaccination Certificate - ${childData?.name}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
            }
            .certificate-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 3px solid #2563eb;
              border-radius: 15px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { 
              color: #1e40af; 
              font-size: 28px; 
              margin: 0; 
              font-weight: bold;
            }
            .header h2 { 
              color: #3b82f6; 
              font-size: 18px; 
              margin: 5px 0;
            }
            .info-section { 
              display: flex; 
              justify-content: space-between; 
              margin: 20px 0; 
            }
            .info-box { 
              flex: 1; 
              padding: 15px; 
              margin: 0 10px; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px;
            }
            .info-box h3 { 
              color: #1e40af; 
              font-size: 16px; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
            }
            table th, table td { 
              border: 1px solid #d1d5db; 
              padding: 10px; 
              text-align: left; 
            }
            table th { 
              background-color: #f3f4f6; 
              font-weight: bold; 
              color: #1e40af;
            }
            .status-completed { color: #059669; font-weight: bold; }
            .status-pending { color: #d97706; }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 2px solid #e5e7eb; 
              text-align: center; 
            }
            .qr-section { text-align: center; margin: 20px 0; }
            .disclaimer { 
              font-size: 12px; 
              color: #6b7280; 
              font-style: italic; 
              margin-top: 15px;
            }
            @media print {
              .no-print { display: none !important; }
              .certificate-container { 
                border: 2px solid #2563eb; 
                box-shadow: none; 
              }
            }
          </style>
        </head>
        <body>
          ${certificateHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isOpen || !childData) return null;

  const vaccinationData = getVaccinationData();
  const completedVaccines = vaccinationData.filter(v => v.status === 'completed').length;
  const totalVaccines = childData.vaccinationSchedule?.length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 no-print">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FaCertificate className="mr-2 text-blue-600" />
            Vaccination Certificate
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FaDownload className="mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div ref={certificateRef} className="certificate-container p-8">
          {/* Header */}
          <div className="header text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FaShieldAlt className="text-blue-600 text-4xl mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-blue-800 mb-2">
                  CHILD VACCINATION CERTIFICATE
                </h1>
                <h2 className="text-lg text-blue-600">
                  <FaHospital className="inline mr-2" />
                  Digital Health Vaccination Portal
                </h2>
              </div>
            </div>
            <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-green-500 rounded-full"></div>
          </div>

          {/* Child and Parent Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Child Information */}
            <div className="info-box border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <FaUserMd className="mr-2" />
                Child Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="font-bold text-gray-800">{childData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Date of Birth:</span>
                  <span className="font-bold text-gray-800">
                    {new Date(childData.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Age:</span>
                  <span className="font-bold text-gray-800">
                    {calculateAge(childData.dateOfBirth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Gender:</span>
                  <span className="font-bold text-gray-800 capitalize">{childData.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Blood Group:</span>
                  <span className="font-bold text-gray-800">{childData.bloodGroup || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="info-box border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <FaUserMd className="mr-2" />
                Parent/Guardian Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Parent Email:</span>
                  <span className="font-bold text-gray-800">{childData.parentEmail}</span>
                </div>
                {childData.parentInfo?.motherName && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Mother's Name:</span>
                    <span className="font-bold text-gray-800">{childData.parentInfo.motherName}</span>
                  </div>
                )}
                {childData.parentInfo?.fatherName && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Father's Name:</span>
                    <span className="font-bold text-gray-800">{childData.parentInfo.fatherName}</span>
                  </div>
                )}
                {childData.address?.city && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">City:</span>
                    <span className="font-bold text-gray-800">{childData.address.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vaccination Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-600 text-xl mr-2" />
                <span className="text-lg font-bold text-gray-800">
                  Vaccination Progress: {completedVaccines} of {totalVaccines} completed
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="text-xl font-bold text-green-600">
                  {totalVaccines > 0 ? Math.round((completedVaccines / totalVaccines) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Vaccination Details Table */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaCertificate className="mr-2 text-blue-600" />
              Vaccination Details
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-blue-800">
                      Vaccine Name
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-blue-800">
                      Due Date
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-blue-800">
                      Date Given
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-blue-800">
                      Status
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-blue-800">
                      Doctor Approval
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinationData.map((vaccine, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {vaccine.vaccineName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {new Date(vaccine.dueDate).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {vaccine.administerDate 
                          ? new Date(vaccine.administerDate).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className={`font-bold ${
                          vaccine.status === 'completed' 
                            ? 'text-green-600' 
                            : vaccine.status === 'overdue'
                            ? 'text-red-600'
                            : vaccine.status === 'pending_approval'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`}>
                          {vaccine.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {vaccine.approvedBy ? 'Doctor Approved' : vaccine.status === 'completed' ? 'Auto-approved' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* QR Code and Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="qr-section text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Verification QR Code</h3>
              {qrCodeUrl && (
                <div className="inline-block p-4 border-2 border-gray-300 rounded-lg">
                  <img src={qrCodeUrl} alt="Vaccination Record QR Code" className="mx-auto" />
                  <p className="text-xs text-gray-600 mt-2">
                    Scan to verify vaccination records
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Certificate Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Certificate ID:</span>
                  <span className="font-mono text-gray-800">VCT-{childData._id?.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-bold text-gray-800">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className="font-bold text-gray-800">Lifetime</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issuing Authority:</span>
                  <span className="font-bold text-gray-800">Digital Health Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer border-t-2 border-gray-200 pt-6 mt-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </span>
              </div>
              
              <div className="disclaimer text-xs text-gray-500 italic max-w-2xl mx-auto">
                <p className="mb-2">
                  <strong>DISCLAIMER:</strong> This certificate is system-generated and valid for vaccination record purposes. 
                  It serves as an official record of vaccinations administered as per the national immunization schedule.
                </p>
                <p>
                  This digital certificate is issued by the Digital Health Vaccination Portal and contains verified vaccination data. 
                  For any queries or verification, please contact your healthcare provider or scan the QR code above.
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center text-blue-600">
                  <FaShieldAlt className="mr-2" />
                  <span className="font-bold">DIGITALLY VERIFIED & SECURE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationCertificate;