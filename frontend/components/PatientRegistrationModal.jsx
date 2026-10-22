import React, { useState, useRef, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { COMMON_INSURERS, ONCOLOGISTS, GOVT_SCHEMES } from '../utils/mockData';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Check, 
  Calendar, 
  Zap, 
  HeartHandshake, 
  CreditCard,
  Building2,
  Stethoscope,
  Landmark,
  Award,
  ClipboardList,
  Globe,
  Plane,
  FileCheck,
  Hotel,
  ShieldCheck,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Printer,
  UserPlus
} from 'lucide-react';
import SpeechMicButton from './SpeechMicButton';

const INDIAN_PORTS_OF_ENTRY = [
  'Delhi (Indira Gandhi Intl - DEL/IGI)',
  'Mumbai (Chhatrapati Shivaji Intl - BOM/CSIA)',
  'Chennai (Chennai Intl - MAA)',
  'Bengaluru (Kempegowda Intl - BLR)',
  'Hyderabad (Rajiv Gandhi Intl - HYD)',
  'Kolkata (Netaji Subhash Chandra Bose Intl - CCU)',
  'Kochi (Cochin Intl - COK)',
  'Ahmedabad (Sardar Vallabhbhai Patel Intl - AMD)',
  'Goa (Dabolim / MOPA Intl - GOI/GOX)',
  'Tiruchirappalli (Trichy Intl - TRZ)'
];

const FOREIGN_COUNTRIES = [
  'United Kingdom',
  'United States of America',
  'United Arab Emirates',
  'Bangladesh',
  'Oman',
  'Saudi Arabia',
  'Kenya',
  'Nigeria',
  'Tanzania',
  'Kuwait',
  'Qatar',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Sri Lanka',
  'Nepal',
  'Maldives',
  'Iraq',
  'Yemen'
];

export default function PatientRegistrationModal({ isOpen, onClose, onRegisteredAndStartIntake }) {
  const { registerPatient } = usePatients();

  // Registration Mode: 'DOMESTIC' (Indian Resident) | 'FOREIGN' (Foreign National - FRRO Form C)
  const [patientCategory, setPatientCategory] = useState('DOMESTIC');

  // Webcam & Photo Capture State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [formData, setFormData] = useState({
    patientCategory: 'DOMESTIC',
    fullName: '',
    photoUrl: '', // Webcam captured base64 photo
    dob: '',
    age: '',
    gender: 'Female',
    phone: '',
    // Domestic Identity & Address Fields
    aadhaarNumber: '',
    address: '', // Street Address / Locality
    city: '',    // Specifically requested City field
    state: 'Tamil Nadu',
    pincode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    referredBy: '', // Reference / Referred By (Optional)
    referrerContact: '', // Number Of Reference's / Referrer Phone (Optional)
    doctorAssigned: ONCOLOGISTS[0],

    // FRRO Form-C Fields (Foreign National / Medical Tourist)
    nationality: 'United Kingdom',
    passportNumber: '',
    passportCountry: 'United Kingdom',
    passportExpiry: '',
    visaNumber: '',
    visaType: 'e-Medical', // e-Medical | MED | MED-X | Tourist | Entry
    visaExpiry: '',
    visaPlaceOfIssue: '',
    arrivalDate: '',
    portOfEntry: INDIAN_PORTS_OF_ENTRY[0],
    comingFromCountry: 'United Kingdom',
    expectedDepartureDate: '',
    stayAccommodationType: 'Hospital Inpatient Suite', // Hospital Inpatient Suite | Hotel | Guest House | Private Residence
    stayPlaceName: 'Bright Solutions Hospital Deluxe Suite',
    stayAddressInIndia: 'Central Hospital Campus, Greams Road',
    stayCityInIndia: 'Chennai',
    stayStateInIndia: 'Tamil Nadu',
    stayPincodeInIndia: '600006',
    localContactPhone: '',
    permanentAddressAbroad: '',
    homeCountryCity: 'London',
    homeCountry: 'United Kingdom',
    overseasEmergencyContact: '',
    formCNumber: '',
    formCStatus: 'COMPLIANT_SUBMITTED',

    // Insurance & Billing
    insuranceType: 'INSURANCE', // 'INSURANCE' | 'GOVT_SCHEME' | 'CASH' | 'FOREX_TOURISM'
    insuranceProvider: COMMON_INSURERS[0],
    policyNumber: '',
    groupNumber: '',
    coveragePct: '80',
    deductible: '5000',
    preAuthNumber: '',
    govtSchemeName: GOVT_SCHEMES[0],
    beneficiaryId: '',
    abhaId: '',
    abhaAddress: ''
  });

  const [errors, setErrors] = useState({});
  const [isAbhaVerified, setIsAbhaVerified] = useState(false);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Please allow webcam permission or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    const minDim = Math.min(video.videoWidth || 300, video.videoHeight || 300);
    const startX = ((video.videoWidth || 300) - minDim) / 2;
    const startY = ((video.videoHeight || 300) - minDim) / 2;
    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, photoUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Format Aadhaar: XXXX XXXX XXXX (12 digits)
  const formatAadhaar = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updatedVal = value;
      if (name === 'aadhaarNumber') {
        updatedVal = formatAadhaar(value);
      }

      const updated = { ...prev, [name]: updatedVal };

      // Auto derive age from DOB
      if (name === 'dob' && value) {
        const birthYear = new Date(value).getFullYear();
        const currentYear = new Date().getFullYear();
        if (birthYear && birthYear > 1900 && birthYear <= currentYear) {
          updated.age = String(currentYear - birthYear);
        }
      }

      // Live BMI calculation
      if (name === 'weight' || name === 'height') {
        const w = parseFloat(name === 'weight' ? value : prev.weight);
        const h = parseFloat(name === 'height' ? value : prev.height) / 100;
        if (w > 0 && h > 0) {
          updated.bmi = (w / (h * h)).toFixed(1);
        } else if (!value) {
          updated.bmi = '';
        }
      }

      // Keep city synchronized between domestic and FRRO stay city
      if (name === 'city' && prev.patientCategory === 'DOMESTIC') {
        updated.stayCityInIndia = value;
      } else if (name === 'stayCityInIndia' && prev.patientCategory === 'FOREIGN') {
        updated.city = value;
      }

      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Switch between Domestic and Foreign category
  const handleCategorySwitch = (cat) => {
    setPatientCategory(cat);
    setFormData(prev => ({
      ...prev,
      patientCategory: cat,
      insuranceType: cat === 'FOREIGN' ? 'INSURANCE' : prev.insuranceType,
      insuranceProvider: cat === 'FOREIGN' ? 'BUPA International Medical Travel Insurance' : prev.insuranceProvider
    }));
    setErrors({});
  };

  // -------------------------------------------------------------
  // 1-Click Demo Profile Handler (Beside Patient Category Toggle)
  // -------------------------------------------------------------
  const handleFillDemoProfile = () => {
    if (patientCategory === 'FOREIGN') {
      handlePresetForeignUK();
    } else {
      handlePresetDomesticGovt();
    }
  };

  // Normal Preset 1: PM-JAY Cashless + Aadhaar Card
  const handlePresetDomesticGovt = () => {
    setPatientCategory('DOMESTIC');
    setIsAbhaVerified(true);
    setFormData({
      patientCategory: 'DOMESTIC',
      fullName: 'Sangeetha Krishnan',
      dob: '1974-06-18',
      age: '52',
      gender: 'Female',
      phone: '+91 98400 98210',
      aadhaarNumber: '4521 8840 9123',
      address: 'Plot 44, Gandhi Road, Tambaram',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600045',
      emergencyContactName: 'Murali Krishnan (Son)',
      emergencyContactPhone: '+91 98400 98211',
      doctorAssigned: 'Dr. Kiran Patel (General & Internal Medicine)',
      // FRRO defaults cleared
      nationality: 'Indian',
      passportNumber: '',
      passportCountry: 'India',
      passportExpiry: '',
      visaNumber: '',
      visaType: 'MED',
      visaExpiry: '',
      visaPlaceOfIssue: '',
      arrivalDate: '',
      portOfEntry: INDIAN_PORTS_OF_ENTRY[0],
      comingFromCountry: '',
      expectedDepartureDate: '',
      stayAccommodationType: 'Permanent Residence',
      stayPlaceName: 'Tambaram Residence',
      stayAddressInIndia: 'Plot 44, Gandhi Road, Tambaram',
      stayCityInIndia: 'Chennai',
      stayStateInIndia: 'Tamil Nadu',
      stayPincodeInIndia: '600045',
      localContactPhone: '+91 98400 98210',
      permanentAddressAbroad: '',
      homeCountryCity: '',
      homeCountry: 'India',
      overseasEmergencyContact: '',
      formCNumber: '',
      formCStatus: 'EXEMPT',
      // Vitals
      weight: '58',
      height: '160',
      bmi: '22.7',
      bp: '124/82',
      pulse: '76',
      temp: '98.6',
      spo2: '98',
      respRate: '16',
      insuranceType: 'GOVT_SCHEME',
      insuranceProvider: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
      policyNumber: 'PMJAY-TN-9821034',
      groupNumber: 'NHA-ABDM-01',
      coveragePct: '100',
      deductible: '0',
      preAuthNumber: 'PMJAY-PREAUTH-APPROVED',
      govtSchemeName: 'Ayushman Bharat — PM-JAY (AB-PMJAY)',
      beneficiaryId: 'PMJAY-TN-9821034',
      abhaId: '91-4820-1928-3819',
      abhaAddress: 'sangeetha.krishnan@abdm'
    });
    setErrors({});
  };

  // Normal Preset 2: Star Health TPA + Aadhaar Card
  const handlePresetDomesticInsurance = () => {
    setPatientCategory('DOMESTIC');
    setIsAbhaVerified(true);
    setFormData({
      patientCategory: 'DOMESTIC',
      fullName: 'Anand Sharma',
      dob: '1978-11-22',
      age: '48',
      gender: 'Male',
      phone: '+91 98840 55123',
      aadhaarNumber: '8820 1928 3819',
      address: 'Flat 302, Green Meadows, Velachery',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600042',
      emergencyContactName: 'Radha Sharma (Spouse)',
      emergencyContactPhone: '+91 98840 55124',
      doctorAssigned: 'Dr. Swaminathan (General & Laparoscopic Surgery)',
      nationality: 'Indian',
      passportNumber: '',
      passportCountry: 'India',
      passportExpiry: '',
      visaNumber: '',
      visaType: 'MED',
      visaExpiry: '',
      visaPlaceOfIssue: '',
      arrivalDate: '',
      portOfEntry: INDIAN_PORTS_OF_ENTRY[0],
      comingFromCountry: '',
      expectedDepartureDate: '',
      stayAccommodationType: 'Permanent Residence',
      stayPlaceName: 'Velachery Residence',
      stayAddressInIndia: 'Flat 302, Green Meadows, Velachery',
      stayCityInIndia: 'Chennai',
      stayStateInIndia: 'Tamil Nadu',
      stayPincodeInIndia: '600042',
      localContactPhone: '+91 98840 55123',
      permanentAddressAbroad: '',
      homeCountryCity: '',
      homeCountry: 'India',
      overseasEmergencyContact: '',
      formCNumber: '',
      formCStatus: 'EXEMPT',
      // Vitals
      weight: '74',
      height: '172',
      bmi: '25.0',
      bp: '130/85',
      pulse: '78',
      temp: '98.4',
      spo2: '99',
      respRate: '18',
      insuranceType: 'INSURANCE',
      insuranceProvider: 'Star Health Comprehensive',
      policyNumber: 'SH-2026-99120',
      groupNumber: 'GRP-CORP-4022',
      coveragePct: '80',
      deductible: '5000',
      preAuthNumber: 'STAR-PREAUTH-771',
      govtSchemeName: GOVT_SCHEMES[0],
      beneficiaryId: '',
      abhaId: '91-2201-8841-5520',
      abhaAddress: 'anand.sharma@abdm'
    });
    setErrors({});
  };

  // Foreign Preset 1: UK Citizen • e-Medical Visa (FRRO Form C Compliant)
  const handlePresetForeignUK = () => {
    setPatientCategory('FOREIGN');
    setIsAbhaVerified(false);
    setFormData({
      patientCategory: 'FOREIGN',
      fullName: 'David Arthur Miller',
      dob: '1968-04-12',
      age: '58',
      gender: 'Male',
      phone: '+91 91500 88219',
      aadhaarNumber: '',
      address: 'Hotel ITC Grand Chola, Room 514, Guindy',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600032',
      emergencyContactName: 'Eleanor Miller (Spouse in London)',
      emergencyContactPhone: '+44 20 7946 0882',
      doctorAssigned: 'Dr. Kiran Patel (General & Internal Medicine)',
      // Standardized FRRO Form-C Data
      nationality: 'United Kingdom',
      passportNumber: 'GBR-9921402',
      passportCountry: 'United Kingdom',
      passportExpiry: '2032-08-15',
      visaNumber: 'V-MED-2026-8812',
      visaType: 'e-Medical',
      visaExpiry: '2027-02-28',
      visaPlaceOfIssue: 'High Commission of India, London (e-Visa Portal)',
      arrivalDate: '2026-10-18',
      portOfEntry: 'Delhi (Indira Gandhi Intl - DEL/IGI)',
      comingFromCountry: 'United Kingdom',
      expectedDepartureDate: '2026-11-20',
      stayAccommodationType: 'Hotel / Serviced Apartment',
      stayPlaceName: 'Hotel ITC Grand Chola Room 514',
      stayAddressInIndia: '63 Mount Road, Guindy',
      stayCityInIndia: 'Chennai',
      stayStateInIndia: 'Tamil Nadu',
      stayPincodeInIndia: '600032',
      localContactPhone: '+91 91500 88219',
      permanentAddressAbroad: '14 Knightsbridge Mews, Kensington, London SW7 1RB, UK',
      homeCountryCity: 'London',
      homeCountry: 'United Kingdom',
      overseasEmergencyContact: 'Eleanor Miller (Spouse) +44 20 7946 0882',
      formCNumber: 'FRRO-C-2026-881920',
      formCStatus: 'COMPLIANT_SUBMITTED',
      // Vitals
      weight: '82',
      height: '180',
      bmi: '25.3',
      bp: '136/88',
      pulse: '75',
      temp: '98.6',
      spo2: '98',
      respRate: '16',
      insuranceType: 'INSURANCE',
      insuranceProvider: 'BUPA Global Medical Travel Insurance',
      policyNumber: 'BUPA-INT-992140',
      groupNumber: 'INT-MED-EXP',
      coveragePct: '90',
      deductible: '2500',
      preAuthNumber: 'FRRO-GOP-BUPA-771',
      govtSchemeName: '',
      beneficiaryId: '',
      abhaId: '',
      abhaAddress: ''
    });
    setErrors({});
  };

  // Foreign Preset 2: UAE Citizen • Medical Attendant (MED-X Visa)
  const handlePresetForeignUAE = () => {
    setPatientCategory('FOREIGN');
    setIsAbhaVerified(false);
    setFormData({
      patientCategory: 'FOREIGN',
      fullName: 'Fatima Al-Mansoor',
      dob: '1982-09-05',
      age: '44',
      gender: 'Female',
      phone: '+91 98402 77190',
      aadhaarNumber: '',
      address: 'Bright Solutions Hospital Deluxe Suite 304, Greams Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600006',
      emergencyContactName: 'Tariq Al-Mansoor (Brother in Dubai)',
      emergencyContactPhone: '+971 50 123 4567',
      doctorAssigned: 'Dr. Swaminathan (General & Laparoscopic Surgery)',
      // Standardized FRRO Form-C Data
      nationality: 'United Arab Emirates',
      passportNumber: 'ARE-7819230',
      passportCountry: 'United Arab Emirates',
      passportExpiry: '2030-11-10',
      visaNumber: 'V-DXB-2026-4401',
      visaType: 'MED-X',
      visaExpiry: '2026-12-30',
      visaPlaceOfIssue: 'Consulate General of India, Dubai',
      arrivalDate: '2026-10-20',
      portOfEntry: 'Mumbai (Chhatrapati Shivaji Intl - BOM/CSIA)',
      comingFromCountry: 'United Arab Emirates',
      expectedDepartureDate: '2026-11-28',
      stayAccommodationType: 'Hospital Inpatient Suite',
      stayPlaceName: 'Bright Solutions Deluxe Ward Suite 304',
      stayAddressInIndia: 'Central Hospital Campus, Greams Road',
      stayCityInIndia: 'Chennai',
      stayStateInIndia: 'Tamil Nadu',
      stayPincodeInIndia: '600006',
      localContactPhone: '+91 98402 77190',
      permanentAddressAbroad: 'Villa 18, Jumeirah Beach Road, Dubai, UAE',
      homeCountryCity: 'Dubai',
      homeCountry: 'United Arab Emirates',
      overseasEmergencyContact: 'Tariq Al-Mansoor (Brother) +971 50 123 4567',
      formCNumber: 'FRRO-C-2026-992144',
      formCStatus: 'COMPLIANT_SUBMITTED',
      // Vitals
      weight: '65',
      height: '163',
      bmi: '24.5',
      bp: '122/80',
      pulse: '74',
      temp: '98.4',
      spo2: '99',
      respRate: '15',
      insuranceType: 'CASH',
      insuranceProvider: 'Self-Pay / Foreign Exchange (AED/USD)',
      policyNumber: 'FOREX-AED-GOP',
      groupNumber: '',
      coveragePct: '0',
      deductible: '0',
      preAuthNumber: 'FRRO-EMBASSY-GOP-88',
      govtSchemeName: '',
      beneficiaryId: '',
      abhaId: '',
      abhaAddress: ''
    });
    setErrors({});
  };

  const handleSimulateAbhaPull = () => {
    setIsAbhaVerified(true);
    setFormData(prev => ({
      ...prev,
      fullName: prev.fullName || 'Sangeetha Krishnan',
      dob: prev.dob || '1974-06-18',
      age: prev.age || '52',
      gender: 'Female',
      phone: prev.phone || '+91 98400 98210',
      aadhaarNumber: prev.aadhaarNumber || '4521 8840 9123',
      address: prev.address || 'Plot 44, Gandhi Road, Tambaram',
      city: prev.city || 'Chennai',
      state: prev.state || 'Tamil Nadu',
      pincode: prev.pincode || '600045',
      abhaId: '91-4820-1928-3819',
      abhaAddress: 'sangeetha.krishnan@abdm'
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Patient full legal name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Contact phone number is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';

    if (patientCategory === 'DOMESTIC') {
      if (!formData.city.trim()) newErrors.city = 'City / Town name is required';
      if (formData.aadhaarNumber && formData.aadhaarNumber.replace(/\s/g, '').length !== 12) {
        newErrors.aadhaarNumber = 'Aadhaar card number must be exactly 12 digits';
      }
      if (formData.insuranceType === 'INSURANCE' && !formData.policyNumber.trim()) {
        newErrors.policyNumber = 'Policy number is required for insurance claims';
      }
      if (formData.insuranceType === 'GOVT_SCHEME' && !formData.beneficiaryId.trim() && !formData.policyNumber.trim()) {
        newErrors.beneficiaryId = 'PM-JAY Golden Card / Beneficiary ID is required';
      }
    } else {
      // Foreign National FRRO Form C Validation
      if (!formData.passportNumber.trim()) newErrors.passportNumber = 'Passport number is required as per FRRO Form C';
      if (!formData.passportExpiry) newErrors.passportExpiry = 'Passport expiry date is required';
      if (!formData.visaNumber.trim()) newErrors.visaNumber = 'Visa number is required under Immigration rules';
      if (!formData.arrivalDate) newErrors.arrivalDate = 'Date of arrival in India is required';
      if (!formData.portOfEntry) newErrors.portOfEntry = 'Port of entry into India is required';
      if (!formData.stayCityInIndia.trim() && !formData.city.trim()) {
        newErrors.city = 'City where patient is staying in India is required';
      }
      if (!formData.stayPlaceName.trim()) {
        newErrors.stayPlaceName = 'Hotel / Hospital ward name where patient is staying is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  const handleSubmit = (startIntake = false) => {
    if (!validate()) return;
    stopCamera();
    const submissionPayload = {
      ...formData,
      patientCategory,
      city: formData.city || formData.stayCityInIndia || 'Chennai'
    };
    const newPatient = registerPatient(submissionPayload);
    onClose();
    if (startIntake && onRegisteredAndStartIntake) {
      onRegisteredAndStartIntake(newPatient);
    }
  };

  return (
    <div className="modal-overlay m3-dialog-backdrop" onClick={handleCloseModal}>
      <div 
        className="modal-content m3-dialog-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 880 }}
      >
        {/* M3 Dialog Header */}
        <div className="m3-dialog-header">
          <div className="m3-dialog-icon">
            {patientCategory === 'FOREIGN' ? (
              <Globe size={22} strokeWidth={2.2} color="#0284c7" />
            ) : (
              <User size={22} strokeWidth={2.2} />
            )}
          </div>
          <div className="m3-dialog-title-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="m3-headline-small" style={{ margin: 0 }}>
                {patientCategory === 'FOREIGN' ? 'International Patient Intake (FRRO Form-C)' : 'New Patient Registration'}
              </h2>
              <span 
                style={{ 
                  fontSize: 10, 
                  fontWeight: 800, 
                  padding: '2px 8px', 
                  borderRadius: 9999,
                  background: patientCategory === 'FOREIGN' ? '#e0f2fe' : '#ecfdf5',
                  color: patientCategory === 'FOREIGN' ? '#0369a1' : '#047857',
                  border: patientCategory === 'FOREIGN' ? '1px solid #bae6fd' : '1px solid #a7f3d0'
                }}
              >
                {patientCategory === 'FOREIGN' ? '🌍 Bureau of Immigration / e-FRRO' : '🇮🇳 ABDM & National ERP'}
              </span>
            </div>
            <p className="m3-body-medium">
              {patientCategory === 'FOREIGN' 
                ? 'Mandatory Foreigners Regional Registration Office (FRRO) Form C reporting for hospital medical tourists.'
                : 'Enter clinical demographics, Aadhaar identity, city address, and insurance to initialize intake.'}
            </p>
          </div>
          <button 
            className="m3-icon-button" 
            onClick={handleCloseModal}
            aria-label="Close registration dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Switcher + 1 Single Demo Button Beside */}
        <div style={{ padding: '10px 18px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)' }}>Patient Category:</span>
            <div style={{ display: 'inline-flex', background: 'var(--bg-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--border-default)' }}>
              <button
                type="button"
                onClick={() => handleCategorySwitch('DOMESTIC')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: patientCategory === 'DOMESTIC' ? 800 : 600,
                  background: patientCategory === 'DOMESTIC' ? 'linear-gradient(135deg, #059669, #047857)' : 'transparent',
                  color: patientCategory === 'DOMESTIC' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: patientCategory === 'DOMESTIC' ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none'
                }}
              >
                <User size={13} />
                <span>🇮🇳 Indian Resident (Normal)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySwitch('FOREIGN')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: patientCategory === 'FOREIGN' ? 800 : 600,
                  background: patientCategory === 'FOREIGN' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  color: patientCategory === 'FOREIGN' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: patientCategory === 'FOREIGN' ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none'
                }}
              >
                <Globe size={13} />
                <span>🌍 Foreign National (FRRO Form-C)</span>
              </button>
            </div>

            {/* Single Demo Button Beside Category Buttons */}
            <button
              type="button"
              className="m3-btn m3-btn-sm"
              onClick={handleFillDemoProfile}
              style={{
                height: 28,
                fontSize: 11,
                padding: '0 12px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                color: '#92400e',
                border: '1.5px solid #f59e0b',
                fontWeight: 800,
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
              title="Populate complete demo patient matching selected category"
            >
              <Zap size={13} color="#d97706" fill="#d97706" />
              <span>Demo Patient</span>
            </button>
          </div>

          {/* ABDM Sync Button */}
          {patientCategory === 'DOMESTIC' && (
            <button
              type="button"
              className="m3-btn m3-btn-sm"
              onClick={handleSimulateAbhaPull}
              style={{
                height: 28,
                fontSize: 10.5,
                padding: '0 10px',
                background: isAbhaVerified ? '#f0fdf4' : 'var(--bg-surface)',
                border: isAbhaVerified ? '1px solid #86efac' : '1px dashed #0284c7',
                color: isAbhaVerified ? '#15803d' : '#0284c7',
                fontWeight: 700
              }}
              title="Simulate pulling demographics from ABDM repository"
            >
              <Award size={12} color={isAbhaVerified ? "#15803d" : "#0284c7"} />
              <span>{isAbhaVerified ? '✓ ABHA Synced' : 'Pull ABHA'}</span>
            </button>
          )}
        </div>

        {/* M3 Dialog Body */}
        <div className="m3-dialog-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>

          {/* Front-Desk Patient Photo Feature (Webcam Capture) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 16px',
            background: 'var(--bg-subtle)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            marginBottom: 16
          }}>
            <div style={{
              width: 78,
              height: 78,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={36} color="var(--text-muted)" />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={15} color="var(--primary)" />
                <span>Front-Desk Patient Photo (Webcam Capture)</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 8px' }}>
                Capture official biometric portrait for UHID registration card and gate pass.
              </p>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {!isCameraActive ? (
                  <>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm"
                      onClick={startCamera}
                      style={{
                        height: 28,
                        fontSize: 11,
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700
                      }}
                    >
                      <Camera size={13} />
                      <span>{formData.photoUrl ? 'Retake Photo' : 'Take Photo (Webcam)'}</span>
                    </button>

                    <label
                      className="m3-btn m3-btn-sm m3-btn-outlined"
                      style={{ height: 28, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Upload size={12} />
                      <span>Upload Picture</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>

                    {formData.photoUrl && (
                      <button
                        type="button"
                        className="m3-btn m3-btn-sm m3-btn-text"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        style={{ height: 28, fontSize: 11, color: '#ef4444' }}
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm"
                      onClick={capturePhoto}
                      style={{
                        height: 28,
                        fontSize: 11,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 800
                      }}
                    >
                      <Camera size={13} />
                      <span>Capture Photo</span>
                    </button>
                    <button
                      type="button"
                      className="m3-btn m3-btn-sm m3-btn-tonal"
                      onClick={stopCamera}
                      style={{ height: 28, fontSize: 11 }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div style={{ fontSize: 10.5, color: '#dc2626', marginTop: 4 }}>{cameraError}</div>
              )}
            </div>
          </div>

          {/* Live Video Viewfinder when Camera is Active */}
          {isCameraActive && (
            <div style={{
              position: 'relative',
              width: 240,
              height: 240,
              margin: '0 auto 16px',
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid var(--primary)',
              background: '#000000',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 20,
                left: 35,
                right: 35,
                bottom: 20,
                border: '2px dashed rgba(255,255,255,0.75)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />
            </div>
          )}
          
          {/* ================================================================= */}
          {/* FORM MODE A: NORMAL / DOMESTIC INDIAN RESIDENT                     */}
          {/* ================================================================= */}
          {patientCategory === 'DOMESTIC' ? (
            <div className="m3-form-section">
              <div className="m3-section-title">
                <span>Patient Demographics & National Identity</span>
              </div>

              {/* Name & Gender */}
              <div className="m3-form-grid m3-grid-2-1">
                <div className="m3-text-field">
                  <label className="m3-field-label">
                    Legal Full Name <span className="m3-required">*</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <User size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="fullName"
                      className={`m3-input ${errors.fullName ? 'm3-input-error' : ''}`}
                      placeholder="e.g. Sangeetha Krishnan"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                      title="Voice dictate patient name"
                    />
                  </div>
                  {errors.fullName && <span className="m3-helper-error">{errors.fullName}</span>}
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Gender</label>
                  <div className="m3-input-wrapper">
                    <select
                      name="gender"
                      className="m3-input m3-select"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DOB, Age, Phone, and Aadhaar Card Field */}
              <div className="m3-form-grid m3-grid-2" style={{ marginTop: 14 }}>
                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Date of Birth <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <Calendar size={16} className="m3-field-leading-icon" />
                      <input
                        type="date"
                        name="dob"
                        className={`m3-input ${errors.dob ? 'm3-input-error' : ''}`}
                        value={formData.dob}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.dob && <span className="m3-helper-error">{errors.dob}</span>}
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Age</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="number"
                        name="age"
                        className="m3-input"
                        placeholder="e.g. 52"
                        value={formData.age}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">
                    Contact Phone <span className="m3-required">*</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <Phone size={16} className="m3-field-leading-icon" />
                    <input
                      type="tel"
                      name="phone"
                      className={`m3-input ${errors.phone ? 'm3-input-error' : ''}`}
                      placeholder="e.g. +91 98400 12345"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/\s+/g, '') }))}
                      title="Voice dictate contact phone"
                    />
                  </div>
                  {errors.phone && <span className="m3-helper-error">{errors.phone}</span>}
                </div>
              </div>

              {/* 🇮🇳 AADHAAR CARD FIELD (Requested Specifically) */}
              <div className="m3-form-grid m3-grid-2" style={{ marginTop: 14 }}>
                <div className="m3-text-field">
                  <label className="m3-field-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={14} color="#059669" />
                      <strong>Aadhaar Card Number (12 Digits)</strong>
                    </span>
                    <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>UIDAI National ID</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <CreditCard size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="aadhaarNumber"
                      maxLength={14}
                      className={`m3-input ${errors.aadhaarNumber ? 'm3-input-error' : ''}`}
                      placeholder="e.g. 4521 8840 9123"
                      value={formData.aadhaarNumber}
                      onChange={handleChange}
                      style={{ paddingRight: 36, letterSpacing: '0.04em', fontWeight: 600 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => {
                        const digits = text.replace(/\D/g, '');
                        setFormData(prev => ({ ...prev, aadhaarNumber: formatAadhaar(digits) }));
                      }}
                      title="Voice dictate Aadhaar card number"
                    />
                  </div>
                  {errors.aadhaarNumber ? (
                    <span className="m3-helper-error">{errors.aadhaarNumber}</span>
                  ) : (
                    <span className="m3-helper-text">12-digit Unique Identification Number (stored securely for ABDM compliance)</span>
                  )}
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Assigned Consultant Doctor</label>
                  <div className="m3-input-wrapper">
                    <Stethoscope size={16} className="m3-field-leading-icon" />
                    <select
                      name="doctorAssigned"
                      className="m3-input m3-select"
                      value={formData.doctorAssigned}
                      onChange={handleChange}
                    >
                      {ONCOLOGISTS.map(doc => (
                        <option key={doc} value={doc}>{doc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Residential Address with SPECIFIC CITY FIELD */}
              <div style={{ marginTop: 16 }}>
                <div className="m3-text-field">
                  <label className="m3-field-label">Street Address / Locality</label>
                  <div className="m3-input-wrapper">
                    <MapPin size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="address"
                      className="m3-input"
                      placeholder="Flat No, House/Building Name, Street, Locality"
                      value={formData.address}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, address: text }))}
                      title="Voice dictate street address"
                    />
                  </div>
                </div>

                {/* City, State, and PIN Code Grid */}
                <div className="m3-form-grid m3-grid-3" style={{ marginTop: 12 }}>
                  {/* SPECIFIC CITY FIELD */}
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      <strong>City / Town</strong> <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <MapPin size={16} className="m3-field-leading-icon" />
                      <input
                        type="text"
                        name="city"
                        className={`m3-input ${errors.city ? 'm3-input-error' : ''}`}
                        placeholder="e.g. Chennai, Mumbai, New Delhi"
                        value={formData.city}
                        onChange={handleChange}
                        style={{ paddingRight: 36, fontWeight: 700 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, city: text }))}
                        title="Voice dictate city"
                      />
                    </div>
                    {errors.city && <span className="m3-helper-error">{errors.city}</span>}
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">State / Province</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="state"
                        className="m3-input"
                        placeholder="e.g. Tamil Nadu, Maharashtra"
                        value={formData.state}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, state: text }))}
                        title="Voice dictate state"
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">PIN / Postal Code</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="pincode"
                        maxLength={6}
                        className="m3-input"
                        placeholder="e.g. 600045"
                        value={formData.pincode}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, pincode: text.replace(/\D/g, '') }))}
                        title="Voice dictate PIN code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="m3-form-grid m3-grid-2" style={{ marginTop: 14 }}>
                <div className="m3-text-field">
                  <label className="m3-field-label">Emergency Contact Name & Relation</label>
                  <div className="m3-input-wrapper">
                    <HeartHandshake size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="emergencyContactName"
                      className="m3-input"
                      placeholder="e.g. Anand Krishnan (Spouse)"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, emergencyContactName: text }))}
                      title="Voice dictate emergency contact"
                    />
                  </div>
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Emergency Phone</label>
                  <div className="m3-input-wrapper">
                    <Phone size={16} className="m3-field-leading-icon" />
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      className="m3-input"
                      placeholder="e.g. +91 98400 54321"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, emergencyContactPhone: text.replace(/\s+/g, '') }))}
                      title="Voice dictate emergency phone"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* FORM MODE B: FOREIGN NATIONAL (FRRO FORM-C IMMIGRATION COMPLIANCE)*/
            /* ================================================================= */
            <div className="m3-form-section">
              {/* Bureau of Immigration FRRO Notice Callout */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)', 
                  border: '1.5px solid #7dd3fc', 
                  borderRadius: 10, 
                  padding: '12px 16px', 
                  marginBottom: 16 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#0284c7" />
                    <strong style={{ fontSize: 13, color: '#0369a1' }}>
                      e-FRRO Form C Mandatory Arrival Report (Hospital & Medical Facility)
                    </strong>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 4 }}>
                    Rule 14 • Registration of Foreigners Act 1939
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.45 }}>
                  Under Ministry of Home Affairs & Bureau of Immigration guidelines, any medical establishment admitting a foreign national or medical tourist must record passport, visa (MED/MED-X), port of entry, date of arrival, and accommodation details within 24 hours of arrival.
                </div>
              </div>

              {/* 1. Basic Demographics & Nationality */}
              <div className="m3-form-grid m3-grid-3">
                <div className="m3-text-field">
                  <label className="m3-field-label">
                    Full Legal Name (as on Passport) <span className="m3-required">*</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <User size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="fullName"
                      className={`m3-input ${errors.fullName ? 'm3-input-error' : ''}`}
                      placeholder="e.g. David Arthur Miller"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                      title="Voice dictate foreign patient name"
                    />
                  </div>
                  {errors.fullName && <span className="m3-helper-error">{errors.fullName}</span>}
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">
                    Nationality / Citizenship <span className="m3-required">*</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <Globe size={16} className="m3-field-leading-icon" />
                    <select
                      name="nationality"
                      className="m3-input m3-select"
                      value={formData.nationality}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, nationality: val, passportCountry: val, comingFromCountry: val, homeCountry: val }));
                      }}
                    >
                      {FOREIGN_COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Gender</label>
                  <div className="m3-input-wrapper">
                    <select
                      name="gender"
                      className="m3-input m3-select"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="m3-form-grid m3-grid-3" style={{ marginTop: 12 }}>
                <div className="m3-text-field">
                  <label className="m3-field-label">
                    Date of Birth <span className="m3-required">*</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <Calendar size={16} className="m3-field-leading-icon" />
                    <input
                      type="date"
                      name="dob"
                      className={`m3-input ${errors.dob ? 'm3-input-error' : ''}`}
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.dob && <span className="m3-helper-error">{errors.dob}</span>}
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Age</label>
                  <div className="m3-input-wrapper">
                    <input
                      type="number"
                      name="age"
                      className="m3-input"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="e.g. 58"
                    />
                  </div>
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">
                    Contact Phone (Indian SIM or Roaming) <span className="m3-required">*</span>
                  </label>
                  <div className="m3-input-wrapper">
                    <Phone size={16} className="m3-field-leading-icon" />
                    <input
                      type="tel"
                      name="phone"
                      className={`m3-input ${errors.phone ? 'm3-input-error' : ''}`}
                      placeholder="e.g. +91 91500 88219"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, phone: text.replace(/\s+/g, '') }))}
                      title="Voice dictate contact phone"
                    />
                  </div>
                  {errors.phone && <span className="m3-helper-error">{errors.phone}</span>}
                </div>
              </div>

              {/* 2. PASSPORT DETAILS (Mandatory under FRRO) */}
              <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={14} color="#0284c7" />
                  <span>Passport Details (FRRO Form-C Requirement)</span>
                </div>

                <div className="m3-form-grid m3-grid-3">
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Passport Number <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="passportNumber"
                        className={`m3-input ${errors.passportNumber ? 'm3-input-error' : ''}`}
                        placeholder="e.g. GBR-9921402"
                        value={formData.passportNumber}
                        onChange={handleChange}
                        style={{ paddingRight: 36, textTransform: 'uppercase', fontWeight: 700 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, passportNumber: text.toUpperCase().replace(/\s/g, '') }))}
                        title="Voice dictate passport number"
                      />
                    </div>
                    {errors.passportNumber && <span className="m3-helper-error">{errors.passportNumber}</span>}
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Country of Passport Issue</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="passportCountry"
                        className="m3-input"
                        placeholder="e.g. United Kingdom"
                        value={formData.passportCountry}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Passport Expiry Date <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="date"
                        name="passportExpiry"
                        className={`m3-input ${errors.passportExpiry ? 'm3-input-error' : ''}`}
                        value={formData.passportExpiry}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.passportExpiry && <span className="m3-helper-error">{errors.passportExpiry}</span>}
                  </div>
                </div>
              </div>

              {/* 3. VISA & IMMIGRATION DETAILS */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCheck size={14} color="#059669" />
                  <span>Visa & Immigration Clearance</span>
                </div>

                <div className="m3-form-grid m3-grid-3">
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Visa Number <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="visaNumber"
                        className={`m3-input ${errors.visaNumber ? 'm3-input-error' : ''}`}
                        placeholder="e.g. V-MED-2026-8812"
                        value={formData.visaNumber}
                        onChange={handleChange}
                        style={{ paddingRight: 36, textTransform: 'uppercase', fontWeight: 700 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, visaNumber: text.toUpperCase().replace(/\s/g, '') }))}
                        title="Voice dictate visa number"
                      />
                    </div>
                    {errors.visaNumber && <span className="m3-helper-error">{errors.visaNumber}</span>}
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Visa Type (FRRO Standard)</label>
                    <div className="m3-input-wrapper">
                      <select
                        name="visaType"
                        className="m3-input m3-select"
                        value={formData.visaType}
                        onChange={handleChange}
                      >
                        <option value="e-Medical">e-Medical Visa (e-Med)</option>
                        <option value="MED">Medical Visa (MED Regular)</option>
                        <option value="MED-X">Medical Attendant Visa (MED-X)</option>
                        <option value="Tourist">Tourist Visa (T - Emergency Care)</option>
                        <option value="Entry">Entry Visa (X-Misc / OCI)</option>
                      </select>
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Visa Valid Till (Expiry)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="date"
                        name="visaExpiry"
                        className="m3-input"
                        value={formData.visaExpiry}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="m3-text-field" style={{ marginTop: 10 }}>
                  <label className="m3-field-label">Place of Issue / Authority</label>
                  <div className="m3-input-wrapper">
                    <input
                      type="text"
                      name="visaPlaceOfIssue"
                      className="m3-input"
                      placeholder="e.g. High Commission of India London / Bureau of Immigration e-Visa Portal"
                      value={formData.visaPlaceOfIssue}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* 4. TRAVEL & ARRIVAL DETAILS (When did he come) */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plane size={14} color="#f59e0b" />
                  <span>Arrival in India & Travel Information (When did he arrive)</span>
                </div>

                <div className="m3-form-grid m3-grid-3">
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Date of Arrival in India <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <Calendar size={16} className="m3-field-leading-icon" />
                      <input
                        type="date"
                        name="arrivalDate"
                        className={`m3-input ${errors.arrivalDate ? 'm3-input-error' : ''}`}
                        value={formData.arrivalDate}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.arrivalDate && <span className="m3-helper-error">{errors.arrivalDate}</span>}
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Port of Entry in India <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <select
                        name="portOfEntry"
                        className={`m3-input m3-select ${errors.portOfEntry ? 'm3-input-error' : ''}`}
                        value={formData.portOfEntry}
                        onChange={handleChange}
                      >
                        {INDIAN_PORTS_OF_ENTRY.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Coming From (Country of Embarkation)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="comingFromCountry"
                        className="m3-input"
                        placeholder="e.g. United Kingdom, UAE"
                        value={formData.comingFromCountry}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-2" style={{ marginTop: 10 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">Expected Date of Departure from India</label>
                    <div className="m3-input-wrapper">
                      <Calendar size={16} className="m3-field-leading-icon" />
                      <input
                        type="date"
                        name="expectedDepartureDate"
                        className="m3-input"
                        value={formData.expectedDepartureDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Assigned Consultant Doctor</label>
                    <div className="m3-input-wrapper">
                      <Stethoscope size={16} className="m3-field-leading-icon" />
                      <select
                        name="doctorAssigned"
                        className="m3-input m3-select"
                        value={formData.doctorAssigned}
                        onChange={handleChange}
                      >
                        {ONCOLOGISTS.map(doc => (
                          <option key={doc} value={doc}>{doc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. LOCAL RESIDENCE / WHERE STAYING IN INDIA (Where is he staying + CITY FIELD) */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hotel size={14} color="#8b5cf6" />
                  <span>Where is Patient Staying in India (Local Residence & City)</span>
                </div>

                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">Accommodation Type</label>
                    <div className="m3-input-wrapper">
                      <select
                        name="stayAccommodationType"
                        className="m3-input m3-select"
                        value={formData.stayAccommodationType}
                        onChange={handleChange}
                      >
                        <option value="Hospital Inpatient Suite">Hospital Inpatient Room / Deluxe Ward</option>
                        <option value="Hospital Guest House">Hospital Guest House / Transit Apartment</option>
                        <option value="Hotel / Serviced Apartment">Hotel / Serviced Apartment</option>
                        <option value="Private Residence">Private / Attendant Residence</option>
                      </select>
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Hotel / Place / Hospital Ward Name <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <Hotel size={16} className="m3-field-leading-icon" />
                      <input
                        type="text"
                        name="stayPlaceName"
                        className={`m3-input ${errors.stayPlaceName ? 'm3-input-error' : ''}`}
                        placeholder="e.g. Hotel ITC Grand Chola Room 514 / Ward Suite 304"
                        value={formData.stayPlaceName}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, stayPlaceName: text }))}
                        title="Voice dictate accommodation name"
                      />
                    </div>
                    {errors.stayPlaceName && <span className="m3-helper-error">{errors.stayPlaceName}</span>}
                  </div>
                </div>

                <div className="m3-text-field" style={{ marginTop: 10 }}>
                  <label className="m3-field-label">Street Address of Stay in India</label>
                  <div className="m3-input-wrapper">
                    <MapPin size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="stayAddressInIndia"
                      className="m3-input"
                      placeholder="e.g. 63 Mount Road, Guindy"
                      value={formData.stayAddressInIndia}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, stayAddressInIndia: text }))}
                      title="Voice dictate stay street address"
                    />
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-3" style={{ marginTop: 10 }}>
                  {/* SPECIFIC CITY FIELD (FOR FRRO STAY) */}
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      <strong>City in India</strong> <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <MapPin size={16} className="m3-field-leading-icon" />
                      <input
                        type="text"
                        name="city"
                        className={`m3-input ${errors.city ? 'm3-input-error' : ''}`}
                        placeholder="e.g. Chennai, Mumbai, New Delhi"
                        value={formData.city}
                        onChange={handleChange}
                        style={{ paddingRight: 36, fontWeight: 700 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, city: text, stayCityInIndia: text }))}
                        title="Voice dictate stay city"
                      />
                    </div>
                    {errors.city && <span className="m3-helper-error">{errors.city}</span>}
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">State in India</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="stayStateInIndia"
                        className="m3-input"
                        value={formData.stayStateInIndia}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">PIN Code in India</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="stayPincodeInIndia"
                        maxLength={6}
                        className="m3-input"
                        placeholder="e.g. 600032"
                        value={formData.stayPincodeInIndia}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. PERMANENT OVERSEAS ADDRESS (HOME COUNTRY) */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} color="#0284c7" />
                  <span>Permanent Address Abroad (Home Country)</span>
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Permanent Address in Home Country</label>
                  <div className="m3-input-wrapper">
                    <input
                      type="text"
                      name="permanentAddressAbroad"
                      className="m3-input"
                      placeholder="e.g. 14 Knightsbridge Mews, Kensington, London SW7 1RB, UK"
                      value={formData.permanentAddressAbroad}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, permanentAddressAbroad: text }))}
                      title="Voice dictate permanent address"
                    />
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-2" style={{ marginTop: 10 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">Home City & Country</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="homeCountryCity"
                        className="m3-input"
                        placeholder="e.g. London, United Kingdom"
                        value={formData.homeCountryCity}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Overseas Emergency Contact Name & Phone</label>
                    <div className="m3-input-wrapper">
                      <HeartHandshake size={16} className="m3-field-leading-icon" />
                      <input
                        type="text"
                        name="overseasEmergencyContact"
                        className="m3-input"
                        placeholder="e.g. Eleanor Miller (Spouse) +44 20 7946 0882"
                        value={formData.overseasEmergencyContact}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, overseasEmergencyContact: text }))}
                        title="Voice dictate overseas emergency contact"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}



          {/* ================================================================= */}
          {/* SECTION: PATIENT REFERRAL SOURCING (OPTIONAL)                     */}
          {/* ================================================================= */}
          <div className="m3-form-section" style={{ marginTop: 22 }}>
            <div className="m3-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={16} color="var(--primary)" />
              <span>Referral Sourcing (Optional)</span>
            </div>

            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-subtle)',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              marginBottom: 4
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                Capture details of who referred the patient to our hospital (doctor, clinic, hospital, or relative) and their contact number.
              </p>

              <div className="m3-form-grid m3-grid-2">
                <div className="m3-text-field">
                  <label className="m3-field-label">Reference / Referred By (Optional)</label>
                  <div className="m3-input-wrapper">
                    <User size={16} className="m3-field-leading-icon" />
                    <input
                      type="text"
                      name="referredBy"
                      className="m3-input"
                      placeholder="e.g. Dr. M. S. Rao / Apollo Clinic / Relative"
                      value={formData.referredBy || ''}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, referredBy: text }))}
                      title="Voice dictate referrer name"
                    />
                  </div>
                </div>

                <div className="m3-text-field">
                  <label className="m3-field-label">Number Of Reference's / Referrer Phone (Optional)</label>
                  <div className="m3-input-wrapper">
                    <Phone size={16} className="m3-field-leading-icon" />
                    <input
                      type="tel"
                      name="referrerContact"
                      className="m3-input"
                      placeholder="e.g. +91 98410 88210"
                      value={formData.referrerContact || ''}
                      onChange={handleChange}
                      style={{ paddingRight: 36 }}
                    />
                    <SpeechMicButton 
                      onTranscript={(text) => setFormData(prev => ({ ...prev, referrerContact: text }))}
                      title="Voice dictate referrer phone"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION: HEALTH INSURANCE & BILLING COVERAGE                      */}
          {/* ================================================================= */}
          <div className="m3-form-section" style={{ marginTop: 24 }}>
            <div className="m3-section-title">
              <span>{patientCategory === 'FOREIGN' ? 'Medical Tourism Billing & Forex Insurance' : 'Billing & Health Coverage'}</span>
            </div>

            {/* M3 Segmented Button */}
            <div className="m3-segmented-control" style={{ display: 'grid', gridTemplateColumns: patientCategory === 'FOREIGN' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
              <button
                type="button"
                className={`m3-segment-btn ${formData.insuranceType === 'INSURANCE' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, insuranceType: 'INSURANCE' }))}
              >
                <Shield size={16} />
                <span>{patientCategory === 'FOREIGN' ? 'International Travel TPA / BUPA' : 'Health Insurance / TPA'}</span>
                {formData.insuranceType === 'INSURANCE' && <Check size={14} className="m3-segment-check" />}
              </button>

              {patientCategory === 'DOMESTIC' && (
                <button
                  type="button"
                  className={`m3-segment-btn ${formData.insuranceType === 'GOVT_SCHEME' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, insuranceType: 'GOVT_SCHEME', coveragePct: '100', deductible: '0' }))}
                >
                  <Landmark size={16} />
                  <span>Govt Scheme / PM-JAY</span>
                  {formData.insuranceType === 'GOVT_SCHEME' && <Check size={14} className="m3-segment-check" />}
                </button>
              )}

              <button
                type="button"
                className={`m3-segment-btn ${formData.insuranceType === 'CASH' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, insuranceType: 'CASH' }))}
              >
                <CreditCard size={16} />
                <span>{patientCategory === 'FOREIGN' ? 'Forex Currency / Self-Pay Cash' : 'Direct Cash / Self-Pay'}</span>
                {formData.insuranceType === 'CASH' && <Check size={14} className="m3-segment-check" />}
              </button>
            </div>

            {/* Option A: Government Schemes & ABHA (Domestic only) */}
            {formData.insuranceType === 'GOVT_SCHEME' && patientCategory === 'DOMESTIC' && (
              <div className="m3-animate-slide-down" style={{ marginTop: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14
                }}>
                  <Award size={18} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Ayushman Bharat & Govt Scheme Cashless Billing:</strong> Eligible clinical treatment, diagnostics, and essential medications are 100% cashless under NHA government packages with ₹0 patient deductible.
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">Government Healthcare Scheme</label>
                    <div className="m3-input-wrapper">
                      <Landmark size={16} className="m3-field-leading-icon" />
                      <select
                        name="govtSchemeName"
                        className="m3-input m3-select"
                        value={formData.govtSchemeName}
                        onChange={handleChange}
                      >
                        {GOVT_SCHEMES.map(scheme => (
                          <option key={scheme} value={scheme}>{scheme}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      Beneficiary / Golden Card ID <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="beneficiaryId"
                        className={`m3-input ${errors.beneficiaryId ? 'm3-input-error' : ''}`}
                        placeholder="e.g. PMJAY-TN-9821034 / CGHS ID"
                        value={formData.beneficiaryId}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, beneficiaryId: text }))}
                        title="Voice dictate beneficiary ID"
                      />
                    </div>
                    {errors.beneficiaryId && <span className="m3-helper-error">{errors.beneficiaryId}</span>}
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-2" style={{ marginTop: 14 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">14-Digit ABHA ID (Ayushman Bharat)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaId"
                        className="m3-input"
                        placeholder="e.g. 91-4820-1928-3819"
                        value={formData.abhaId}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaId: text }))}
                        title="Voice dictate ABHA ID"
                      />
                    </div>
                    <span className="m3-helper-text">Ayushman Bharat Health Account ID for ABDM records</span>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">ABHA Address (@abdm)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="abhaAddress"
                        className="m3-input"
                        placeholder="e.g. sangeetha.krishnan@abdm"
                        value={formData.abhaAddress}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, abhaAddress: text }))}
                        title="Voice dictate ABHA address"
                      />
                    </div>
                    <span className="m3-helper-text">ABDM digital consent & record repository address</span>
                  </div>
                </div>
              </div>
            )}

            {/* Option B: Health Insurance / TPA (Domestic or Foreign) */}
            {formData.insuranceType === 'INSURANCE' && (
              <div className="m3-animate-slide-down" style={{ marginTop: 16 }}>
                <div className="m3-form-grid m3-grid-2">
                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      {patientCategory === 'FOREIGN' ? 'International Insurer / TPA' : 'Insurance Provider'}
                    </label>
                    <div className="m3-input-wrapper">
                      <Building2 size={16} className="m3-field-leading-icon" />
                      {patientCategory === 'FOREIGN' ? (
                        <input
                          type="text"
                          name="insuranceProvider"
                          className="m3-input"
                          placeholder="e.g. BUPA Global, Cigna Global, Allianz Worldwide"
                          value={formData.insuranceProvider}
                          onChange={handleChange}
                        />
                      ) : (
                        <select
                          name="insuranceProvider"
                          className="m3-input m3-select"
                          value={formData.insuranceProvider}
                          onChange={handleChange}
                        >
                          {COMMON_INSURERS.filter(i => i !== 'Self-Pay / Cash').map(ins => (
                            <option key={ins} value={ins}>{ins}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">
                      {patientCategory === 'FOREIGN' ? 'Policy / Guarantee of Payment (GOP) Ref' : 'Policy Number'} <span className="m3-required">*</span>
                    </label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="policyNumber"
                        className={`m3-input ${errors.policyNumber ? 'm3-input-error' : ''}`}
                        placeholder={patientCategory === 'FOREIGN' ? "e.g. BUPA-INT-992140 / GOP-REF-88" : "e.g. SH-2026-99120"}
                        value={formData.policyNumber}
                        onChange={handleChange}
                        style={{ paddingRight: 36 }}
                      />
                      <SpeechMicButton 
                        onTranscript={(text) => setFormData(prev => ({ ...prev, policyNumber: text }))}
                        title="Voice dictate policy number"
                      />
                    </div>
                    {errors.policyNumber && <span className="m3-helper-error">{errors.policyNumber}</span>}
                  </div>
                </div>

                <div className="m3-form-grid m3-grid-3" style={{ marginTop: 14 }}>
                  <div className="m3-text-field">
                    <label className="m3-field-label">Group / Corporate Ref</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="text"
                        name="groupNumber"
                        className="m3-input"
                        placeholder="e.g. GRP-4022"
                        value={formData.groupNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">Coverage Tier (%)</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="number"
                        name="coveragePct"
                        className="m3-input"
                        value={formData.coveragePct}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="m3-text-field">
                    <label className="m3-field-label">{patientCategory === 'FOREIGN' ? 'Deductible (USD/INR)' : 'Deductible (₹)'}</label>
                    <div className="m3-input-wrapper">
                      <input
                        type="number"
                        name="deductible"
                        className="m3-input"
                        value={formData.deductible}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Option C: Cash / Self-Pay */}
            {formData.insuranceType === 'CASH' && (
              <div className="m3-animate-slide-down" style={{ marginTop: 16 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '12px',
                  marginBottom: 14
                }}>
                  <strong>{patientCategory === 'FOREIGN' ? 'International Self-Pay / Forex Cash Settlement:' : 'Direct Hospital Payment:'}</strong> {patientCategory === 'FOREIGN' ? 'Charges will be invoiced under international tariff. Multi-currency settlement (USD/EUR/GBP/AED/INR) supported at billing.' : 'Patient will settle charges directly at the cashier desk. Hospital standard OPD price list applies.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* M3 Dialog Actions */}
        <div className="m3-dialog-actions">
          <button 
            type="button"
            className="m3-btn m3-btn-text" 
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button"
              className="m3-btn m3-btn-outlined" 
              onClick={() => handleSubmit(false)}
            >
              Save Record Only
            </button>
            <button 
              type="button"
              className="m3-btn m3-btn-filled" 
              onClick={() => handleSubmit(true)}
              data-tour="register-submit-btn"
              style={{
                background: patientCategory === 'FOREIGN' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : undefined
              }}
            >
              <ClipboardList size={16} />
              <span>{patientCategory === 'FOREIGN' ? 'Register & Issue Token (Form-C)' : 'Register & Print OPD Token Slip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
