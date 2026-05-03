import {
    apiRequest,
    clearPendingJob,
    escapeHtml,
    formatDate,
    formatDateTime,
    requireAuth,
    setPendingJob,
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
    profile: null,
    jobs: [],
    applications: []
};

const messageElement = document.getElementById("pageMessage");
const accountSnapshot = document.getElementById("accountSnapshot");
const profileSummary = document.getElementById("profileSummary");
const availableJobsGrid = document.getElementById("availableJobsGrid");
const recentApplicationsGrid = document.getElementById("recentApplicationsGrid");
const statsGrid = document.getElementById("statsGrid");
const profileForm = document.getElementById("profileForm");
const profileButton = document.getElementById("profileButton");

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setPageBusy(true, "Loading student workspace...");
    const user = await requireAuth(["STUDENT"]);
    if (!user) {
        setPageBusy(false);
        return;
    }

    state.user = user;
    initializeLayout("dashboard", user);
    consumeFlashInto(messageElement);
    clearPendingJob();
    bindEvents();

    renderLoadingSummary(accountSnapshot, 3);
    renderLoadingSummary(profileSummary, 4);
    renderLoadingCards(availableJobsGrid, 3);
    renderLoadingCards(recentApplicationsGrid, 3);

    document.getElementById("studentHeroTitle").textContent = `Welcome back, ${user.name.split(" ")[0]}.`;
    document.getElementById("studentHeroSubtitle").textContent =
        "Keep your profile current, scan open roles, and monitor the status of your applications.";

    await loadDashboard();
    setPageBusy(false);
}

function bindEvents() {
    profileForm.addEventListener("submit", updateProfile);
    availableJobsGrid.addEventListener("click", handleJobActions);
}

async function loadDashboard() {
    try {
        const [profilePayload, jobsPayload, applicationsPayload] = await Promise.all([
            apiRequest("/api/students/me"),
            apiRequest("/api/students/me/jobs/available"),
            apiRequest("/api/applications/my")
        ]);

        state.profile = profilePayload.data;
        state.jobs = jobsPayload.data || [];
        state.applications = applicationsPayload.data || [];

        renderAccountSnapshot();
        renderProfile();
        renderJobs();
        renderApplications();
        renderDashboardStats();
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    }
}

function renderAccountSnapshot() {
    const shortlisted = state.applications.filter(
        (a) => a.status === "SHORTLISTED" || a.status === "SELECTED"
    ).length;

    accountSnapshot.innerHTML = `
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
                    <rect x="1.5" y="3" width="13" height="10" rx="1.5"/>
                    <path d="M1.5 6.5h13"/>
                </svg>
            </div>
            <div class="db-snap-text">
                <div class="db-snap-label">Branch</div>
                <div class="db-snap-value">${escapeHtml(state.profile?.branch || "Not set")}</div>
            </div>
        </div>
        <div class="db-snap-item">
            <div class="db-snap-icon success">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M13 5 6.5 11.5 3 8"/>
                </svg>
            </div>
            <div class="db-snap-text">
                <div class="db-snap-label">Shortlisted</div>
                <div class="db-snap-value">${shortlisted} role${shortlisted !== 1 ? "s" : ""}</div>
            </div>
        </div>
    `;
}

function renderProfile() {
    if (!state.profile) {
        profileSummary.innerHTML = emptyState("Student profile not found.");
        return;
    }

    document.getElementById("profileBranch").value = state.profile.branch || "";
    document.getElementById("profileSkills").value = state.profile.skills || "";
    document.getElementById("profileResume").value = state.profile.resume || "";

    const initials = state.profile.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join("");

    const skillTags = (state.profile.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`)
        .join("");

    profileSummary.innerHTML = `
        <div class="profile-avatar-row">
            <div class="profile-avatar">${escapeHtml(initials)}</div>
            <div>
                <div class="profile-card-name">${escapeHtml(state.profile.name)}</div>
                <div class="profile-card-sub">${escapeHtml(state.user.email)}</div>
            </div>
        </div>
        <div class="profile-meta-row">
            <div class="profile-meta-item">
                <span class="profile-meta-label">Branch</span>
                <span class="profile-meta-value">${escapeHtml(state.profile.branch || "Not set")}</span>
            </div>
            <div class="profile-meta-item">
                <span class="profile-meta-label">Resume</span>
                <span class="profile-meta-value">
                    ${state.profile.resume
                        ? `<a href="${escapeHtml(state.profile.resume)}" target="_blank" rel="noopener">View Resume &rarr;</a>`
                        : "Not uploaded"}
                </span>
            </div>
            <div class="profile-meta-item">
                <span class="profile-meta-label">Skills</span>
                ${skillTags
                    ? `<div class="skill-tags">${skillTags}</div>`
                    : `<span class="profile-meta-value">No skills added</span>`}
            </div>
        </div>
    `;
}

function renderJobs() {
    if (!state.jobs.length) {
        availableJobsGrid.innerHTML = emptyState("No active jobs are available right now. Check back soon.");
        return;
    }

    const jobCards = state.jobs.slice(0, 6).map((job) => {
        const logo = job.companyName.charAt(0).toUpperCase();
        return `
        <article class="jcard">
            <div>
                <div class="jcard-company-row">
                    <div class="jcard-company-logo">${escapeHtml(logo)}</div>
                    <span class="jcard-company-name">${escapeHtml(job.companyName)}</span>
                    <span class="status-pill success jcard-status-pill">Active</span>
                </div>
                <div class="jcard-title">${escapeHtml(job.title)}</div>
                <div class="jcard-desc">${escapeHtml(truncate(job.description, 120))}</div>
            </div>
            <div class="jcard-meta">
                <div class="jcard-meta-item">
                    <span class="jcard-meta-label">Eligibility</span>
                    <span class="jcard-meta-value">${escapeHtml(job.eligibility)}</span>
                </div>
                <div class="jcard-meta-item">
                    <span class="jcard-meta-label">Deadline</span>
                    <span class="jcard-meta-value">${escapeHtml(formatDate(job.applicationDeadline))}</span>
                </div>
                <div class="jcard-meta-item">
                    <span class="jcard-meta-label">Location</span>
                    <span class="jcard-meta-value">${escapeHtml(job.location || "Remote")}</span>
                </div>
            </div>
            <div class="jcard-actions">
                <button class="button primary sm" data-apply-job="${job.id}" type="button">Apply Now</button>
                <a class="button ghost sm" href="/jobs.html">View Listing</a>
            </div>
        </article>
        `;
    }).join("");

    availableJobsGrid.innerHTML = `<div class="cards-grid">${jobCards}</div>`;
}

function renderApplications() {
    if (!state.applications.length) {
        recentApplicationsGrid.innerHTML = emptyState("You have not applied for any jobs yet. Browse open roles to get started.");
        return;
    }

    const STATUS_STEPS = ["APPLIED", "IN_REVIEW", "SHORTLISTED", "SELECTED"];

    const appCards = state.applications.slice(0, 6).map((app) => {
        const currentIdx = STATUS_STEPS.indexOf(app.status);
        const isRejected = app.status === "REJECTED";

        const track = isRejected
            ? `<div class="status-track">
                <div class="status-track-step done">
                    <span class="status-track-label">Applied</span>
                </div>
                <div class="status-track-step status-track-step--rejected">
                    <span class="status-track-label">Rejected</span>
                </div>
               </div>`
            : `<div class="status-track">
                ${STATUS_STEPS.map((step, i) => `
                    <div class="status-track-step ${i < currentIdx ? "done" : i === currentIdx ? "current" : ""}">
                        <span class="status-track-label">${escapeHtml(titleCase(step))}</span>
                    </div>
                `).join("")}
               </div>`;

        return `
        <article class="appcard">
            <div class="appcard-top">
                <div>
                    <div class="appcard-title">${escapeHtml(app.jobTitle)}</div>
                    <div class="appcard-company">${escapeHtml(app.companyName)}</div>
                </div>
                <span class="status-pill ${statusTone(app.status)}">${escapeHtml(titleCase(app.status))}</span>
            </div>
            ${track}
            <div class="appcard-date">Applied ${escapeHtml(formatDateTime(app.createdAt))}</div>
        </article>
        `;
    }).join("");

    recentApplicationsGrid.innerHTML = `<div class="cards-grid">${appCards}</div>`;
}

function renderDashboardStats() {
    const applied = state.applications.length;
    const shortlisted = state.applications.filter(
        (a) => a.status === "SHORTLISTED" || a.status === "SELECTED"
    ).length;
    const hasResume = state.profile?.resume ? "Ready" : "Missing";

    statsGrid.innerHTML = `
        <div class="scard">
            <div class="scard-icon indigo">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <rect x="1.5" y="4.5" width="15" height="11" rx="1.5"/>
                    <path d="M5.5 4.5V3A1.5 1.5 0 0 1 7 1.5h4A1.5 1.5 0 0 1 12.5 3v1.5"/>
                    <line x1="1.5" y1="9" x2="16.5" y2="9"/>
                </svg>
            </div>
            <div class="scard-value">${state.jobs.length}</div>
            <div class="scard-label">Active Roles</div>
        </div>
        <div class="scard">
            <div class="scard-icon cyan">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M3 3h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
                    <line x1="5" y1="7" x2="13" y2="7"/><line x1="5" y1="10" x2="13" y2="10"/><line x1="5" y1="13" x2="9" y2="13"/>
                </svg>
            </div>
            <div class="scard-value">${applied}</div>
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
        <div class="scard">
            <div class="scard-icon ${hasResume === "Ready" ? "success" : "warning"}">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <path d="M4 2h7.5L14 4.5V16H4V2z"/><path d="M11 2v3h3"/>
                    <line x1="6" y1="8" x2="12" y2="8"/><line x1="6" y1="11" x2="12" y2="11"/>
                </svg>
            </div>
            <div class="scard-value">${hasResume}</div>
            <div class="scard-label">Resume</div>
        </div>
    `;
}

async function updateProfile(event) {
    event.preventDefault();
    hideMessage(messageElement);
    setButtonBusy(profileButton, true, "Saving...");

    try {
        const payload = await apiRequest("/api/students/me", {
            method: "PUT",
            body: {
                branch: document.getElementById("profileBranch").value.trim(),
                skills: document.getElementById("profileSkills").value.trim(),
                resume: document.getElementById("profileResume").value.trim()
            }
        });

        state.profile = payload.data;
        renderProfile();
        renderDashboardStats();
        renderAccountSnapshot();
        showMessage(messageElement, "Profile updated successfully.", "success");
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    } finally {
        setButtonBusy(profileButton, false);
    }
}

function handleJobActions(event) {
    const button = event.target.closest("[data-apply-job]");
    if (!button) {
        return;
    }

    const jobId = Number(button.dataset.applyJob);
    setPendingJob(jobId);
    window.location.href = `/applications.html?jobId=${jobId}`;
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
