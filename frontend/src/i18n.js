// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // ===== General & Navbar =====
      brand: "Land Projects",
      dashboard: "Dashboard",
      navbar_title: "Dashboard",

      // Extra generic
      developer: "Developer",

      // ===== Sidebar =====
      sidebar_title: "Menu",
      sidebar_nav: "Navigation",
      sidebar_home: "Home",
      sidebar_projects: "Projects",

      // ===== Breadcrumbs =====
      bc_home: "Home",
      bc_projects: "Projects",
      bc_wizard: "Setup Wizard",
      bc_siteplan: "Site Plan",
      bc_license: "License",
      bc_view: "View",

      // ===== Language switcher =====
      language_switch_title: "Switch language",
      language: "العربية",

      // ===== HomePage =====
      homepage_title: "🏗️ Project Management System",
      homepage_subtitle:
        "Start by creating a new project to enter the project data.",
      homepage_cta: "Add New Project",
      homepage_creating: "Creating...",
      homepage_default_project_name: "New Project",
      homepage_created_but_unknown:
        "The project was created but could not be located automatically. Please open the projects page manually.",
      homepage_error_creating_project:
        "An error occurred while creating the project",

      // ===== Common / Select =====
      select_placeholder: "Select...",

      // ===== Generic buttons (extra) =====
      next: "Next",
      previous: "Previous",
      press_next: "Press Next",
      press_next_to_continue: "Press “Next” to continue.",
      continue: "Continue",

      // ===== Dashboard / Actions =====
      add_project: "Add Project",
      project_name: "Project Name",
      type: "Type",
      residential: "Residential",
      commercial: "Commercial",
      mixed: "Mixed",
      investment: "Investment",
      government: "Government",
      open_wizard: "Open Wizard",
      view_siteplan: "View Site Plan",
      view_license: "View License",
      setup_wizard: "Setup Wizard",
      step_siteplan: "Site Plan",
      step_license: "License",

      // ===== Sections/titles =====
      property_details: "Property Details",
      developer_details: "Developer Details",
      owner_details: "Owner Information",
      notes: "Notes",
      application_details: "Application Details",
      license_details: "License Details",
      land_details: "Land Details",
      owners_names: "Owners",
      consultant_details: "Consultant Details",
      contractor_details: "Contractor Details",

      // ===== Actions =====
      save_next: "Save & Next",
      save: "Save",
      back: "Back",
      edit: "Edit",
      add_owner: "Add New Owner",
      remove: "Remove",
      action: "Action",

      // ===== Empty states =====
      no_siteplan: "No Site Plan yet.",
      no_license: "No License yet.",
      no_owners_in_siteplan: "No owners found in the Site Plan.",

      // ===== SitePlan fields =====
      municipality: "Municipality",
      zone: "Zone",
      sector: "Sector",
      road_name: "Road Name",
      plot_area_sqm: "Plot Area (m²)",
      plot_area_sqft: "Plot Area (ft²)",
      land_no: "Land No",
      plot_address: "Plot Address",
      construction_status: "Construction Status",
      allocation_type: "Allocation Type",
      land_use: "Land Use",
      land_use_sub: "Sub Land Use",
      base_district: "Base District",
      overlay_district: "Overlay District",
      allocation_date: "Allocation Date",

      // ===== Developer =====
      project_no: "Project No",
      project_name_f: "Project Name",
      developer_name: "Developer Name",

      // ===== Notes / Application =====
      notes_general: "General Notes",
      application_number: "Application Number",
      application_date: "Application Date",
      attach_land_site_plan: "Attach Land Site Plan",

      // ===== Owner fields =====
      owner_name_ar: "Name (Arabic)",
      owner_name_en: "Name (English)",
      nationality: "Nationality",
      phone: "Phone",
      email: "Email",
      id_number: "ID Number",
      issue_date: "Issue Date",
      expiry_date: "Expiry Date",
      id_attachment: "ID Attachment",
      right_hold_type: "Right Hold Type",
      share_and_acquisition: "Share / Acquisition",
      share_percent: "Share (%)",

      // ===== Placeholders =====
      select_municipality: "Select municipality",
      select_zone: "Select zone",
      select_municipality_first: "Select municipality first",
      select_nationality: "Select nationality",
      not_constructed_example: "e.g. Not Constructed",
      base_district_ph: "e.g. (VR)…",
      overlay_district_ph: "e.g. ADM, VR, UGB…",

      // ===== Share possession labels =====
      share_possession_purchase_100_en: "Allotment 100%",
      share_possession_grant_100_en: "Grant 100%",
      share_possession_purchase_100_ar: "بيع وشراء 100%",
      share_possession_grant_100_ar: "منحة 100%",

      // ===== Modal =====
      warning: "Warning",
      save_error: "Save Error",
      ok: "OK",

      // ===== Misc =====
      open_specific_project_to_save:
        "Open a specific project to save to server.",
      save_failed: "Save failed",

      // ===== License extra fields / labels =====
      license_no: "License No",
      file_ref: "File Ref",
      stage_or_worktype: "Stage / Work Type",
      status: "Status",
      project_description: "Project Description",
      plot_land: "Plot / Land",
      city: "City",
      plot_no: "Plot No",
      parties: "Parties",
      owner: "Owner",
      consultant: "Consultant",
      consultant_lic: "Consultant Lic",
      contractor: "Contractor",
      contractor_lic: "Contractor Lic",
      technical_decisions: "Technical Decisions",
      decision_ref: "Ref",
      decision_date: "Date",

      // ===== LicenseStep UI =====
      license_type: "License Type",
      last_issue_date: "Last Issue Date",
      attach_building_license: "Attach Building License",
      please_attach_building_license:
        "Please attach the Building License file.",
      select_license_type: "Select license type",
      note_take_data_as_in_license:
        "Please copy the data exactly as stated in the license.",
      owners_counted_label: "Owner #{{idx}}",

      // ===== Wizard =====
      wizard_step_setup: "Project Details",
      wizard_step_siteplan: "Land Site Plan",
      wizard_step_ownerid: "Owner Identity",
      wizard_step_license: "Building Permit",
      wizard_step_contract: "Contract Details",
      wizard_project_prefix: "Project",
      wizard_home: "Home",
      wizard_info_note:
        "Some project data will be fetched automatically from the Land Site Plan 📐 and the Building Permit 📄 when available.",

      // ===== ProjectSetupStep =====
      setup_page_title: "Project Details",
      setup_project_category_title: "Project Category",
      setup_subcategories_title: "Subcategories",
      setup_contract_type_title: "Contract Type",
      setup_ready_note:
        "Press “Next” to continue to 📐 Land Site Plan, then 📄 Building Permit and 📝 Contract Details.",
      setup_help_select_all:
        "Pick the Project Category (and a subcategory if Villa), then select the Contract Type.",
      setup_help_path_only:
        "This path is only available for Residential or Commercial Villa with a New Contract. Adjust selections to enable “Next”.",

      // Project types
      project_type_villa: "🏡 Villa",
      project_type_commercial: "🏢 Commercial",
      project_type_maintenance: "🛠️ Maintenance Works",
      project_type_governmental: "🏛️ Governmental",
      project_type_fitout: "🔨 Renovation & Fit-Out",

      // Villa subcategories
      villa_residential: "🏡 Residential Villa",
      villa_commercial: "🏠💼 Commercial Villa",

      // Contract types
      contract_new: "🔹 New Contract",
      contract_continue: "🔄 Continuation Contract",

      // ===== YES/NO =====
      yes: "Yes",
      no: "No",

      // ===== Contract (NEW) =====
      contract: {
        title: "Contract Details",
        sections: {
          classification: "Classification",
          type: "Contract Type",
          details: "Contract Details",
          parties: "Parties",
          value_duration: "Value & Duration",
          consultant_fees: "Consultant Fees (within the contract amount)",
        },
        classification: {
          housing_loan_program: {
            label: "Housing Loan Program",
            desc: "Bank participates in financing; owner contribution is calculated automatically.",
          },
          private_funding: {
            label: "Private Funding",
            desc: "Owner finances without a bank contribution.",
          },
        },
        types: {
          lump_sum: "Lump Sum",
          percentage: "Percentage",
          design_build: "Design & Build",
          re_measurement: "Re-measurement",
        },
        fields: {
          contract_type: "Contract Type",
          contract_number: "Contract/Tender No",
          contract_date: "Contract Date",
          first_party_owner: "First Party (Owner)",
          second_party_contractor: "Second Party (Contractor)",
          total_project_value: "Total Project Value",
          total_bank_value: "Bank Financing",
          total_owner_value_calc: "Owner Contribution (auto)",
          project_duration_months: "Duration (months)",
        },
        placeholders: {
          select_contract_type: "Select contract type",
          contract_number: "e.g. TND-2025-001",
          contractor_name: "Contractor Name",
          trade_license: "Trade License No",
        },
        labels: {
          day: "Day",
        },
        notes: {
          housing_tender_info:
            "For housing loan, provide tender/reference if available.",
          no_owners_siteplan: "No owners were found in the Site Plan.",
          autofill_from_license:
            "Will try to autofill from Building License when available.",
        },
        fees: {
          owner: { title: "Owner-funded part" },
          bank: { title: "Bank-funded part" },
          include_consultant: "Include consultant fees?",
          design_percent: "Design fee (%)",
          supervision_percent: "Supervision fee (%)",
          extra_type: "Extra fees type",
          extra_value: "Extra fees value",
          mode: {
            percent: "Percentage",
            fixed: "Fixed amount",
            other: "Other",
          },
          percentage_ph: "Enter percent",
          amount_ph: "Enter amount",
        },
        hint: {
          title: "Notes",
          included:
            "If 'Include consultant fees' = Yes, fill the percentages/extra.",
          excluded:
            "If 'No', these items are excluded from the contract amount.",
        },
        errors: {
          select_classification: "Please select contract classification.",
          select_type: "Please select contract type.",
          select_date: "Please choose a contract date.",
          total_project_value_positive:
            "Total project value must be a positive number.",
          bank_value_nonnegative:
            "Bank financing must be a non-negative number.",
          owner_value_autocalc:
            "Owner contribution is auto-calculated (Total − Bank).",
        },
      },

      // ===== Errors mapping + client-side messages =====
      errors: {
        non_field_errors: "General",
        application_number: "Application Number",
        application_date: "Application Date",
        allocation_date: "Allocation Date",

        municipality: "Municipality",
        zone: "Zone",
        sector: "Sector",
        road_name: "Road Name",
        plot_area_sqm: "Plot Area (m²)",
        plot_area_sqft: "Plot Area (ft²)",
        land_no: "Land No.",
        plot_address: "Plot Address",
        construction_status: "Construction Status",
        allocation_type: "Allocation Type",
        land_use: "Land Use",
        base_district: "Base District",
        overlay_district: "Overlay District",

        project_no: "Project No.",
        project_name: "Project Name",
        developer_name: "Developer Name",
        notes: "Notes",

        owners: "Owners",
        owner_name: "Owner Name",
        owner_name_ar: "Name (Arabic)",
        owner_name_en: "Name (English)",
        nationality: "Nationality",
        id_number: "ID Number",
        id_issue_date: "Issue Date",
        id_expiry_date: "Expiry Date",
        id_attachment: "ID Attachment",
        right_hold_type: "Right Hold Type",
        share_possession: "Share & Acquisition",
        share_percent: "Share (%)",
        phone: "Phone",
        email: "Email",

        allocation_before_application:
          "Allocation date must be earlier than application date.",
        owners_share_sum_100: "Owners' shares must sum to 100%.",
        owner_name_bilingual_required:
          "Owner #{{idx}}: Please fill Arabic & English names.",
      },
    },
  },
  ar: {
    translation: {
      // ===== General & Navbar =====
      brand: "مشاريع الأراضي",
      dashboard: "الرئيسية",
      navbar_title: "لوحة التحكم",

      // Extra generic
      developer: "المطور",

      // ===== Sidebar =====
      sidebar_title: "القائمة",
      sidebar_nav: "التنقل",
      sidebar_home: "الرئيسية",
      sidebar_projects: "المشاريع",

      // ===== Breadcrumbs =====
      bc_home: "الرئيسية",
      bc_projects: "المشاريع",
      bc_wizard: "معالج الإعداد",
      bc_siteplan: "مخطط الأرض",
      bc_license: "الرخصة",
      bc_view: "عرض",

      // ===== Language switcher =====
      language_switch_title: "تبديل اللغة",
      language: "English",

      // ===== HomePage =====
      homepage_title: "🏗️ نظام إدارة المشاريع",
      homepage_subtitle: "ابدأ بإنشاء مشروع جديد لإدخال بيانات المشروع.",
      homepage_cta: "إضافة مشروع جديد",
      homepage_creating: "جارٍ الإنشاء...",
      homepage_default_project_name: "مشروع جديد",
      homepage_created_but_unknown:
        "تم إنشاء المشروع، لكن تعذّر تحديده تلقائيًا. افتح صفحة المشاريع يدويًا.",
      homepage_error_creating_project: "حدث خطأ أثناء إنشاء المشروع",

      // ===== Common / Select =====
      select_placeholder: "اختر...",

      // ===== Generic buttons (extra) =====
      next: "التالي",
      previous: "السابق",
      press_next: "اضغط التالي",
      press_next_to_continue: "اضغط «التالي» للمتابعة.",
      continue: "متابعة",

      // ===== Dashboard / Actions =====
      add_project: "إضافة مشروع",
      project_name: "اسم المشروع",
      type: "النوع",
      residential: "سكني",
      commercial: "تجاري",
      mixed: "مختلط",
      investment: "استثماري",
      government: "حكومي",
      open_wizard: "فتح المعالج",
      view_siteplan: "عرض المخطط",
      view_license: "عرض الرخصة",
      setup_wizard: "معالج الإعداد",
      step_siteplan: "مخطط الأرض",
      step_license: "الرخصة",

      // ===== Sections/titles =====
      property_details: "تفاصيل العقار",
      developer_details: "بيانات المطور",
      owner_details: "معلومات المالك",
      notes: "ملاحظات",
      application_details: "بيانات المعاملة",
      license_details: "بيانات الرخصة",
      land_details: "بيانات الأرض",
      owners_names: "أسماء الملاك",
      consultant_details: "بيانات الاستشاري",
      contractor_details: "بيانات المقاول",

      // ===== Actions =====
      save_next: "حفظ وانتقال",
      save: "حفظ",
      back: "رجوع",
      edit: "تعديل",
      add_owner: "إضافة مالك جديد",
      remove: "حذف",
      action: "إجراء",

      // ===== Empty states =====
      no_siteplan: "لا يوجد مخطط أرض بعد.",
      no_license: "لا توجد رخصة بعد.",
      no_owners_in_siteplan: "لا توجد أسماء ملاك في مخطط الأرض.",

      // ===== SitePlan fields =====
      municipality: "البلدية",
      zone: "المنطقة",
      sector: "الحوض/القطاع",
      road_name: "اسم الشارع",
      plot_area_sqm: "مساحة الأرض (م²)",
      plot_area_sqft: "مساحة الأرض (قدم²)",
      land_no: "رقم الأرض",
      plot_address: "عنوان القطعة",
      construction_status: "حالة الإنشاء",
      allocation_type: "نوع التخصيص",
      land_use: "استخدام الأرض (مسمى التخصيص)",
      land_use_sub: "استخدام الأرض الفرعي",
      base_district: "المنطقة الأساسية",
      overlay_district: "المنطقة المتداخلة",
      allocation_date: "تاريخ التخصيص",

      // ===== Developer =====
      project_no: "رقم المشروع",
      project_name_f: "اسم المشروع",
      developer_name: "اسم المطور",

      // ===== Notes / Application =====
      notes_general: "ملاحظات عامة",
      application_number: "رقم المعاملة",
      application_date: "تاريخ المعاملة",
      attach_land_site_plan: "إرفاق مخطط الأرض",

      // ===== Owner fields =====
      owner_name_ar: "الاسم (عربي)",
      owner_name_en: "الاسم (English)",
      nationality: "الجنسية",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      id_number: "رقم الهوية",
      issue_date: "تاريخ الإصدار",
      expiry_date: "تاريخ الانتهاء",
      id_attachment: "إرفاق الهوية",
      right_hold_type: "نوع الحق",
      share_and_acquisition: "نسبة/تملك",
      share_percent: "النسبة %",

      // ===== Placeholders =====
      select_municipality: "اختر البلدية",
      select_zone: "اختر المنطقة",
      select_municipality_first: "اختر البلدية أولًا",
      select_nationality: "اختر الجنسية",
      not_constructed_example: "مثال: غير مبنية",
      base_district_ph: "مثل: (VR)…",
      overlay_district_ph: "مثل: ADM, VR, UGB…",

      // ===== Share possession labels =====
      share_possession_purchase_100_en: "Allotment 100%",
      share_possession_grant_100_en: "Grant 100%",
      share_possession_purchase_100_ar: "بيع وشراء 100%",
      share_possession_grant_100_ar: "منحة 100%",

      // ===== Modal =====
      warning: "تنبيه",
      save_error: "خطأ أثناء الحفظ",
      ok: "تم",

      // ===== Misc =====
      open_specific_project_to_save:
        "افتح المعالج من مشروع محدد ليتم الحفظ على الخادم.",
      save_failed: "تعذّر الحفظ",

      // ===== License extra fields / labels =====
      license_no: "رقم الرخصة",
      file_ref: "مرجع الملف",
      stage_or_worktype: "مرحلة/نوع العمل",
      status: "الحالة",
      project_description: "وصف المشروع",
      plot_land: "بيانات الأرض",
      city: "المدينة",
      plot_no: "رقم القطعة",
      parties: "الأطراف",
      owner: "المالك",
      consultant: "الاستشاري",
      consultant_lic: "رخصة الاستشاري",
      contractor: "المقاول",
      contractor_lic: "رخصة المقاول",
      technical_decisions: "القرارات الفنية",
      decision_ref: "مرجع",
      decision_date: "تاريخ",

      // ===== LicenseStep UI =====
      license_type: "نوع الرخصة",
      last_issue_date: "تاريخ آخر إصدار",
      attach_building_license: "إرفاق رخصة البناء",
      please_attach_building_license: "يرجى إرفاق ملف رخصة البناء.",
      select_license_type: "اختر نوع الرخصة",
      note_take_data_as_in_license: "برجاء أخذ البيانات كما وردت بالرخصة.",
      owners_counted_label: "المالك #{{idx}}",

      // ===== Wizard =====
      wizard_step_setup: "معلومات المشروع",
      wizard_step_siteplan: "مخطط الأرض",
      wizard_step_ownerid: "هوية المالك",
      wizard_step_license: "ترخيص البناء",
      wizard_step_contract: "معلومات العقد",
      wizard_project_prefix: "المشروع",
      wizard_home: "الرئيسية",
      wizard_info_note:
        "سيتم استخراج بعض بيانات المشروع تلقائيًا من مخطط الأرض 📐 وترخيص البناء 📄 حسب المتاح.",

      // ===== ProjectSetupStep =====
      setup_page_title: "معلومات المشروع",
      setup_project_category_title: "تصنيف المشروع",
      setup_subcategories_title: "التصنيفات الفرعية",
      setup_contract_type_title: "نوع العقد",
      setup_ready_note:
        "اضغط «التالي» للانتقال إلى 📐 مخطط الأرض، ثم 📄 ترخيص البناء و 📝 معلومات العقد.",
      setup_help_select_all:
        "اختر تصنيف المشروع (وإذا كانت فيلا اختر التصنيف الفرعي) ثم حدّد نوع العقد.",
      setup_help_path_only:
        "هذا المسار متاح فقط لفيلا سكنية أو فيلا تجارية مع عقد إنشاء جديد. عدّل الاختيارات ليظهر «التالي».",

      // Project types
      project_type_villa: "🏡 فيلا",
      project_type_commercial: "🏢 تجاري",
      project_type_maintenance: "🛠️ أعمال صيانة",
      project_type_governmental: "🏛️ مشاريع حكومية",
      project_type_fitout: "🔨 أعمال تجديد وتجهيز داخلي",

      // Villa subcategories
      villa_residential: "🏡 فيلا سكنية",
      villa_commercial: "🏠💼 فيلا تجارية",

      // Contract types
      contract_new: "🔹 عقد إنشاء جديد",
      contract_continue: "🔄 عقد استكمال",

      // ===== YES/NO =====
      yes: "نعم",
      no: "لا",

      // ===== Contract (NEW) =====
      contract: {
        title: "معلومات العقد",
        sections: {
          classification: "تصنيف العقد",
          type: "نوع العقد",
          details: "بيانات العقد",
          parties: "أطراف العقد",
          value_duration: "قيمة العقد والمدة",
          consultant_fees: "أتعاب الاستشاري (ضمن مبلغ العقد)",
        },
        classification: {
          housing_loan_program: {
            label: "برنامج القرض السكني",
            desc: "يشترك البنك في التمويل؛ يتم احتساب مساهمة المالك تلقائيًا.",
          },
          private_funding: {
            label: "تمويل خاص",
            desc: "تمويل من المالك بدون مساهمة بنك.",
          },
        },
        types: {
          lump_sum: "مقطوع",
          percentage: "نسبة",
          design_build: "تصميم وتنفيذ",
          re_measurement: "إعادة قياس",
        },
        fields: {
          contract_type: "نوع العقد",
          contract_number: "رقم العقد/المناقصة",
          contract_date: "تاريخ العقد",
          first_party_owner: "الطرف الأول (المالك)",
          second_party_contractor: "الطرف الثاني (المقاول)",
          total_project_value: "قيمة المشروع الإجمالية",
          total_bank_value: "تمويل البنك",
          total_owner_value_calc: "مساهمة المالك (تلقائي)",
          project_duration_months: "المدة (بالأشهر)",
        },
        placeholders: {
          select_contract_type: "اختر نوع العقد",
          contract_number: "مثال: TND-2025-001",
          contractor_name: "اسم المقاول",
          trade_license: "رقم الرخصة التجارية",
        },
        labels: {
          day: "اليوم",
        },
        notes: {
          housing_tender_info:
            "لعقد القرض السكني يُفضّل إدخال رقم المناقصة/المرجع إن وُجد.",
          no_owners_siteplan: "لا توجد أسماء ملاك في مخطط الأرض.",
          autofill_from_license: "سيتم جلب البيانات من رخصة البناء إن توفرت.",
        },
        fees: {
          owner: { title: "الجزء الممول من المالك" },
          bank: { title: "الجزء الممول من البنك" },
          include_consultant: "هل تشمل أتعاب الاستشاري؟",
          design_percent: "أتعاب التصميم (%)",
          supervision_percent: "أتعاب الإشراف (%)",
          extra_type: "نوع الأتعاب الإضافية",
          extra_value: "قيمة الأتعاب الإضافية",
          mode: {
            percent: "نسبة مئوية",
            fixed: "مبلغ ثابت",
            other: "أخرى",
          },
          percentage_ph: "أدخل النسبة",
          amount_ph: "أدخل المبلغ",
        },
        hint: {
          title: "توضيح",
          included:
            "إذا كانت «تشمل أتعاب الاستشاري» = نعم، املىء النسب/الإضافي.",
          excluded: "إذا كانت «لا»، فهذه البنود خارج مبلغ العقد.",
        },
        errors: {
          select_classification: "يرجى اختيار تصنيف العقد.",
          select_type: "يرجى اختيار نوع العقد.",
          select_date: "يرجى تحديد تاريخ العقد.",
          total_project_value_positive:
            "قيمة المشروع الإجمالية يجب أن تكون رقمًا موجبًا.",
          bank_value_nonnegative: "تمويل البنك يجب أن يكون رقمًا غير سالب.",
          owner_value_autocalc:
            "مساهمة المالك تُحسب تلقائيًا (الإجمالي − البنك).",
        },
      },

      // ===== Errors mapping + client-side messages =====
      errors: {
        non_field_errors: "عام",
        application_number: "رقم المعاملة",
        application_date: "تاريخ المعاملة",
        allocation_date: "تاريخ التخصيص",

        municipality: "البلدية",
        zone: "المنطقة",
        sector: "الحوض / القطاع",
        road_name: "اسم الشارع",
        plot_area_sqm: "المساحة (م²)",
        plot_area_sqft: "المساحة (قدم²)",
        land_no: "رقم الأرض",
        plot_address: "عنوان القطعة",
        construction_status: "حالة البناء",
        allocation_type: "مسمى التخصيص",
        land_use: "استخدام الأرض",
        base_district: "المنطقة الأساسية",
        overlay_district: "المنطقة المتداخلة",

        project_no: "رقم المشروع",
        project_name: "اسم المشروع",
        developer_name: "اسم المطور",
        notes: "ملاحظات",

        owners: "الملاك",
        owner_name: "اسم المالك",
        owner_name_ar: "الاسم (عربي)",
        owner_name_en: "الاسم (English)",
        nationality: "الجنسية",
        id_number: "رقم الهوية",
        id_issue_date: "تاريخ الإصدار",
        id_expiry_date: "تاريخ الانتهاء",
        id_attachment: "إرفاق الهوية",
        right_hold_type: "نوع الحق",
        share_possession: "الحصّة/الحيازة",
        share_percent: "النسبة %",
        phone: "الهاتف",
        email: "البريد الإلكتروني",

        allocation_before_application:
          "يجب أن يكون تاريخ التخصيص أقدم من تاريخ المعاملة.",
        owners_share_sum_100: "مجموع نسب الملاك يجب أن يساوي 100%.",
        owner_name_bilingual_required:
          "المالك #{{idx}}: يرجى تعبئة الاسم بالعربي والإنجليزي.",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ar", // ابدأ بالعربي (غَيّرها لـ 'en' لو تحب)
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// اضبط اتجاه الصفحة حسب اللغة (يدعم ar / ar-AE / ar-SA ...)
export function applyDir(lang) {
  const isRTL = /^ar\b/i.test(lang || "");
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
}
applyDir(i18n.language);
i18n.on("languageChanged", applyDir);

export default i18n;
