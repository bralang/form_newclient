// Webhook URL - Send all data only at the end
const WEBHOOK_URL = 'https://n8n.chasida.biz/webhook/addToShits';

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

    const businessType = document.getElementById('businessType');
    if (businessType) businessType.addEventListener('change', handleBusinessTypeChange);

    const partnerBusinessType = document.getElementById('partnerBusinessType');
    if (partnerBusinessType) partnerBusinessType.addEventListener('change', handlePartnerBusinessTypeChange);

    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);
}

function handleMaritalStatusChange() {
    const maritalStatus = document.getElementById('maritalStatus').value;
    const sections = ['partnerSection', 'partnerIdSection', 'partnerEmploymentSection'];
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

function handleBusinessTypeChange() {
    const type = document.getElementById('businessType').value;
    document.getElementById('companyArticlesSection').style.display = type === 'company' ? 'block' : 'none';
    saveFormData();
}

function handlePartnerBusinessTypeChange() {
    const type = document.getElementById('partnerBusinessType').value;
    document.getElementById('partnerCompanyArticlesSection').style.display = type === 'company' ? 'block' : 'none';
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
        // Only send data on final step
        if (currentStep === totalSteps) {
            await sendToWebhook(await collectFormData());
        }
        
        if (currentStep === totalSteps) {
            // Show success message as separate step
            const steps = document.querySelectorAll('.form-step');
            steps.forEach(step => {
                step.classList.remove('active');
                step.style.display = 'none';
            });

            const successStep = document.getElementById('successStep');
            if (successStep) {
                successStep.classList.add('active');
                successStep.style.display = 'block';
            }

            const formNav = document.getElementById('formNav');
            if (formNav) {
                formNav.style.display = 'none';
            }
            
            // Update progress to completed
            document.querySelectorAll('.step-item').forEach(item => {
                item.classList.remove('active');
                item.classList.add('completed');
                item.querySelector('.step-circle').innerHTML = '✓';
            });
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function collectFormData() {
    const form = document.getElementById('clientForm');
    const formData = new FormData(form);
    const data = {};

    const fileInputNames = [
        'idDocument', 'licenseDocument', 'passportDocument',
        'partnerIdDocument', 'partnerLicenseDocument', 'partnerPassportDocument',
        'companyArticles', 'leaseAgreement',
        'partnerCompanyArticles', 'partnerLeaseAgreement',
        'wealthDeclarationFile', 'bankDocument'
    ];

    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            if (value.size > 0 && fileInputNames.includes(key)) {
                data[key] = await fileToBase64(value);
                data[key + '_filename'] = value.name;
                data[key + '_type'] = value.type;
            }
            continue;
        }
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

async function sendToWebhook(data) {
    // Send ALL form data at once
    const completeData = {
        // Personal Information (Step 1)
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        homePhone: data.homePhone || null,
        street: data.street || null,
        houseNumber: data.houseNumber || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        birthDate: data.birthDate || null,
        maritalStatus: data.maritalStatus || null,
        idNumber: data.idNumber || null,
        hasChildren: data.hasChildren || false,
        numberOfChildren: data.numberOfChildren || null,
        
        // Partner Information (Step 1)
        partnerName: data.partnerName || null,
        partnerIdNumber: data.partnerIdNumber || null,
        partnerBirthDate: data.partnerBirthDate || null,
        preferPhone: data.preferPhone || false,
        partnerPhone: data.partnerPhone || null,
        partnerEmail: data.partnerEmail || null,
        
        // Additional ID Information (Step 1)
        additionalIdType: data.additionalIdType || null,
        parentIdNumber: data.parentIdNumber || null,
        licenseNumber: data.licenseNumber || null,
        passportNumber: data.passportNumber || null,
        partnerAdditionalIdType: data.partnerAdditionalIdType || null,
        partnerParentIdNumber: data.partnerParentIdNumber || null,
        partnerLicenseNumber: data.partnerLicenseNumber || null,
        partnerPassportNumber: data.partnerPassportNumber || null,
        
        // Document Files (Step 1)
        idDocument: data.idDocument || null,
        idDocument_filename: data.idDocument_filename || null,
        idDocument_type: data.idDocument_type || null,
        licenseDocument: data.licenseDocument || null,
        licenseDocument_filename: data.licenseDocument_filename || null,
        licenseDocument_type: data.licenseDocument_type || null,
        passportDocument: data.passportDocument || null,
        passportDocument_filename: data.passportDocument_filename || null,
        passportDocument_type: data.passportDocument_type || null,
        partnerIdDocument: data.partnerIdDocument || null,
        partnerIdDocument_filename: data.partnerIdDocument_filename || null,
        partnerIdDocument_type: data.partnerIdDocument_type || null,
        partnerLicenseDocument: data.partnerLicenseDocument || null,
        partnerLicenseDocument_filename: data.partnerLicenseDocument_filename || null,
        partnerLicenseDocument_type: data.partnerLicenseDocument_type || null,
        partnerPassportDocument: data.partnerPassportDocument || null,
        partnerPassportDocument_filename: data.partnerPassportDocument_filename || null,
        partnerPassportDocument_type: data.partnerPassportDocument_type || null,
        
        // Service Information (Step 2)
        servicePurpose: data.servicePurpose || null,
        partnerEmployment: data.partnerEmployment || null,
        
        // Owner Business Information (Step 2)
        businessName: data.businessName || null,
        businessNumber: data.businessNumber || null,
        businessType: data.businessType || null,
        businessField: data.businessField || null,
        isSmallBusiness: data.isSmallBusiness || null,
        ownershipType: data.ownershipType || null,
        businessOffering: data.businessOffering || null,
        businessStartDate: data.businessStartDate || null,
        businessStreet: data.businessStreet || null,
        businessHouseNumber: data.businessHouseNumber || null,
        businessCity: data.businessCity || null,
        businessAtHome: data.businessAtHome || null,
        hasInventory: data.hasInventory || null,
        hasEmployees: data.hasEmployees || null,
        documentMethod: data.documentMethod || null,
        otherSoftwareName: data.otherSoftwareName || null,
        softwareUsername: data.softwareUsername || null,
        softwarePassword: data.softwarePassword || null,
        planningEmployees: data.planningEmployees || null,
        expectedRevenue: data.expectedRevenue || null,
        chosenBusinessName: data.chosenBusinessName || null,
        companyArticles: data.companyArticles || null,
        companyArticles_filename: data.companyArticles_filename || null,
        companyArticles_type: data.companyArticles_type || null,
        leaseAgreement: data.leaseAgreement || null,
        leaseAgreement_filename: data.leaseAgreement_filename || null,
        leaseAgreement_type: data.leaseAgreement_type || null,
        
        // Partner Business Information (Step 2)
        partnerBusinessName: data.partnerBusinessName || null,
        partnerBusinessNumber: data.partnerBusinessNumber || null,
        partnerBusinessType: data.partnerBusinessType || null,
        partnerBusinessField: data.partnerBusinessField || null,
        partnerIsSmallBusiness: data.partnerIsSmallBusiness || null,
        partnerOwnershipType: data.partnerOwnershipType || null,
        partnerBusinessOffering: data.partnerBusinessOffering || null,
        partnerBusinessStartDate: data.partnerBusinessStartDate || null,
        partnerBusinessStreet: data.partnerBusinessStreet || null,
        partnerBusinessHouseNumber: data.partnerBusinessHouseNumber || null,
        partnerBusinessCity: data.partnerBusinessCity || null,
        partnerBusinessAtHome: data.partnerBusinessAtHome || null,
        partnerHasInventory: data.partnerHasInventory || null,
        partnerHasEmployees: data.partnerHasEmployees || null,
        partnerDocumentMethod: data.partnerDocumentMethod || null,
        partnerOtherSoftwareName: data.partnerOtherSoftwareName || null,
        partnerSoftwareUsername: data.partnerSoftwareUsername || null,
        partnerSoftwarePassword: data.partnerSoftwarePassword || null,
        partnerPlanningEmployees: data.partnerPlanningEmployees || null,
        partnerExpectedRevenue: data.partnerExpectedRevenue || null,
        partnerChosenBusinessName: data.partnerChosenBusinessName || null,
        partnerCompanyArticles: data.partnerCompanyArticles || null,
        partnerCompanyArticles_filename: data.partnerCompanyArticles_filename || null,
        partnerCompanyArticles_type: data.partnerCompanyArticles_type || null,
        partnerLeaseAgreement: data.partnerLeaseAgreement || null,
        partnerLeaseAgreement_filename: data.partnerLeaseAgreement_filename || null,
        partnerLeaseAgreement_type: data.partnerLeaseAgreement_type || null,
        
        // Financial Information (Step 3)
        wealthDeclaration: data.wealthDeclaration || null,
        wealthDeclarationFile: data.wealthDeclarationFile || null,
        wealthDeclarationFile_filename: data.wealthDeclarationFile_filename || null,
        wealthDeclarationFile_type: data.wealthDeclarationFile_type || null,
        wealthDeclarationDate: data.wealthDeclarationDate || null,
        bankName: data.bankName || null,
        branchNumber: data.branchNumber || null,
        accountNumber: data.accountNumber || null,
        accountHolder: data.accountHolder || null,
        bankDocument: data.bankDocument || null,
        bankDocument_filename: data.bankDocument_filename || null,
        bankDocument_type: data.bankDocument_type || null,
        
        // Feedback Information (Step 3)
        agreeNotifications: data.agreeNotifications || false,
        feedback: data.feedback || null
    };

    const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData)
    });

    if (!response.ok) throw new Error('Webhook failed');
    return response;
}

async function saveFormData() {
    const formData = await collectFormData();
    const dataToSave = { ...formData };
    
    // Don't save Base64 files to sessionStorage (too large)
    const fileKeys = Object.keys(dataToSave).filter(key => 
        key.endsWith('_filename') || key.endsWith('_type') || 
        (typeof dataToSave[key] === 'string' && dataToSave[key].startsWith('data:'))
    );
    fileKeys.forEach(key => delete dataToSave[key]);
    
    sessionStorage.setItem('formData', JSON.stringify(dataToSave));
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
        if (data.businessType) handleBusinessTypeChange();
        if (data.partnerBusinessType) handlePartnerBusinessTypeChange();
    }
    
    updateUI();
}
