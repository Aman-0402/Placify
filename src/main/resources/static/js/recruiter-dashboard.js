import {
    apiRequest,
    escapeHtml,
    formatDateTime,
    requireAuth,
    titleCase,
    truncate
} from "./api.js";
import {
    consumeFlashInto,
    emptyState,
    hideMessage,
    initializeLayout,
    renderLoadingCards,
    renderLoadingSummary,
    setPageBusy,
    setButtonBusy,
    showMessage
} from "./common.js";

const state = {
    user: null,
    companies: [],
    jobs: [],
    applications: []
};

const messageElement = document.getElementById("pageMessage");
const statsGrid = document.getElementById("statsGrid");
const managerSummary = document.getElementById("managerSummary");
const companiesList = document.getElementById("companiesList");
const companyHint = document.getElementById("companyHint");
const companyForm = document.getElementById("companyForm");
const companyButton = document.getElementById("companyButton");
const jobForm = document.getElementById("jobForm");
const jobButton = document.getElementById("jobButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const jobCompanyId = document.getElementById("jobCompanyId");
const managedJobsGrid = document.getElementById("managedJobsGrid");
const applicationPreviewGrid = document.getElementById("applicationPreviewGrid");

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setPageBusy(true, "Loading management workspace...");
    const user = await requireAuth(["ADMIN", "RECRUITER"]);
    if (!user) {
        setPageBusy(false);
        return;
    }

    state.user = user;
    initializeLayout("dashboard", user);
    consumeFlashInto(messageElement);
    configureRoleView();
    bindEvents();
    renderLoadingSummary(managerSummary, 3);
    renderLoadingSummary(companiesList, 3);
    renderLoadingCards(managedJobsGrid, 3);
    renderLoadingCards(applicationPreviewGrid, 3);
    await loadDashboard();
    setPageBusy(false);
}

function configureRoleView() {
    if (state.user.role === "ADMIN") {
        document.getElementById("dashboardRoleBadge").textContent = "Admin Workspace";
        document.getElementById("dashboardHeroTitle").textContent = "Admin control over companies and job postings.";
        document.getElementById("dashboardHeroSubtitle").textContent =
            "Create companies, support recruiters, and monitor platform-wide application activity.";
        companyForm.classList.remove("hidden");
        companyHint.classList.add("hidden");
        return;
    }

    companyForm.classList.add("hidden");
    companyHint.classList.remove("hidden");
}

function bindEvents() {
    companyForm.addEventListener("submit", saveCompany);
    jobForm.addEventListener("submit", saveJob);
    managedJobsGrid.addEventListener("click", handleJobActions);
    cancelEditButton.addEventListener("click", resetJobForm);
}

async function loadDashboard() {
    try {
        const [companiesPayload, jobsPayload, applicationsPayload] = await Promise.all([
            apiRequest("/api/companies"),
            apiRequest("/api/jobs"),
            apiRequest("/api/applications")
        ]);

        state.companies = companiesPayload.data || [];
        state.jobs = jobsPayload.data || [];
        state.applications = applicationsPayload.data || [];

        renderManagerSummary();
        populateCompanies();
        renderCompanies();
        renderJobs();
        renderApplicationsPreview();
        renderStatsBar();
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    }
}

function renderManagerSummary() {
    const initials = state.user.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join("");

    managerSummary.innerHTML = `
        <div class="db-snap-item">
            <div class="db-snap-icon indigo">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
                </svg>
            </div>
            <div class="db-snap-text">
                <div class="db-snap-label">Name</div>
                <div class="db-snap-value">${escapeHtml(state.user.name)}</div>
            </div>
        </div>
        <div class="db-snap-item">
            <div class="db-snap-icon cyan">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <rect x="1.5" y="4" width="13" height="10" rx="1.5"/>
                    <path d="M5.5 4V3A1.5 1.5 0 0 1 7 1.5h2A1.5 1.5 0 0 1 10.5 3v1"/>
                    <line x1="1.5" y1="8" x2="14.5" y2="8"/>
                </svg>
            </div>
            <div class="db-snap-text">
                <div class="db-snap-label">Role</div>
                <div class="db-snap-value">${escapeHtml(state.user.role)}</div>
            </div>
        </div>
        <div class="db-snap-item">
            <div class="db-snap-icon warning">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M8 2L2 14h12L8 2z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/>
                </svg>
            </div>
            <div class="db-snap-text">
                <div class="db-snap-label">Open Jobs</div>
                <div class="db-snap-value">${state.jobs.filter((j) => j.active).length} active</div>
            </div>
        </div>
    `;
}

function populateCompanies() {
    if (!state.companies.length) {
        jobCompanyId.innerHTML = '<option value="">No companies available</option>';
        return;
    }

    jobCompanyId.innerHTML = state.companies.map((company) => `
        <option value="${company.id}">${escapeHtml(company.name)}</option>
    `).join("");
}

function renderCompanies() {
    if (!state.companies.length) {
        companiesList.innerHTML = emptyState("No companies available yet.");
        return;
    }

    companiesList.innerHTML = state.companies.map((company) => `
        <div class="co-card">
            <div class="co-card-logo">${escapeHtml(company.name.charAt(0))}</div>
            <div class="co-card-info">
                <div class="co-card-name">${escapeHtml(company.name)}</div>
                <div class="co-card-desc">${escapeHtml(truncate(company.description, 100))}</div>
            </div>
        </div>
    `).join("");
}

function renderJobs() {
    if (!state.jobs.length) {
        managedJobsGrid.innerHTML = emptyState("No jobs posted yet. Use the form above to create your first posting.");
        return;
    }

    const jobCards = state.jobs.slice(0, 8).map((job) => `
        <article class="rjcard">
            <div class="rjcard-head">
                <div class="chip-row">
                    <span class="status-pill ${job.active ? "success" : "warning"}">${job.active ? "Active" : "Inactive"}</span>
                    <span class="micro-pill">${escapeHtml(job.companyName)}</span>
                </div>
                <div class="rjcard-title">${escapeHtml(job.title)}</div>
                <div class="rjcard-desc">${escapeHtml(truncate(job.description, 130))}</div>
            </div>
            <div class="rjcard-meta">
                <div class="rjcard-meta-item">
                    <span class="rjcard-meta-label">Eligibility</span>
                    <span class="rjcard-meta-value">${escapeHtml(job.eligibility)}</span>
                </div>
                <div class="rjcard-meta-item">
                    <span class="rjcard-meta-label">Posted</span>
                    <span class="rjcard-meta-value">${escapeHtml(formatDateTime(job.createdAt))}</span>
                </div>
            </div>
            <div class="rjcard-actions">
                <button class="button secondary sm" data-edit-job="${job.id}" type="button">Edit</button>
                <button class="button danger sm" data-delete-job="${job.id}" type="button">Delete</button>
                <a class="button ghost sm" href="/applications.html?jobId=${job.id}">Applicants</a>
            </div>
        </article>
    `).join("");

    managedJobsGrid.innerHTML = `<div class="cards-grid">${jobCards}</div>`;
}

function renderApplicationsPreview() {
    if (!state.applications.length) {
        applicationPreviewGrid.innerHTML = emptyState("No applications submitted yet.");
        return;
    }

    const appCards = state.applications.slice(0, 6).map((app) => {
        const initials = app.studentName
            .split(" ")
            .slice(0, 2)
            .map((p) => p.charAt(0))
            .join("");

        return `
        <article class="racard">
            <div class="racard-top">
                <div class="racard-student">
                    <div class="racard-avatar">${escapeHtml(initials)}</div>
                    <div>
                        <div class="racard-name">${escapeHtml(app.studentName)}</div>
                        <div class="racard-job">${escapeHtml(app.jobTitle)} &bull; ${escapeHtml(app.companyName)}</div>
                    </div>
                </div>
                <span class="status-pill ${statusTone(app.status)}">${escapeHtml(titleCase(app.status))}</span>
            </div>
            <div class="racard-meta">
                <div class="racard-meta-item">
                    <span class="racard-meta-key">Applied</span>
                    <span class="racard-meta-val">${escapeHtml(formatDateTime(app.createdAt))}</span>
                </div>
                <div class="racard-meta-item">
                    <span class="racard-meta-key">Status</span>
                    <span class="racard-meta-val">${escapeHtml(titleCase(app.status))}</span>
                </div>
            </div>
        </article>
        `;
    }).join("");

    applicationPreviewGrid.innerHTML = `<div class="cards-grid">${appCards}</div>`;
}

function renderStatsBar() {
    const activeJobs = state.jobs.filter((j) => j.active).length;
    const shortlisted = state.applications.filter(
        (a) => a.status === "SHORTLISTED" || a.status === "SELECTED"
    ).length;

    statsGrid.innerHTML = `
        <div class="scard">
            <div class="scard-icon cyan">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <rect x="1.5" y="3" width="15" height="12" rx="1.5"/>
                    <path d="M6 3V1.5M12 3V1.5"/><line x1="1.5" y1="7" x2="16.5" y2="7"/>
                </svg>
            </div>
            <div class="scard-value">${state.companies.length}</div>
            <div class="scard-label">Companies</div>
        </div>
        <div class="scard">
            <div class="scard-icon indigo">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <rect x="1.5" y="4.5" width="15" height="11" rx="1.5"/>
                    <path d="M5.5 4.5V3A1.5 1.5 0 0 1 7 1.5h4A1.5 1.5 0 0 1 12.5 3v1.5"/>
                    <line x1="1.5" y1="9" x2="16.5" y2="9"/>
                </svg>
            </div>
            <div class="scard-value">${activeJobs}</div>
            <div class="scard-label">Active Jobs</div>
        </div>
        <div class="scard">
            <div class="scard-icon warning">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M3 3h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
                    <line x1="5" y1="7" x2="13" y2="7"/><line x1="5" y1="10" x2="13" y2="10"/><line x1="5" y1="13" x2="9" y2="13"/>
                </svg>
            </div>
            <div class="scard-value">${state.applications.length}</div>
            <div class="scard-label">Applications</div>
        </div>
        <div class="scard">
            <div class="scard-icon success">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <circle cx="9" cy="9" r="7"/><path d="M6 9l2.5 2.5 4-4"/>
                </svg>
            </div>
            <div class="scard-value">${shortlisted}</div>
            <div class="scard-label">Shortlisted</div>
        </div>
    `;
}

async function saveCompany(event) {
    event.preventDefault();
    hideMessage(messageElement);

    if (state.user.role !== "ADMIN") {
        showMessage(messageElement, "Only admins can add companies.", "error");
        return;
    }

    setButtonBusy(companyButton, true, "Saving...");

    try {
        await apiRequest("/api/companies", {
            method: "POST",
            body: {
                name: document.getElementById("companyName").value.trim(),
                description: document.getElementById("companyDescription").value.trim()
            }
        });

        companyForm.reset();
        showMessage(messageElement, "Company added successfully.", "success");
        await loadDashboard();
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    } finally {
        setButtonBusy(companyButton, false);
    }
}

async function saveJob(event) {
    event.preventDefault();
    hideMessage(messageElement);

    if (!document.getElementById("jobCompanyId").value) {
        showMessage(messageElement, "Add a company first before posting a job.", "error");
        return;
    }

    setButtonBusy(jobButton, true, document.getElementById("jobId").value ? "Updating..." : "Posting...");

    const jobId = document.getElementById("jobId").value;
    const path = jobId ? `/api/jobs/${jobId}` : "/api/jobs";
    const method = jobId ? "PUT" : "POST";

    try {
        await apiRequest(path, {
            method,
            body: {
                title: document.getElementById("jobTitle").value.trim(),
                description: document.getElementById("jobDescription").value.trim(),
                companyId: Number(document.getElementById("jobCompanyId").value),
                eligibility: document.getElementById("jobEligibility").value.trim()
            }
        });

        resetJobForm();
        showMessage(messageElement, jobId ? "Job updated successfully." : "Job posted successfully.", "success");
        await loadDashboard();
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    } finally {
        setButtonBusy(jobButton, false);
    }
}

async function handleJobActions(event) {
    const editButton = event.target.closest("[data-edit-job]");
    const deleteButton = event.target.closest("[data-delete-job]");

    if (editButton) {
        const jobId = Number(editButton.dataset.editJob);
        populateJobForm(jobId);
        return;
    }

    if (!deleteButton) {
        return;
    }

    const jobId = Number(deleteButton.dataset.deleteJob);
    if (!window.confirm("Delete this job posting? This cannot be undone.")) {
        return;
    }

    try {
        await apiRequest(`/api/jobs/${jobId}`, {method: "DELETE"});
        showMessage(messageElement, "Job deleted successfully.", "success");
        await loadDashboard();
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    }
}

function populateJobForm(jobId) {
    const job = state.jobs.find((item) => item.id === jobId);
    if (!job) {
        return;
    }

    document.getElementById("jobId").value = job.id;
    document.getElementById("jobTitle").value = job.title;
    document.getElementById("jobDescription").value = job.description;
    document.getElementById("jobEligibility").value = job.eligibility;
    document.getElementById("jobCompanyId").value = String(job.companyId);
    jobButton.textContent = "Update Job";
    cancelEditButton.classList.remove("hidden");
    window.scrollTo({top: 0, behavior: "smooth"});
}

function resetJobForm() {
    jobForm.reset();
    document.getElementById("jobId").value = "";
    if (state.companies.length) {
        document.getElementById("jobCompanyId").value = String(state.companies[0].id);
    }
    jobButton.textContent = "Post Job";
    cancelEditButton.classList.add("hidden");
}

function statusTone(status) {
    if (status === "SELECTED" || status === "SHORTLISTED") {
        return "success";
    }
    if (status === "REJECTED") {
        return "danger";
    }
    return "warning";
}
