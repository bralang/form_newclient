// Webhook URLs
const WEBHOOKS = {
    step1: 'https://n8n.chasida.biz/webhook/client-intake-step1',
    step2: 'https://n8n.chasida.biz/webhook/client-intake-step2',
    final: 'https://n8n.chasida.biz/webhook/client-intake-final',
    allData: 'https://n8n.chasida.biz/webhook/addToSheets',
    sendGmail: 'https://n8n.chasida.biz/webhook/sendGmail'
};

let currentStep = 1;
const totalSteps = 3;

function getRefFromUrl() {
    const pickRef = (params) => {
        if (!params) return '';
        // Prefer exact match
        const direct = params.get('ref');
        if (direct) return direct;

        // Fallback: case-insensitive match (Ref/REF/etc.)
        for (const [k, v] of params.entries()) {
            if ((k || '').toLowerCase() === 'ref' && v) return v;
        }

        return '';
    };

    try {
        const fromSearch = pickRef(new URLSearchParams(window.location.search));
        if (fromSearch) return fromSearch;

        // Support links that put query params after the hash (e.g. /#/form?ref=...)
        const hash = window.location.hash || '';
        const qIndex = hash.indexOf('?');
        if (qIndex >= 0) {
            const hashQuery = hash.slice(qIndex + 1);
            const fromHash = pickRef(new URLSearchParams(hashQuery));
            if (fromHash) return fromHash;
        }

        return '';
    } catch (e) {
        return '';
    }
}

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
    const selectEl = document.getElementById('additionalIdType');
    const type = selectEl ? selectEl.value : '';
    
    const parentIdSection = document.getElementById('parentIdSection');
    const licenseSection = document.getElementById('licenseSection');
    const passportSection = document.getElementById('passportSection');
    
    if (parentIdSection) parentIdSection.style.display = type === 'parentId' ? 'block' : 'none';
    if (licenseSection) licenseSection.style.display = type === 'license' ? 'block' : 'none';
    if (passportSection) passportSection.style.display = type === 'passport' ? 'block' : 'none';
    
    // Scroll to the opened section
    setTimeout(() => {
        if (type === 'parentId' && parentIdSection) {
            parentIdSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (type === 'license' && licenseSection) {
            licenseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (type === 'passport' && passportSection) {
            passportSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
    
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
        await sendToWebhook(currentStep, await collectFormData());
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

async function sendToWebhook(step, data) {
    let webhookUrl, stepData = {};
    
    if (step === 1) {
        webhookUrl = WEBHOOKS.step1;
        const refFromUrl = getRefFromUrl();
        stepData = {
            ref: refFromUrl || null,
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
            marital_status: data.maritalStatus === 'single' ? 'single' : data.maritalStatus === 'partner' ? 'married' : data.maritalStatus || null,
            id_number: data.idNumber || null,
            has_children: data.hasChildren || false,
            number_of_children: data.numberOfChildren || null,
            partner_name: data.partnerName || null,
            partner_id_number: data.partnerIdNumber || null,
            partner_birth_date: data.partnerBirthDate || null,
            prefer_phone: data.preferPhone || false,
            partner_phone: data.partnerPhone || null,
            partner_email: data.partnerEmail || null,
            additional_id_type: data.additionalIdType || null,
            parent_id_number: data.parentIdNumber || null,
            license_number: data.licenseNumber || null,
            passport_number: data.passportNumber || null,
            partner_additional_id_type: data.partnerAdditionalIdType || null,
            partner_parent_id_number: data.partnerParentIdNumber || null,
            partner_license_number: data.partnerLicenseNumber || null,
            partner_passport_number: data.partnerPassportNumber || null,
            id_document: data.idDocument || null,
            id_document_filename: data.idDocument_filename || null,
            id_document_type: data.idDocument_type || null,
            license_document: data.licenseDocument || null,
            license_document_filename: data.licenseDocument_filename || null,
            license_document_type: data.licenseDocument_type || null,
            passport_document: data.passportDocument || null,
            passport_document_filename: data.passportDocument_filename || null,
            passport_document_type: data.passportDocument_type || null,
            partner_id_document: data.partnerIdDocument || null,
            partner_id_document_filename: data.partnerIdDocument_filename || null,
            partner_id_document_type: data.partnerIdDocument_type || null,
            partner_license_document: data.partnerLicenseDocument || null,
            partner_license_document_filename: data.partnerLicenseDocument_filename || null,
            partner_license_document_type: data.partnerLicenseDocument_type || null,
            partner_passport_document: data.partnerPassportDocument || null,
            partner_passport_document_filename: data.partnerPassportDocument_filename || null,
            partner_passport_document_type: data.partnerPassportDocument_type || null
        };
    } else if (step === 2) {
        webhookUrl = WEBHOOKS.step2;
        stepData = {
            service_purpose: data.servicePurpose || null,
            new_business: data.servicePurpose === 'newBusiness' ? true : false,
            existing_business: data.servicePurpose === 'existingBusiness' ? true : false,
            shareholder: data.servicePurpose === 'shareholder' ? true : false,
            employee_only_tax_return: data.servicePurpose === 'employeeOnly' ? true : false,
            owner: {
                first_name: data.firstName || null,
                last_name: data.lastName || null,
                id_number: data.idNumber || null,
                phone: data.homePhone || null,
                mobile: data.phone || null,
                email: data.email || null
            },
            partner: {
                first_name: data.partnerName ? data.partnerName.split(' ')[0] : null,
                last_name: data.partnerName ? data.partnerName.split(' ').slice(1).join(' ') || null : null,
                id_number: data.partnerIdNumber || null,
                phone: data.partnerPhone || null,
                email: data.partnerEmail || null,
                employment_status: data.partnerEmployment || null,
                is_unemployed: data.partnerEmployment === 'unemployed' ? true : false,
                is_employee: data.partnerEmployment === 'employee' ? true : false,
                is_business_owner: data.partnerEmployment === 'businessOwner' ? true : false,
                is_opening_business: data.partnerEmployment === 'openingBusiness' ? true : false,
                is_shareholder: data.partnerEmployment === 'shareholder' ? true : false
            },
            ownerBusinessInfo: {
                business_name: data.businessName || null,
                business_number: data.businessNumber || null,
                business_type: data.businessType || null,
                business_field: data.businessField || null,
                is_small_business: data.isSmallBusiness || null,
                ownership_type: data.ownershipType || null,
                business_offering: data.businessOffering || null,
                start_date: data.businessStartDate || null,
                end_date: null,
                street: data.businessStreet || null,
                house_number: data.businessHouseNumber || null,
                city: data.businessCity || null,
                is_home_based: data.businessAtHome === 'yes' ? true : data.businessAtHome === 'no' ? false : null,
                has_inventory: data.hasInventory === 'yes' ? true : data.hasInventory === 'no' ? false : null,
                has_employees: data.hasEmployees === 'yes' ? true : data.hasEmployees === 'no' ? false : null,
                reporting_frequency: null,
                document_method: data.documentMethod || null,
                other_software_name: data.otherSoftwareName || null,
                software_username: data.softwareUsername || null,
                software_password: data.softwarePassword || null,
                planning_employees: data.planningEmployees || null,
                expected_revenue: data.expectedRevenue || null,
                chosen_business_name: data.chosenBusinessName || null,
                company_articles: data.companyArticles || null,
                company_articles_filename: data.companyArticles_filename || null,
                company_articles_type: data.companyArticles_type || null,
                lease_agreement: data.leaseAgreement || null,
                lease_agreement_filename: data.leaseAgreement_filename || null,
                lease_agreement_type: data.leaseAgreement_type || null
            },
            partnerBusinessInfo: {
                partner_business_name: data.partnerBusinessName || null,
                partner_business_number: data.partnerBusinessNumber || null,
                partner_business_type: data.partnerBusinessType || null,
                partner_business_field: data.partnerBusinessField || null,
                partner_is_small_business: data.partnerIsSmallBusiness || null,
                partner_ownership_type: data.partnerOwnershipType || null,
                partner_business_offering: data.partnerBusinessOffering || null,
                partner_start_date: data.partnerBusinessStartDate || null,
                partner_end_date: null,
                partner_street: data.partnerBusinessStreet || null,
                partner_house_number: data.partnerBusinessHouseNumber || null,
                partner_city: data.partnerBusinessCity || null,
                partner_is_home_based: data.partnerBusinessAtHome === 'yes' ? true : data.partnerBusinessAtHome === 'no' ? false : null,
                partner_has_inventory: data.partnerHasInventory === 'yes' ? true : data.partnerHasInventory === 'no' ? false : null,
                partner_has_employees: data.partnerHasEmployees === 'yes' ? true : data.partnerHasEmployees === 'no' ? false : null,
                partner_reporting_frequency: null,
                partner_document_method: data.partnerDocumentMethod || null,
                partner_other_software_name: data.partnerOtherSoftwareName || null,
                partner_software_username: data.partnerSoftwareUsername || null,
                partner_software_password: data.partnerSoftwarePassword || null,
                partner_planning_employees: data.partnerPlanningEmployees || null,
                partner_expected_revenue: data.partnerExpectedRevenue || null,
                partner_chosen_business_name: data.partnerChosenBusinessName || null,
                partner_company_articles: data.partnerCompanyArticles || null,
                partner_company_articles_filename: data.partnerCompanyArticles_filename || null,
                partner_company_articles_type: data.partnerCompanyArticles_type || null,
                partner_lease_agreement: data.partnerLeaseAgreement || null,
                partner_lease_agreement_filename: data.partnerLeaseAgreement_filename || null,
                partner_lease_agreement_type: data.partnerLeaseAgreement_type || null
            }
        };
    } else {
        // Step 3 - שליחה לשני ווהבוקים
        
        // 1. שליחה לווהבוק המקורי final עם המבנה המקורי
        const finalStepData = {
            personalInfo: {
                first_name: data.firstName || null,
                last_name: data.lastName || null,
                gender: data.gender || null,
                mobile: data.phone || null,
                email: data.email || null,
                phone: data.homePhone || null,
                street: data.street || null,
                house_number: data.houseNumber || null,
                city: data.city || null,
                postal_code: data.postalCode || null,
                birth_date: data.birthDate || null,
                marital_status: data.maritalStatus === 'single' ? 'single' : data.maritalStatus === 'partner' ? 'married' : data.maritalStatus || null,
                id_number: data.idNumber || null,
                has_children: data.hasChildren || false,
                number_of_children: data.numberOfChildren || null,
                partner_name: data.partnerName || null,
                partner_id_number: data.partnerIdNumber || null,
                partner_birth_date: data.partnerBirthDate || null,
                prefer_phone: data.preferPhone || false,
                partner_phone: data.partnerPhone || null,
                partner_email: data.partnerEmail || null
            },
            businessInfo: {
                service_purpose: data.servicePurpose || null,
                partner_employment: data.partnerEmployment || null,
                business_name: data.businessName || null,
                business_number: data.businessNumber || null,
                business_type: data.businessType || null,
                partner_business_name: data.partnerBusinessName || null,
                partner_business_number: data.partnerBusinessNumber || null,
                partner_business_type: data.partnerBusinessType || null
            },
            financialInfo: {
                wealth_declaration: data.wealthDeclaration || null,
                wealth_declaration_file: data.wealthDeclarationFile || null,
                wealth_declaration_file_filename: data.wealthDeclarationFile_filename || null,
                wealth_declaration_file_type: data.wealthDeclarationFile_type || null,
                wealth_declaration_date: data.wealthDeclarationDate || null,
                bank_name: data.bankName || null,
                branch_number: data.branchNumber || null,
                account_number: data.accountNumber || null,
                account_holder: data.accountHolder || null,
                bank_document: data.bankDocument || null,
                bank_document_filename: data.bankDocument_filename || null,
                bank_document_type: data.bankDocument_type || null
            },
            feedbackInfo: {
                agree_notifications: data.agreeNotifications || false,
                feedback: data.feedback || null
            }
        };
        
        // 1. שליחה לווהבוק final
        console.log('Sending to WEBHOOKS.final...', finalStepData);
        try {
            const finalResponse = await fetch(WEBHOOKS.final, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalStepData)
            });
            console.log('WEBHOOKS.final response:', finalResponse.status);
        } catch (error) {
            console.error('Error sending to WEBHOOKS.final:', error);
        }
        
        // 2. שליחה לווהבוק sendGmail עם סיכום הלקוח
        const businessCount = (data.servicePurpose === 'existingBusiness' || data.servicePurpose === 'newBusiness' ? 1 : 0) + 
                              (data.partnerEmployment === 'existingBusiness' || data.partnerEmployment === 'newBusiness' ? 1 : 0);
        
        const businessTypeLabelMap = {
            exempt: 'פטור',
            licensed: 'מורשה',
            company: 'חברה',
            association: 'עמותה'
        };

        const gmailData = {
            client_name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            phone: data.phone || null,
            email: data.email || null,
            business_count: businessCount,
            business_name: data.businessName || null,
            business_type: data.businessType ? (businessTypeLabelMap[data.businessType] || data.businessType) : null,
            business_type_raw: data.businessType || null
        };
        
        console.log('Sending to WEBHOOKS.sendGmail...', gmailData);
        try {
            const gmailResponse = await fetch(WEBHOOKS.sendGmail, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gmailData)
            });
            console.log('WEBHOOKS.sendGmail response:', gmailResponse.status);

            if (!gmailResponse.ok) {
                alert(`שליחת המייל נכשלה (סטטוס ${gmailResponse.status}). בדקי ב-n8n אם ה-webhook פעיל ומחזיר 200.`);
            }
        } catch (error) {
            console.error('Error sending to WEBHOOKS.sendGmail:', error);
            alert('שליחת המייל נכשלה (שגיאת רשת/CORS). בדקי ב-n8n שה-webhook מאפשר בקשות מהדפדפן.');
        }
        
        // 2. שליחה לווהבוק החדש allData עם כל הנתונים
        webhookUrl = WEBHOOKS.allData;
        stepData = {
            // Personal Info - Step 1
            first_name: data.firstName || null,
            last_name: data.lastName || null,
            gender: data.gender || null,
            mobile: data.phone || null,
            email: data.email || null,
            phone: data.homePhone || null,
            street: data.street || null,
            house_number: data.houseNumber || null,
            city: data.city || null,
            postal_code: data.postalCode || null,
            birth_date: data.birthDate || null,
            marital_status: data.maritalStatus || null,
            id_number: data.idNumber || null,
            has_children: data.hasChildren || false,
            number_of_children: data.numberOfChildren || null,
            
            // Partner Info - Step 1
            partner_name: data.partnerName || null,
            partner_id_number: data.partnerIdNumber || null,
            partner_birth_date: data.partnerBirthDate || null,
            prefer_phone: data.preferPhone || false,
            partner_phone: data.partnerPhone || null,
            partner_email: data.partnerEmail || null,
            
            // Additional ID - Step 1
            additional_id_type: data.additionalIdType || null,
            parent_id_number: data.parentIdNumber || null,
            license_number: data.licenseNumber || null,
            passport_number: data.passportNumber || null,
            partner_additional_id_type: data.partnerAdditionalIdType || null,
            partner_parent_id_number: data.partnerParentIdNumber || null,
            partner_license_number: data.partnerLicenseNumber || null,
            partner_passport_number: data.partnerPassportNumber || null,
            
            // ID Documents - Step 1
            id_document: data.idDocument || null,
            id_document_filename: data.idDocument_filename || null,
            id_document_type: data.idDocument_type || null,
            license_document: data.licenseDocument || null,
            license_document_filename: data.licenseDocument_filename || null,
            license_document_type: data.licenseDocument_type || null,
            passport_document: data.passportDocument || null,
            passport_document_filename: data.passportDocument_filename || null,
            passport_document_type: data.passportDocument_type || null,
            partner_id_document: data.partnerIdDocument || null,
            partner_id_document_filename: data.partnerIdDocument_filename || null,
            partner_id_document_type: data.partnerIdDocument_type || null,
            partner_license_document: data.partnerLicenseDocument || null,
            partner_license_document_filename: data.partnerLicenseDocument_filename || null,
            partner_license_document_type: data.partnerLicenseDocument_type || null,
            partner_passport_document: data.partnerPassportDocument || null,
            partner_passport_document_filename: data.partnerPassportDocument_filename || null,
            partner_passport_document_type: data.partnerPassportDocument_type || null,
            
            // Business Info - Step 2
            service_purpose: data.servicePurpose || null,
            partner_employment: data.partnerEmployment || null,
            
            // Owner Business Details - Step 2
            business_name: data.businessName || null,
            business_number: data.businessNumber || null,
            business_type: data.businessType || null,
            business_field: data.businessField || null,
            is_small_business: data.isSmallBusiness || null,
            ownership_type: data.ownershipType || null,
            business_offering: data.businessOffering || null,
            business_start_date: data.businessStartDate || null,
            business_street: data.businessStreet || null,
            business_house_number: data.businessHouseNumber || null,
            business_city: data.businessCity || null,
            business_at_home: data.businessAtHome || null,
            has_inventory: data.hasInventory || null,
            has_employees: data.hasEmployees || null,
            document_method: data.documentMethod || null,
            other_software_name: data.otherSoftwareName || null,
            software_username: data.softwareUsername || null,
            software_password: data.softwarePassword || null,
            planning_employees: data.planningEmployees || null,
            expected_revenue: data.expectedRevenue || null,
            chosen_business_name: data.chosenBusinessName || null,
            company_articles: data.companyArticles || null,
            company_articles_filename: data.companyArticles_filename || null,
            company_articles_type: data.companyArticles_type || null,
            lease_agreement: data.leaseAgreement || null,
            lease_agreement_filename: data.leaseAgreement_filename || null,
            lease_agreement_type: data.leaseAgreement_type || null,
            
            // Partner Business Details - Step 2
            partner_business_name: data.partnerBusinessName || null,
            partner_business_number: data.partnerBusinessNumber || null,
            partner_business_type: data.partnerBusinessType || null,
            partner_business_field: data.partnerBusinessField || null,
            partner_is_small_business: data.partnerIsSmallBusiness || null,
            partner_ownership_type: data.partnerOwnershipType || null,
            partner_business_offering: data.partnerBusinessOffering || null,
            partner_business_start_date: data.partnerBusinessStartDate || null,
            partner_business_street: data.partnerBusinessStreet || null,
            partner_business_house_number: data.partnerBusinessHouseNumber || null,
            partner_business_city: data.partnerBusinessCity || null,
            partner_business_at_home: data.partnerBusinessAtHome || null,
            partner_has_inventory: data.partnerHasInventory || null,
            partner_has_employees: data.partnerHasEmployees || null,
            partner_document_method: data.partnerDocumentMethod || null,
            partner_other_software_name: data.partnerOtherSoftwareName || null,
            partner_software_username: data.partnerSoftwareUsername || null,
            partner_software_password: data.partnerSoftwarePassword || null,
            partner_planning_employees: data.partnerPlanningEmployees || null,
            partner_expected_revenue: data.partnerExpectedRevenue || null,
            partner_chosen_business_name: data.partnerChosenBusinessName || null,
            partner_company_articles: data.partnerCompanyArticles || null,
            partner_company_articles_filename: data.partnerCompanyArticles_filename || null,
            partner_company_articles_type: data.partnerCompanyArticles_type || null,
            partner_lease_agreement: data.partnerLeaseAgreement || null,
            partner_lease_agreement_filename: data.partnerLeaseAgreement_filename || null,
            partner_lease_agreement_type: data.partnerLeaseAgreement_type || null,
            
            // Financial Info - Step 3
            wealth_declaration: data.wealthDeclaration || null,
            wealth_declaration_file: data.wealthDeclarationFile || null,
            wealth_declaration_file_filename: data.wealthDeclarationFile_filename || null,
            wealth_declaration_file_type: data.wealthDeclarationFile_type || null,
            wealth_declaration_date: data.wealthDeclarationDate || null,
            bank_name: data.bankName || null,
            branch_number: data.branchNumber || null,
            account_number: data.accountNumber || null,
            account_holder: data.accountHolder || null,
            bank_document: data.bankDocument || null,
            bank_document_filename: data.bankDocument_filename || null,
            bank_document_type: data.bankDocument_type || null,
            
            // Feedback - Step 3
            agree_notifications: data.agreeNotifications || false,
            feedback: data.feedback || null
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
