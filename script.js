const WEBHOOKS = {
    step1: 'https://n8n.chasida.biz/webhook/client-intake-step1',
    step2: 'https://n8n.chasida.biz/webhook/client-intake-step2',
    final: 'https://n8n.chasida.biz/webhook/client-intake-final'
};

let currentStep = 1;
const totalSteps = 3;

document.addEventListener('DOMContentLoaded', function() {
    loadFormData();
    updateUI();
    setupEventListeners();
});

function setupEventListeners() {
    const form = document.getElementById('clientForm');
    if (!form) return;

    const maritalStatus = document.getElementById('maritalStatus');
    if (maritalStatus) {
        maritalStatus.addEventListener('change', function() {
            togglePartnerSections(this.value);
            saveFormData();
        });
    }

    const hasChildren = document.getElementById('hasChildren');
    if (hasChildren) {
        hasChildren.addEventListener('change', function() {
            const section = document.getElementById('childrenSection');
            if (section) section.style.display = this.checked ? 'block' : 'none';
            saveFormData();
        });
    }

    const additionalIdMethod = document.getElementById('additionalIdMethod');
    if (additionalIdMethod) {
        additionalIdMethod.addEventListener('change', function() {
            toggleAdditionalIdFields(this.value, false);
            saveFormData();
        });
    }

    const partnerAdditionalIdMethod = document.getElementById('partnerAdditionalIdMethod');
    if (partnerAdditionalIdMethod) {
        partnerAdditionalIdMethod.addEventListener('change', function() {
            toggleAdditionalIdFields(this.value, true);
            saveFormData();
        });
    }

    const servicePurpose = document.querySelectorAll('input[name="servicePurpose"]');
    servicePurpose.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleBusinessSection(this.value);
            saveFormData();
        });
    });

    const partnerEmployment = document.querySelectorAll('input[name="partnerEmployment"]');
    partnerEmployment.forEach(radio => {
        radio.addEventListener('change', function() {
            togglePartnerBusinessSection(this.value);
            saveFormData();
        });
    });

    const businessAtHome = document.querySelectorAll('input[name="businessAtHome"]');
    businessAtHome.forEach(radio => {
        radio.addEventListener('change', function() {
            const section = document.getElementById('businessLocationSection');
            if (section) section.style.display = this.value === 'no' ? 'block' : 'none';
            saveFormData();
        });
    });

    const partnerBusinessAtHome = document.querySelectorAll('input[name="partnerBusinessAtHome"]');
    partnerBusinessAtHome.forEach(radio => {
        radio.addEventListener('change', function() {
            const section = document.getElementById('partnerBusinessLocationSection');
            if (section) section.style.display = this.value === 'no' ? 'block' : 'none';
            saveFormData();
        });
    });

    const documentMethod = document.querySelectorAll('input[name="documentMethod"]');
    documentMethod.forEach(radio => {
        radio.addEventListener('change', function() {
            const section = document.getElementById('otherSoftwareSection');
            if (section) section.style.display = this.value === 'other' ? 'block' : 'none';
            saveFormData();
        });
    });

    const partnerDocumentMethod = document.querySelectorAll('input[name="partnerDocumentMethod"]');
    partnerDocumentMethod.forEach(radio => {
        radio.addEventListener('change', function() {
            const section = document.getElementById('partnerOtherSoftwareSection');
            if (section) section.style.display = this.value === 'other' ? 'block' : 'none';
            saveFormData();
        });
    });

    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);
}

function togglePartnerSections(maritalStatus) {
    const sections = ['partnerSection', 'partnerContactSection', 'partnerIdSection', 'partnerEmploymentSection'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.style.display = maritalStatus === 'partner' ? 'block' : 'none';
    });
}

function toggleAdditionalIdFields(method, isPartner) {
    const prefix = isPartner ? 'partner' : '';
    const sections = {
        parentId: prefix + 'ParentIdSection',
        license: prefix + 'LicenseSection',
        passport: prefix + 'PassportSection'
    };

    Object.keys(sections).forEach(key => {
        const section = document.getElementById(sections[key]);
        if (section) section.style.display = key === method ? 'block' : 'none';
    });
}

function toggleBusinessSection(purpose) {
    const section = document.getElementById('businessDetailsSection');
    const newBusinessSection = document.getElementById('newBusinessFieldsSection');
    
    if (section) {
        const showBusiness = ['newBusiness', 'existingBusiness', 'shareholder'].includes(purpose);
        section.style.display = showBusiness ? 'block' : 'none';
    }

    if (newBusinessSection) {
        newBusinessSection.style.display = purpose === 'newBusiness' ? 'block' : 'none';
    }
}

function togglePartnerBusinessSection(employment) {
    const section = document.getElementById('partnerBusinessDetailsSection');
    const newBusinessSection = document.getElementById('partnerNewBusinessFieldsSection');
    
    if (section) {
        const showBusiness = ['businessOwner', 'openingBusiness', 'shareholder'].includes(employment);
        section.style.display = showBusiness ? 'block' : 'none';
    }

    if (newBusinessSection) {
        newBusinessSection.style.display = employment === 'openingBusiness' ? 'block' : 'none';
    }
}

function updateUI() {
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNum = index + 1;
        item.classList.remove('active', 'completed');
        
        const circle = item.querySelector('.step-circle');
        if (!circle) return;
        
        if (stepNum === currentStep) {
            item.classList.add('active');
            circle.textContent = stepNum;
        } else if (stepNum < currentStep) {
            item.classList.add('completed');
            circle.textContent = '✓';
        } else {
            circle.textContent = stepNum;
        }
    });

    document.querySelectorAll('.step-line').forEach((line, index) => {
        if (index + 1 < currentStep) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });

    document.querySelectorAll('.form-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index + 1 === currentStep) step.classList.add('active');
    });

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.style.display = currentStep === 1 ? 'none' : 'flex';
    if (nextBtn) nextBtn.textContent = currentStep === totalSteps ? 'שלח שאלון →' : 'המשך →';
}

async function nextStep() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (!currentStepElement) return;

    const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value && !input.disabled && input.offsetParent !== null) {
            isValid = false;
            input.style.borderColor = '#ef4444';
            setTimeout(() => input.style.borderColor = '', 2000);
        }
    });

    if (!isValid) {
        alert('נא למלא את כל השדות המסומנים בכוכבית (*)');
        return;
    }

    if (currentStep === 2) {
        const purpose = document.querySelector('input[name="servicePurpose"]:checked');
        if (!purpose) {
            alert('נא לבחור למה ניגשת לקבל שירות');
            return;
        }
    }

    const nextBtn = document.getElementById('nextBtn');
    if (!nextBtn) return;

    nextBtn.classList.add('loading');
    nextBtn.disabled = true;

    try {
        const formData = collectFormData();
        await sendToWebhook(currentStep, formData);

        if (currentStep === totalSteps) {
            const formNav = document.getElementById('formNav');
            const successMessage = document.getElementById('successMessage');
            if (formNav) formNav.style.display = 'none';
            if (successMessage) successMessage.style.display = 'block';
            sessionStorage.clear();
        } else {
            currentStep++;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error:', error);
        alert('אירעה שגיאה בשליחת הנתונים. אנא נסה שנית.');
    } finally {
        nextBtn.classList.remove('loading');
        nextBtn.disabled = false;
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function collectFormData() {
    const form = document.getElementById('clientForm');
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    const hasChildren = document.getElementById('hasChildren');
    const preferSMS = document.getElementById('preferSMS');
    const agreeNotifications = document.getElementById('agreeNotifications');

    if (hasChildren) data.hasChildren = hasChildren.checked;
    if (preferSMS) data.preferSMS = preferSMS.checked;
    if (agreeNotifications) data.agreeNotifications = agreeNotifications.checked;

    return data;
}

async function sendToWebhook(step, data) {
    const webhookUrl = step === 3 ? WEBHOOKS.final : WEBHOOKS[`step${step}`];
    
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Webhook request failed');
    return response;
}

function saveFormData() {
    try {
        const data = collectFormData();
        sessionStorage.setItem('formData', JSON.stringify(data));
        sessionStorage.setItem('currentStep', currentStep.toString());
    } catch (error) {
        console.error('Error saving:', error);
    }
}

function loadFormData() {
    try {
        const savedData = sessionStorage.getItem('formData');
        const savedStep = sessionStorage.getItem('currentStep');
        
        if (savedStep) currentStep = parseInt(savedStep);
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        const form = document.getElementById('clientForm');
        if (!form) return;
        
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (!input) return;
            
            if (input.type === 'checkbox') {
                input.checked = data[key] === true || data[key] === 'true';
            } else if (input.type !== 'file') {
                input.value = data[key];
            }
        });

        const maritalStatus = document.getElementById('maritalStatus');
        if (maritalStatus && maritalStatus.value) togglePartnerSections(maritalStatus.value);

        const hasChildren = document.getElementById('hasChildren');
        if (hasChildren && hasChildren.checked) {
            const section = document.getElementById('childrenSection');
            if (section) section.style.display = 'block';
        }

        const servicePurpose = document.querySelector('input[name="servicePurpose"]:checked');
        if (servicePurpose) toggleBusinessSection(servicePurpose.value);

        const partnerEmployment = document.querySelector('input[name="partnerEmployment"]:checked');
        if (partnerEmployment) togglePartnerBusinessSection(partnerEmployment.value);
    } catch (error) {
        console.error('Error loading:', error);
    }
}

function resetForm() {
    sessionStorage.clear();
    location.reload();
}
