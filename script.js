// Webhook URLs
const WEBHOOKS = {
    step1: 'https://n8n.chasida.biz/webhook/client-intake-step1',
    step2: 'https://n8n.chasida.biz/webhook/client-intake-step2',
    step3: 'https://n8n.chasida.biz/webhook/client-intake-final'
};

let currentStep = 1;
const totalSteps = 3;

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    loadFormData();
    updateUI();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Marital status change
    const maritalStatus = document.querySelector('[name="maritalStatus"]');
    if (maritalStatus) {
        maritalStatus.addEventListener('change', function() {
            togglePartnerSection();
            saveFormData();
        });
    }

    // Has children checkbox
    const hasChildren = document.getElementById('hasChildren');
    if (hasChildren) {
        hasChildren.addEventListener('change', function() {
            const childrenSection = document.getElementById('childrenSection');
            if (childrenSection) {
                childrenSection.style.display = this.checked ? 'block' : 'none';
            }
            saveFormData();
        });
    }

    // Additional ID method
    const idMethod = document.querySelector('[name="additionalIdMethod"]');
    if (idMethod) {
        idMethod.addEventListener('change', function() {
            toggleAdditionalIdFields('client');
            saveFormData();
        });
    }

    // Partner additional ID method
    const partnerIdMethod = document.querySelector('[name="partnerAdditionalIdMethod"]');
    if (partnerIdMethod) {
        partnerIdMethod.addEventListener('change', function() {
            toggleAdditionalIdFields('partner');
            saveFormData();
        });
    }

    // Service purpose
    const servicePurpose = document.querySelectorAll('[name="servicePurpose"]');
    if (servicePurpose.length > 0) {
        servicePurpose.forEach(radio => {
            radio.addEventListener('change', function() {
                toggleBusinessSection();
                saveFormData();
            });
        });
    }

    // Partner employment status
    const partnerEmployment = document.querySelectorAll('[name="partnerEmployment"]');
    if (partnerEmployment.length > 0) {
        partnerEmployment.forEach(radio => {
            radio.addEventListener('change', function() {
                togglePartnerBusinessSection();
                saveFormData();
            });
        });
    }

    // Business location
    const businessAtHome = document.querySelector('[name="businessAtHome"]');
    if (businessAtHome) {
        businessAtHome.addEventListener('change', function() {
            toggleBusinessLocation();
            saveFormData();
        });
    }

    // Partner business location
    const partnerBusinessAtHome = document.querySelector('[name="partnerBusinessAtHome"]');
    if (partnerBusinessAtHome) {
        partnerBusinessAtHome.addEventListener('change', function() {
            togglePartnerBusinessLocation();
            saveFormData();
        });
    }

    // Document method
    const docMethod = document.querySelector('[name="documentMethod"]');
    if (docMethod) {
        docMethod.addEventListener('change', function() {
            toggleDocumentMethodFields();
            saveFormData();
        });
    }

    // Partner document method
    const partnerDocMethod = document.querySelector('[name="partnerDocumentMethod"]');
    if (partnerDocMethod) {
        partnerDocMethod.addEventListener('change', function() {
            togglePartnerDocumentMethodFields();
            saveFormData();
        });
    }

    // New business fields
    const isNewBusiness = document.querySelector('[name="isNewBusiness"]');
    if (isNewBusiness) {
        isNewBusiness.addEventListener('change', function() {
            toggleNewBusinessFields();
            saveFormData();
        });
    }

    // Partner new business fields
    const partnerIsNewBusiness = document.querySelector('[name="partnerIsNewBusiness"]');
    if (partnerIsNewBusiness) {
        partnerIsNewBusiness.addEventListener('change', function() {
            togglePartnerNewBusinessFields();
            saveFormData();
        });
    }

    // Save form data on input change
    const form = document.getElementById('clientForm');
    if (form) {
        form.addEventListener('input', saveFormData);
        form.addEventListener('change', saveFormData);
    }
}

// Toggle partner section
function togglePartnerSection() {
    const maritalStatusElement = document.querySelector('[name="maritalStatus"]');
    if (!maritalStatusElement) return;
    
    const maritalStatus = maritalStatusElement.value;
    const partnerSection = document.getElementById('partnerSection');
    const partnerContactSection = document.getElementById('partnerContactSection');
    const partnerIdSection = document.getElementById('partnerIdSection');
    const partnerEmploymentSection = document.getElementById('partnerEmploymentSection');
    
    if (maritalStatus === 'partner') {
        if (partnerSection) partnerSection.style.display = 'block';
        if (partnerContactSection) partnerContactSection.style.display = 'block';
        if (partnerIdSection) partnerIdSection.style.display = 'block';
        if (partnerEmploymentSection) partnerEmploymentSection.style.display = 'block';
    } else {
        if (partnerSection) partnerSection.style.display = 'none';
        if (partnerContactSection) partnerContactSection.style.display = 'none';
        if (partnerIdSection) partnerIdSection.style.display = 'none';
        if (partnerEmploymentSection) partnerEmploymentSection.style.display = 'none';
    }
}

// Toggle additional ID fields
function toggleAdditionalIdFields(type) {
    const prefix = type === 'partner' ? 'partner' : '';
    const selectName = type === 'partner' ? 'partnerAdditionalIdMethod' : 'additionalIdMethod';
    const methodElement = document.querySelector(`[name="${selectName}"]`);
    if (!methodElement) return;
    
    const method = methodElement.value;
    const parentId = document.getElementById(`${prefix}ParentIdSection`);
    const license = document.getElementById(`${prefix}LicenseSection`);
    const passport = document.getElementById(`${prefix}PassportSection`);
    
    if (parentId) parentId.style.display = 'none';
    if (license) license.style.display = 'none';
    if (passport) passport.style.display = 'none';
    
    if (method === 'parentId' && parentId) parentId.style.display = 'block';
    if (method === 'license' && license) license.style.display = 'block';
    if (method === 'passport' && passport) passport.style.display = 'block';
}

// Toggle business section
function toggleBusinessSection() {
    const purpose = document.querySelector('[name="servicePurpose"]:checked')?.value;
    const businessSection = document.getElementById('businessDetailsSection');
    
    if (businessSection) {
        if (purpose === 'existingBusiness' || purpose === 'newBusiness' || purpose === 'shareholder') {
            businessSection.style.display = 'block';
        } else {
            businessSection.style.display = 'none';
        }
    }
}

// Toggle partner business section
function togglePartnerBusinessSection() {
    const employment = document.querySelector('[name="partnerEmployment"]:checked')?.value;
    const partnerBusinessSection = document.getElementById('partnerBusinessDetailsSection');
    
    if (partnerBusinessSection) {
        if (employment === 'businessOwner' || employment === 'openingBusiness' || employment === 'shareholder') {
            partnerBusinessSection.style.display = 'block';
        } else {
            partnerBusinessSection.style.display = 'none';
        }
    }
}

// Toggle business location
function toggleBusinessLocation() {
    const atHome = document.querySelector('[name="businessAtHome"]:checked')?.value;
    const locationSection = document.getElementById('businessLocationSection');
    
    if (locationSection) {
        locationSection.style.display = atHome === 'no' ? 'block' : 'none';
    }
}

// Toggle partner business location
function togglePartnerBusinessLocation() {
    const atHome = document.querySelector('[name="partnerBusinessAtHome"]:checked')?.value;
    const locationSection = document.getElementById('partnerBusinessLocationSection');
    
    if (locationSection) {
        locationSection.style.display = atHome === 'no' ? 'block' : 'none';
    }
}

// Toggle document method fields
function toggleDocumentMethodFields() {
    const method = document.querySelector('[name="documentMethod"]:checked')?.value;
    const otherSoftwareSection = document.getElementById('otherSoftwareSection');
    
    if (otherSoftwareSection) {
        otherSoftwareSection.style.display = method === 'other' ? 'block' : 'none';
    }
}

// Toggle partner document method fields
function togglePartnerDocumentMethodFields() {
    const method = document.querySelector('[name="partnerDocumentMethod"]:checked')?.value;
    const partnerOtherSoftwareSection = document.getElementById('partnerOtherSoftwareSection');
    
    if (partnerOtherSoftwareSection) {
        partnerOtherSoftwareSection.style.display = method === 'other' ? 'block' : 'none';
    }
}

// Toggle new business fields
function toggleNewBusinessFields() {
    const isNew = document.querySelector('[name="isNewBusiness"]:checked')?.value;
    const newBusinessSection = document.getElementById('newBusinessFieldsSection');
    
    if (newBusinessSection) {
        newBusinessSection.style.display = isNew === 'yes' ? 'block' : 'none';
    }
}

// Toggle partner new business fields
function togglePartnerNewBusinessFields() {
    const isNew = document.querySelector('[name="partnerIsNewBusiness"]:checked')?.value;
    const partnerNewBusinessSection = document.getElementById('partnerNewBusinessFieldsSection');
    
    if (partnerNewBusinessSection) {
        partnerNewBusinessSection.style.display = isNew === 'yes' ? 'block' : 'none';
    }
}

// Update UI based on current step
function updateUI() {
    // Update step indicators
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNum = index + 1;
        item.classList.remove('active', 'completed');
        
        if (stepNum === currentStep) {
            item.classList.add('active');
        } else if (stepNum < currentStep) {
            item.classList.add('completed');
            item.querySelector('.step-circle').innerHTML = '✓';
        } else {
            item.querySelector('.step-circle').innerHTML = stepNum;
        }
    });

    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, index) => {
        if (index + 1 < currentStep) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });

    // Show/hide form steps
    document.querySelectorAll('.form-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.style.display = currentStep === 1 ? 'none' : 'flex';
    
    if (currentStep === totalSteps) {
        nextBtn.innerHTML = 'שלח שאלון <span>→</span>';
    } else {
        nextBtn.innerHTML = 'המשך <span>→</span>';
    }
}

// Navigate to next step
async function nextStep() {
    const form = document.getElementById('clientForm');
    
    // Validate current step
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
    
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value && !input.disabled) {
            isValid = false;
            input.style.borderColor = '#ef4444';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 2000);
        }
    });

    if (!isValid) {
        alert('נא למלא את כל השדות המסומנים בכוכבית (*)');
        return;
    }

    // Check service purpose in step 2
    if (currentStep === 2) {
        const purpose = document.querySelector('input[name="servicePurpose"]:checked');
        if (!purpose) {
            alert('נא לבחור למה ניגשת לקבל שירות');
            return;
        }
    }

    // Show loading
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.classList.add('loading');
    nextBtn.disabled = true;

    try {
        // Send data to webhook
        const formData = collectFormData();
        await sendToWebhook(currentStep, formData);

        // If last step, show success message
        if (currentStep === totalSteps) {
            document.getElementById('formNav').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        } else {
            // Move to next step
            currentStep++;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error sending data:', error);
        alert('אירעה שגיאה בשליחת הנתונים. אנא נסה שנית.');
    } finally {
        nextBtn.classList.remove('loading');
        nextBtn.disabled = false;
    }
}

// Navigate to previous step
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Collect form data
function collectFormData() {
    const form = document.getElementById('clientForm');
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};

    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Add checkboxes with null checks
    const hasChildren = document.getElementById('hasChildren');
    const preferSMS = document.getElementById('preferSMS');
    const agreeNotifications = document.getElementById('agreeNotifications');
    
    data.hasChildren = hasChildren ? hasChildren.checked : false;
    data.preferSMS = preferSMS ? preferSMS.checked : false;
    data.agreeNotifications = agreeNotifications ? agreeNotifications.checked : false;

    return data;
}

// Send data to webhook
async function sendToWebhook(step, data) {
    const webhookUrl = WEBHOOKS[`step${step}`];
    
    // Organize data by step
    let stepData = {};
    
    if (step === 1) {
        stepData = {
            personalInfo: {
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                idNumber: data.idNumber,
                birthDate: data.birthDate,
                maritalStatus: data.maritalStatus,
                hasChildren: data.hasChildren,
                numberOfChildren: data.numberOfChildren || null
            },
            contactInfo: {
                phone: data.phone,
                email: data.email,
                preferPhone: data.preferPhone
            },
            identificationInfo: {}
        };
    } else if (step === 2) {
        stepData = {
            serviceType: {
                purposes: data.purposes || []
            },
            businessInfo: {
                hasBusiness: data.hasBusiness,
                businessName: data.businessName || null,
                businessField: data.businessField || null,
                businessType: data.businessType || null,
                businessAddress: data.businessAddress || null
            }
        };
    } else if (step === 3) {
        stepData = {
            financialInfo: {
                wealthDeclaration: data.wealthDeclaration || null,
                bankName: data.bankName || null,
                branchNumber: data.branchNumber || null,
                accountNumber: data.accountNumber || null,
                accountHolder: data.accountHolder || null
            },
            feedbackInfo: {
                agreeNotifications: data.agreeNotifications,
                feedback: data.feedback || null
            }
        };
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(stepData)
    });

    if (!response.ok) {
        throw new Error('Webhook request failed');
    }

    return response;
}

// Save form data to sessionStorage
function saveFormData() {
    try {
        const data = collectFormData();
        sessionStorage.setItem('formData', JSON.stringify(data));
        sessionStorage.setItem('currentStep', currentStep);
    } catch (error) {
        console.error('Error saving form data:', error);
    }
}

// Load form data from sessionStorage
function loadFormData() {
    const savedData = sessionStorage.getItem('formData');
    const savedStep = sessionStorage.getItem('currentStep');
    
    if (savedStep) {
        currentStep = parseInt(savedStep);
    }
    
    if (savedData) {
        const data = JSON.parse(savedData);
        const form = document.getElementById('clientForm');
        
        if (!form) return;
        
        // Fill form fields
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = data[key];
                } else if (input.type === 'file') {
                    // Skip file inputs
                } else {
                    input.value = data[key];
                }
            }
        });

        // Handle special checkboxes with null checks
        if (data.hasChildren) {
            const hasChildrenEl = document.getElementById('hasChildren');
            const childrenSectionEl = document.getElementById('childrenSection');
            if (hasChildrenEl) hasChildrenEl.checked = true;
            if (childrenSectionEl) childrenSectionEl.style.display = 'block';
        }
        if (data.hasBusiness) {
            const hasBusinessEl = document.getElementById('hasBusiness');
            const businessSectionEl = document.getElementById('businessSection');
            if (hasBusinessEl) hasBusinessEl.checked = true;
            if (businessSectionEl) businessSectionEl.style.display = 'block';
        }

        // Handle purposes (multiple checkboxes)
        if (data.purposes && Array.isArray(data.purposes)) {
            data.purposes.forEach(purpose => {
                const checkbox = document.getElementById(purpose);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

// Reset form
function resetForm() {
    sessionStorage.clear();
    location.reload();
}