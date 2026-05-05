import {
    apiRequest,
    apiUpload,
    escapeHtml,
    requireAuth
} from "./api.js";
import {
    consumeFlashInto,
    emptyState,
    hideMessage,
    initializeLayout,
    setButtonBusy,
    setPageBusy,
    showMessage
} from "./common.js";

const state = { user: null, profile: null };

const messageElement = document.getElementById("pageMessage");
const profileSnapshot = document.getElementById("profileSnapshot");
const profileForm = document.getElementById("profileForm");
const profileSaveBtn = document.getElementById("profileSaveBtn");
const resumeFile = document.getElementById("resumeFile");
const resumeZone = document.getElementById("resumeZone");
const resumeZoneLabel = document.getElementById("resumeZoneLabel");
const resumeCurrentHint = document.getElementById("resumeCurrentHint");

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setPageBusy(true, "Loading profile...");
    const user = await requireAuth(["STUDENT"]);
    if (!user) { setPageBusy(false); return; }

    state.user = user;
    initializeLayout("profile", user);
    consumeFlashInto(messageElement);

    profileForm.addEventListener("submit", handleSave);
    resumeFile.addEventListener("change", handleFileChange);

    try {
        const payload = await apiRequest("/api/students/me");
        state.profile = payload.data;
        renderSnapshot();
        populateForm();
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    } finally {
        setPageBusy(false);
    }
}

function renderSnapshot() {
    if (!state.profile) {
        profileSnapshot.innerHTML = emptyState("Profile not found.");
        return;
    }

    const initials = state.user.name
        .split(" ").slice(0, 2).map((p) => p.charAt(0)).join("");

    const skillTags = (state.profile.skills || "")
        .split(",").map((s) => s.trim()).filter(Boolean)
        .map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`)
        .join("");

    profileSnapshot.innerHTML = `
        <div class="profile-avatar-row">
            <div class="profile-avatar">${escapeHtml(initials)}</div>
            <div>
                <div class="profile-card-name">${escapeHtml(state.user.name)}</div>
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

function populateForm() {
    document.getElementById("profileBranch").value = state.profile?.branch || "";
    document.getElementById("profileSkills").value = state.profile?.skills || "";
    syncResumeHint();
}

function syncResumeHint() {
    if (state.profile?.resume) {
        const filename = state.profile.resume.split("/").pop();
        resumeCurrentHint.innerHTML = `Current: <a href="${escapeHtml(state.profile.resume)}" target="_blank" rel="noopener">${escapeHtml(filename)}</a>`;
    } else {
        resumeCurrentHint.textContent = "No resume uploaded yet.";
    }
}

function handleFileChange() {
    const file = resumeFile.files[0];
    if (!file) { resetZone(); return; }

    if (file.type !== "application/pdf") {
        showMessage(messageElement, "Only PDF files are allowed.", "error");
        resetZone();
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showMessage(messageElement, "File size must not exceed 2 MB.", "error");
        resetZone();
        return;
    }
    resumeZoneLabel.textContent = file.name;
    resumeZone.classList.add("has-file");
    hideMessage(messageElement);
}

function resetZone() {
    resumeFile.value = "";
    resumeZoneLabel.textContent = "Click to choose PDF";
    resumeZone.classList.remove("has-file");
}

async function handleSave(event) {
    event.preventDefault();
    hideMessage(messageElement);
    setButtonBusy(profileSaveBtn, true, "Saving...");

    try {
        const file = resumeFile.files[0];
        if (file) {
            setButtonBusy(profileSaveBtn, true, "Uploading resume...");
            const formData = new FormData();
            formData.append("file", file);
            const uploadPayload = await apiUpload("/api/students/me/resume", formData);
            state.profile = uploadPayload.data;
            resetZone();
        }

        setButtonBusy(profileSaveBtn, true, "Saving...");
        const payload = await apiRequest("/api/students/me", {
            method: "PUT",
            body: {
                branch: document.getElementById("profileBranch").value.trim(),
                skills: document.getElementById("profileSkills").value.trim(),
                resume: state.profile?.resume || ""
            }
        });

        state.profile = payload.data;
        renderSnapshot();
        syncResumeHint();
        showMessage(messageElement, "Profile updated successfully.", "success");
    } catch (error) {
        showMessage(messageElement, error.message, "error");
    } finally {
        setButtonBusy(profileSaveBtn, false);
    }
}
