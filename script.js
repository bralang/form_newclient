// Webhook URLs
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
    
    const maritalStatus = document.getElementById('maritalStatus');
    if (maritalStatus) maritalStatus.addEventListener('change', handleMaritalStatusChange);

    const hasChildren = document.getElementById('hasChildren');
    if (hasChildren) hasChildren.addEventListener('change', handleChildrenChange);

    const additionalIdType = document.getElementById('additionalIdType');
    if (additionalIdType) additionalIdType.addEventListener('change', handleAdditionalIdChange);

    const partnerAdditionalIdType = document.getElementById('partnerAdditionalIdType');
    if (partnerAdditionalIdType) partnerAdditionalIdType.addEventListener('change', handlePartnerAdditionalIdChange);

    const servicePurposeRadios = document.querySelectorAll('input[name="servicePurpose"]');
    servicePurposeRadios.forEach(radio => radio.addEventListener('change', handleServicePurposeChange));

    const partnerEmploymentRadios = document.querySelectorAll('input[name="partnerEmployment"]');
    partnerEmploymentRadios.forEach(radio => radio.addEventListener('change', handlePartnerEmploymentChange));

    const businessAtHome = document.getElementById('businessAtHome');
    if (businessAtHome) businessAtHome.addEventListener('change', handleBusinessAtHomeChange);

    const partnerBusinessAtHome = document.getElementById('partnerBusinessAtHome');
    if (partnerBusinessAtHome) partnerBusinessAtHome.addEventListener('change', handlePartnerBusinessAtHomeChange);

    const documentMethod = document.getElementById('documentMethod');
    if (documentMethod) documentMethod.addEventListener('change', handleDocumentMethodChange);

    const partnerDocumentMethod = document.getElementById('partnerDocumentMethod');
    if (partnerDocumentMethod) partnerDocumentMethod.addEventListener('change', handlePartnerDocumentMethodChange);

    const wealthDeclaration = document.getElementById('wealthDeclaration');
    if (wealthDeclaration) wealthDeclaration.addEventListener('change', handleWealthDeclarationChange);

    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);
}

function handleMaritalStatusChange() {
    const maritalStatus = document.getElementById('maritalStatus').value;
    const sections = ['partnerSection', 'partnerContactSection', 'partnerIdSection', 'partnerEmploymentSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = maritalStatus === 'partner' ? 'block' : 'none';
    });
    saveFormData();
}

function handleChildrenChange() {
    const hasChildren = document.getElementById('hasChildren').checked;
    document.getElementById('childrenSection').style.display = hasChildren ? 'block' : 'none';
    saveFormData();
}

function handleAdditionalIdChange() {
    const type = document.getElementById('additionalIdType').value;
    document.getElementById('parentIdSection').style.display = type === 'parentId' ? 'block' : 'none';
    document.getElementById('licenseSection').style.display = type === 'license' ? 'block' : 'none';
    document.getElementById('passportSection').style.display = type === 'passport' ? 'block' : 'none';
    saveFormData();
}

function handlePartnerAdditionalIdChange() {
    const type = document.getElementById('partnerAdditionalIdType').value;
    document.getElementById('partnerParentIdSection').style.display = type === 'parentId' ? 'block' : 'none';
    document.getElementById('partnerLicenseSection').style.display = type === 'license' ? 'block' : 'none';
    document.getElementById('partnerPassportSection').style.display = type === 'passport' ? 'block' : 'none';
    saveFormData();
}

function handleServicePurposeChange() {
    const purpose = document.querySelector('input[name="servicePurpose"]:checked')?.value;
    const myBusinessSection = document.getElementById('myBusinessSection');
    const newBusinessFields = document.getElementById('newBusinessFields');

    if (purpose === 'newBusiness' || purpose === 'existingBusiness' || purpose === 'shareholder') {
        myBusinessSection.style.display = 'block';
        newBusinessFields.style.display = purpose === 'newBusiness' ? 'block' : 'none';
    } else {
        myBusinessSection.style.display = 'none';
        newBusinessFields.style.display = 'none';
    }
    saveFormData();
}

function handlePartnerEmploymentChange() {
    const employment = document.querySelector('input[name="partnerEmployment"]:checked')?.value;
    const partnerBusinessSection = document.getElementById('partnerBusinessSection');
    const partnerNewBusinessFields = document.getElementById('partnerNewBusinessFields');
    
    partnerBusinessSection.style.display = (employment === 'businessOwner' || employment === 'openingBusiness') ? 'block' : 'none';
    partnerNewBusinessFields.style.display = employment === 'openingBusiness' ? 'block' : 'none';
    saveFormData();
}

function handleBusinessAtHomeChange() {
    const atHome = document.getElementById('businessAtHome').value;
    document.getElementById('businessAddressSection').style.display = atHome === 'no' ? 'block' : 'none';
    saveFormData();
}

function handlePartnerBusinessAtHomeChange() {
    const atHome = document.getElementById('partnerBusinessAtHome').value;
    document.getElementById('partnerBusinessAddressSection').style.display = atHome === 'no' ? 'block' : 'none';
    saveFormData();
}

function handleDocumentMethodChange() {
    const method = document.getElementById('documentMethod').value;
    document.getElementById('otherSoftwareSection').style.display = method === 'other' ? 'block' : 'none';
    saveFormData();
}

function handlePartnerDocumentMethodChange() {
    const method = document.getElementById('partnerDocumentMethod').value;
    document.getElementById('partnerOtherSoftwareSection').style.display = method === 'other' ? 'block' : 'none';
    saveFormData();
}

function handleWealthDeclarationChange() {
    const declaration = document.getElementById('wealthDeclaration').value;
    document.getElementById('wealthDeclarationFileSection').style.display = declaration === 'yes' ? 'block' : 'none';
    saveFormData();
}

function updateUI() {
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNum = index + 1;
        item.classList.remove('active', 'completed');
        if (stepNum === currentStep) item.classList.add('active');
        else if (stepNum < currentStep) {
            item.classList.add('completed');
            item.querySelector('.step-circle').innerHTML = '✓';
        } else {
            item.querySelector('.step-circle').innerHTML = stepNum;
        }
    });

    document.querySelectorAll('.step-line').forEach((line, index) => {
        line.classList.toggle('completed', index + 1 < currentStep);
    });

    document.querySelectorAll('.form-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === currentStep);
    });

    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'flex';
    document.getElementById('nextBtn').innerHTML = currentStep === totalSteps ? 'שלח שאלון <span>→</span>' : 'המשך <span>→</span>';
}

async function nextStep() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
    
    let isValid = true;
    inputs.forEach(input => {
        if (input.offsetParent !== null && !input.value) {
            isValid = false;
            input.style.borderColor = '#ef4444';
            setTimeout(() => input.style.borderColor = '', 2000);
        }
    });

    if (!isValid) {
        alert('נא למלא את כל השדות המסומנים בכוכבית (*)');
        return;
    }

    const nextBtn = document.getElementById('nextBtn');
    nextBtn.classList.add('loading');
    nextBtn.disabled = true;

    try {
        await sendToWebhook(currentStep, collectFormData());
        if (currentStep === totalSteps) {
            document.getElementById('formNav').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        } else {
            currentStep++;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
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
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        if (value instanceof File && value.size === 0) continue;
        data[key] = value;
    }

    data.hasChildren = document.getElementById('hasChildren')?.checked || false;
    data.preferPhone = document.getElementById('preferPhone')?.checked || false;
    data.agreeNotifications = document.getElementById('agreeNotifications')?.checked || false;

    const servicePurpose = document.querySelector('input[name="servicePurpose"]:checked');
    if (servicePurpose) data.servicePurpose = servicePurpose.value;

    const partnerEmployment = document.querySelector('input[name="partnerEmployment"]:checked');
    if (partnerEmployment) data.partnerEmployment = partnerEmployment.value;

    return data;
}

async function sendToWebhook(step, data) {
    let webhookUrl, stepData = {};
    
    if (step === 1) {
        webhookUrl = WEBHOOKS.step1;
        stepData = {
            first_name: data.firstName,
            last_name: data.lastName,
            gender: data.gender,
            mobile: data.phone || null,
            email: data.email || null,
            phone: data.homePhone || null,
            street: data.street || null,
            house_number: data.houseNumber || null,
            city: data.city || null,
            postal_code: data.postalCode || null,
            birth_date: data.birthDate || null,
            marital_status: data.maritalStatus === 'single' ? 'single' : data.maritalStatus === 'partner' ? 'married' : data.maritalStatus || null
        };
    } else if (step === 2) {
        webhookUrl = WEBHOOKS.step2;
        stepData = {
            serviceInfo: { servicePurpose: data.servicePurpose, partnerEmployment: data.partnerEmployment || null },
            businessInfo: {
                businessName: data.businessName || null, businessField: data.businessField || null,
                businessType: data.businessType || null, isSmallBusiness: data.isSmallBusiness || null,
                ownershipType: data.ownershipType || null, businessAtHome: data.businessAtHome || null,
                businessAddress: data.businessAddress || null, businessOffering: data.businessOffering || null,
                hasEmployees: data.hasEmployees || null, documentMethod: data.documentMethod || null,
                otherSoftwareName: data.otherSoftwareName || null, softwareUsername: data.softwareUsername || null,
                softwarePassword: data.softwarePassword || null, businessStartDate: data.businessStartDate || null,
                planningEmployees: data.planningEmployees || null, expectedRevenue: data.expectedRevenue || null,
                chosenBusinessName: data.chosenBusinessName || null
            },
            partnerBusinessInfo: {
                partnerBusinessName: data.partnerBusinessName || null, partnerBusinessField: data.partnerBusinessField || null,
                partnerBusinessType: data.partnerBusinessType || null, partnerIsSmallBusiness: data.partnerIsSmallBusiness || null,
                partnerOwnershipType: data.partnerOwnershipType || null, partnerBusinessAtHome: data.partnerBusinessAtHome || null,
                partnerBusinessAddress: data.partnerBusinessAddress || null, partnerBusinessOffering: data.partnerBusinessOffering || null,
                partnerHasEmployees: data.partnerHasEmployees || null, partnerDocumentMethod: data.partnerDocumentMethod || null,
                partnerOtherSoftwareName: data.partnerOtherSoftwareName || null, partnerSoftwareUsername: data.partnerSoftwareUsername || null,
                partnerSoftwarePassword: data.partnerSoftwarePassword || null, partnerBusinessStartDate: data.partnerBusinessStartDate || null,
                partnerPlanningEmployees: data.partnerPlanningEmployees || null, partnerExpectedRevenue: data.partnerExpectedRevenue || null,
                partnerChosenBusinessName: data.partnerChosenBusinessName || null
            }
        };
    } else {
        webhookUrl = WEBHOOKS.final;
        stepData = {
            financialInfo: {
                wealthDeclaration: data.wealthDeclaration || null, bankName: data.bankName || null,
                branchNumber: data.branchNumber || null, accountNumber: data.accountNumber || null,
                accountHolder: data.accountHolder || null
            },
            feedbackInfo: { agreeNotifications: data.agreeNotifications, feedback: data.feedback || null }
        };
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData)
    });

    if (!response.ok) throw new Error('Webhook failed');
    return response;
}

function saveFormData() {
    sessionStorage.setItem('formData', JSON.stringify(collectFormData()));
    sessionStorage.setItem('currentStep', currentStep);
}

function loadFormData() {
    const savedStep = sessionStorage.getItem('currentStep');
    if (savedStep) currentStep = parseInt(savedStep);
    
    const savedData = sessionStorage.getItem('formData');
    if (savedData) {
        const data = JSON.parse(savedData);
        const form = document.getElementById('clientForm');
        
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.type !== 'file') {
                if (input.type === 'checkbox') input.checked = data[key];
                else if (input.type === 'radio' && input.value === data[key]) input.checked = true;
                else if (input.type !== 'radio') input.value = data[key];
            }
        });

        // Trigger handlers
        if (data.maritalStatus) handleMaritalStatusChange();
        if (data.hasChildren) handleChildrenChange();
        if (data.additionalIdType) handleAdditionalIdChange();
        if (data.partnerAdditionalIdType) handlePartnerAdditionalIdChange();
        if (data.servicePurpose) handleServicePurposeChange();
        if (data.partnerEmployment) handlePartnerEmploymentChange();
        if (data.businessAtHome) handleBusinessAtHomeChange();
        if (data.partnerBusinessAtHome) handlePartnerBusinessAtHomeChange();
        if (data.documentMethod) handleDocumentMethodChange();
        if (data.partnerDocumentMethod) handlePartnerDocumentMethodChange();
        if (data.wealthDeclaration) handleWealthDeclarationChange();
    }
    
    // Re-trigger section visibility after loading
    updateUI();
}

function resetForm() {
    sessionStorage.clear();
    location.reload();
}
