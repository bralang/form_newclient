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
    maritalStatus.addEventListener('change', function() {
        saveFormData();
    });

    // Has children checkbox
    const hasChildren = document.getElementById('hasChildren');
    hasChildren.addEventListener('change', function() {
        document.getElementById('childrenSection').style.display = 
            this.checked ? 'block' : 'none';
        saveFormData();
    });

    // Has business checkbox
    const hasBusiness = document.getElementById('hasBusiness');
    hasBusiness.addEventListener('change', function() {
        document.getElementById('businessSection').style.display = 
            this.checked ? 'block' : 'none';
        saveFormData();
    });

    // Save form data on input change
    const form = document.getElementById('clientForm');
    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);
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

    // Check service purposes in step 2
    if (currentStep === 2) {
        const purposes = document.querySelectorAll('input[name="purposes"]:checked');
        if (purposes.length === 0) {
            alert('נא לבחור לפחות סוג שירות אחד');
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
    const formData = new FormData(form);
    const data = {};

    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key === 'purposes') {
            if (!data.purposes) data.purposes = [];
            data.purposes.push(value);
        } else {
            data[key] = value;
        }
    }

    // Add checkboxes
    data.hasChildren = document.getElementById('hasChildren').checked;
    data.preferPhone = document.getElementById('preferPhone').checked;
    data.hasBusiness = document.getElementById('hasBusiness').checked;
    data.agreeNotifications = document.getElementById('agreeNotifications')?.checked;

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
    const data = collectFormData();
    sessionStorage.setItem('formData', JSON.stringify(data));
    sessionStorage.setItem('currentStep', currentStep);
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

        // Handle special checkboxes
        if (data.hasChildren) {
            document.getElementById('hasChildren').checked = true;
            document.getElementById('childrenSection').style.display = 'block';
        }
        if (data.hasBusiness) {
            document.getElementById('hasBusiness').checked = true;
            document.getElementById('businessSection').style.display = 'block';
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