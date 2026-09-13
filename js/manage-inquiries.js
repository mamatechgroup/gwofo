// Manage Inquiries & Applications Controller - GWOFO Admin Panel

class ManageInquiries {
    constructor() {
        this.currentTab = 'contact'; // 'contact' | 'partner' | 'volunteer'
        this.records = [];
        this.filtered = [];
        this.init();
    }

    async init() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadStats();
        await this.loadCurrentTab();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.type;
                this.loadCurrentTab();
            });
        });

        // Filters and search
        const statusFilter = document.getElementById('inquiryStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.search(e.target.value));
        }

        // Mobile drawer toggle
        const toggleBtn = document.querySelector('.mobile-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        if (toggleBtn && sidebar) {
            let overlay = document.querySelector('.admin-sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'admin-sidebar-overlay';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.documentElement.classList.remove('nav-open');
                    document.body.classList.remove('nav-open');
                });
                overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            }
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
                if (sidebar.classList.contains('active')) {
                    overlay.classList.add('active');
                    document.documentElement.classList.add('nav-open');
                    document.body.classList.add('nav-open');
                } else {
                    overlay.classList.remove('active');
                    document.documentElement.classList.remove('nav-open');
                    document.body.classList.remove('nav-open');
                }
            });
        }
    }

    async loadStats() {
        try {
            const res = await Inquiries.getStats();
            if (res.success && res.data) {
                const d = res.data;
                const contactCount = document.getElementById('statContactCount');
                const partnerCount = document.getElementById('statPartnerCount');
                const volunteerCount = document.getElementById('statVolunteerCount');
                const pendingAction = document.getElementById('statPendingAction');

                if (contactCount) contactCount.textContent = d.total_contacts || 0;
                if (partnerCount) partnerCount.textContent = d.total_partnerships || 0;
                if (volunteerCount) volunteerCount.textContent = d.total_volunteers || 0;
                if (pendingAction) pendingAction.textContent = (d.new_contacts || 0) + (d.pending_volunteers || 0);

                const badgeC = document.getElementById('badgeContact');
                const badgeP = document.getElementById('badgePartner');
                const badgeV = document.getElementById('badgeVolunteer');
                if (badgeC) badgeC.textContent = d.total_contacts || 0;
                if (badgeP) badgeP.textContent = d.total_partnerships || 0;
                if (badgeV) badgeV.textContent = d.total_volunteers || 0;
            }
            window.updateSidebarBadges?.();
        } catch (err) {
            console.warn('Error loading inquiries stats:', err);
        }
    }

    async loadCurrentTab() {
        this.renderHeader();
        const tbody = document.getElementById('inquiryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p style="margin-top:10px;">Loading ${this.currentTab} records...</p>
                    </td>
                </tr>`;
        }

        try {
            const status = document.getElementById('inquiryStatusFilter')?.value || 'all';
            const filterVal = status === 'all' ? null : status;
            const res = await Inquiries.getAll(this.currentTab, filterVal);

            if (res.success && Array.isArray(res.data)) {
                this.records = res.data;
                this.applyFilters();
            } else {
                this.showError('Failed to load records.');
            }
        } catch (err) {
            console.error('Error fetching records:', err);
            this.showError('Error connecting to server: ' + err.message);
            if (err.message && err.message.includes('401')) {
                setTimeout(() => window.location.href = 'login.html', 1500);
            }
        }
    }

    renderHeader() {
        const thead = document.getElementById('inquiryTableHeader');
        if (!thead) return;

        if (this.currentTab === 'contact') {
            thead.innerHTML = `
                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left;">
                    <th style="padding:14px 16px;">Sender Name</th>
                    <th style="padding:14px 16px;">Email &amp; Phone</th>
                    <th style="padding:14px 16px;">Subject</th>
                    <th style="padding:14px 16px;">Message</th>
                    <th style="padding:14px 16px;">Date</th>
                    <th style="padding:14px 16px;">Status</th>
                    <th style="padding:14px 16px; text-align:center;">Actions</th>
                </tr>`;
        } else if (this.currentTab === 'partner') {
            thead.innerHTML = `
                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left;">
                    <th style="padding:14px 16px;">Organization</th>
                    <th style="padding:14px 16px;">Contact Person</th>
                    <th style="padding:14px 16px;">Partnership Type</th>
                    <th style="padding:14px 16px;">Proposed Scope</th>
                    <th style="padding:14px 16px;">Submitted</th>
                    <th style="padding:14px 16px;">Status</th>
                    <th style="padding:14px 16px; text-align:center;">Actions</th>
                </tr>`;
        } else {
            thead.innerHTML = `
                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left;">
                    <th style="padding:14px 16px;">Applicant Name</th>
                    <th style="padding:14px 16px;">Location &amp; Contact</th>
                    <th style="padding:14px 16px;">Volunteer Track</th>
                    <th style="padding:14px 16px;">Skills &amp; Motivation</th>
                    <th style="padding:14px 16px;">Applied</th>
                    <th style="padding:14px 16px;">Status</th>
                    <th style="padding:14px 16px; text-align:center;">Actions</th>
                </tr>`;
        }
    }

    applyFilters() {
        const status = document.getElementById('inquiryStatusFilter')?.value || 'all';
        this.filtered = this.records.filter(r => {
            if (status === 'all') return true;
            return r.status === status;
        });
        this.render();
    }

    search(query) {
        const q = (query || '').toLowerCase().trim();
        if (!q) {
            this.applyFilters();
            return;
        }

        this.filtered = this.records.filter(r => {
            const str = JSON.stringify(r).toLowerCase();
            return str.includes(q);
        });

        this.render();
    }

    render() {
        const tbody = document.getElementById('inquiryTableBody');
        if (!tbody) return;

        if (this.filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
                        <i class="fas fa-inbox fa-2x" style="margin-bottom:10px; opacity:0.5;"></i>
                        <p>No records found in ${this.currentTab}.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = this.filtered.map(r => {
            const dateStr = new Date(r.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            const status = r.status || 'new';
            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            if (status === 'new' || status === 'pending') {
                badgeBg = '#fef3c7'; badgeColor = '#d97706';
            } else if (status === 'responded' || status === 'approved') {
                badgeBg = '#dcfce7'; badgeColor = '#16a34a';
            } else if (status === 'rejected' || status === 'archived') {
                badgeBg = '#fee2e2'; badgeColor = '#dc2626';
            }

            if (this.currentTab === 'contact') {
                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:14px 16px; font-weight:600; color:#0f172a;">${this.escapeHtml(r.name)}</td>
                        <td style="padding:14px 16px;">
                            <div><a href="mailto:${this.escapeHtml(r.email)}" style="color:#003366;">${this.escapeHtml(r.email)}</a></div>
                            <small style="color:#64748b;">${this.escapeHtml(r.phone || 'No phone')}</small>
                        </td>
                        <td style="padding:14px 16px; font-weight:500;">${this.escapeHtml(r.subject || 'General')}</td>
                        <td style="padding:14px 16px; max-width:260px; font-size:0.9rem; color:#334155;">${this.escapeHtml(r.message)}</td>
                        <td style="padding:14px 16px; font-size:0.85rem; color:#64748b; white-space:nowrap;">${dateStr}</td>
                        <td style="padding:14px 16px;">
                            <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; text-transform:capitalize;">
                                ${status}
                            </span>
                        </td>
                        <td style="padding:14px 16px; text-align:center; white-space:nowrap;">
                            <button onclick="manageInquiries.viewRecord('${this.currentTab}', ${r.id})" title="View Details" style="background:#003366; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${status !== 'responded' ? `
                                <button onclick="manageInquiries.updateStatus('${this.currentTab}', ${r.id}, 'responded')" title="Mark as Responded" style="background:#16a34a; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button onclick="manageInquiries.deleteRecord('${this.currentTab}', ${r.id})" title="Delete Message" style="background:#dc2626; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>`;
            } else if (this.currentTab === 'partner') {
                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:14px 16px; font-weight:600; color:#0f172a;">
                            ${this.escapeHtml(r.organization_name)}
                            ${r.website ? `<br><a href="${this.escapeHtml(r.website)}" target="_blank" style="font-size:0.75rem; color:#003366;">${this.escapeHtml(r.website)}</a>` : ''}
                        </td>
                        <td style="padding:14px 16px;">
                            <div style="font-weight:600;">${this.escapeHtml(r.contact_name)}</div>
                            <div style="font-size:0.82rem;"><a href="mailto:${this.escapeHtml(r.email)}" style="color:#003366;">${this.escapeHtml(r.email)}</a></div>
                            <small style="color:#64748b;">${this.escapeHtml(r.phone || '')}</small>
                        </td>
                        <td style="padding:14px 16px;"><span style="background:#f1f5f9; padding:3px 8px; border-radius:6px; font-size:0.8rem;">${this.escapeHtml(r.partnership_type || 'General')}</span></td>
                        <td style="padding:14px 16px; max-width:240px; font-size:0.88rem; color:#334155;">${this.escapeHtml(r.proposed_collaboration || r.message || '')}</td>
                        <td style="padding:14px 16px; font-size:0.85rem; color:#64748b; white-space:nowrap;">${dateStr}</td>
                        <td style="padding:14px 16px;">
                            <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; text-transform:capitalize;">
                                ${status}
                            </span>
                        </td>
                        <td style="padding:14px 16px; text-align:center; white-space:nowrap;">
                            <button onclick="manageInquiries.viewRecord('${this.currentTab}', ${r.id})" title="View Details" style="background:#003366; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="manageInquiries.updateStatus('${this.currentTab}', ${r.id}, 'approved')" title="Approve Proposal" style="background:#16a34a; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="manageInquiries.updateStatus('${this.currentTab}', ${r.id}, 'rejected')" title="Archive Proposal" style="background:#d97706; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-archive"></i>
                            </button>
                            <button onclick="manageInquiries.deleteRecord('${this.currentTab}', ${r.id})" title="Delete" style="background:#dc2626; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>`;
            } else {
                return `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:14px 16px; font-weight:600; color:#0f172a;">${this.escapeHtml(r.full_name)}</td>
                        <td style="padding:14px 16px;">
                            <div><i class="fas fa-map-marker-alt" style="color:#64748b;"></i> ${this.escapeHtml(r.location || 'Liberia')}</div>
                            <div style="font-size:0.82rem;"><a href="mailto:${this.escapeHtml(r.email)}" style="color:#003366;">${this.escapeHtml(r.email)}</a></div>
                            <small style="color:#64748b;">${this.escapeHtml(r.phone || '')}</small>
                        </td>
                        <td style="padding:14px 16px;"><span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:6px; font-size:0.8rem; font-weight:600;">${this.escapeHtml(r.volunteer_type || 'local')}</span></td>
                        <td style="padding:14px 16px; max-width:240px; font-size:0.88rem; color:#334155;">
                            <strong>Skills:</strong> ${this.escapeHtml(r.skills || 'N/A')}<br>
                            <small style="color:#64748b;">${this.escapeHtml(r.motivation ? r.motivation.slice(0, 80) + '...' : '')}</small>
                        </td>
                        <td style="padding:14px 16px; font-size:0.85rem; color:#64748b; white-space:nowrap;">${dateStr}</td>
                        <td style="padding:14px 16px;">
                            <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; text-transform:capitalize;">
                                ${status}
                            </span>
                        </td>
                        <td style="padding:14px 16px; text-align:center; white-space:nowrap;">
                            <button onclick="manageInquiries.viewRecord('${this.currentTab}', ${r.id})" title="View Details" style="background:#003366; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="manageInquiries.updateStatus('${this.currentTab}', ${r.id}, 'approved')" title="Approve Volunteer" style="background:#16a34a; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="manageInquiries.updateStatus('${this.currentTab}', ${r.id}, 'rejected')" title="Reject" style="background:#d97706; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; margin-right:4px;">
                                <i class="fas fa-times"></i>
                            </button>
                            <button onclick="manageInquiries.deleteRecord('${this.currentTab}', ${r.id})" title="Delete Application" style="background:#dc2626; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>`;
            }
        }).join('');
    }

    viewRecord(type, id) {
        const r = this.records.find(item => item.id === id);
        if (!r) return;

        const dateStr = new Date(r.created_at).toLocaleString();
        const existingModal = document.getElementById('inquiryDetailModal');
        if (existingModal) existingModal.remove();

        let title = 'Inquiry Details';
        let contentHtml = '';
        let actionButtons = '';

        if (type === 'contact') {
            title = 'Contact Message';
            contentHtml = `
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">From</div>
                    <div style="font-size:1rem;font-weight:600;color:#0f172a;margin-top:2px;">${this.escapeHtml(r.name)}</div>
                    <div style="font-size:0.88rem;color:#475569;margin-top:2px;">
                        <a href="mailto:${this.escapeHtml(r.email)}" style="color:#003366;">${this.escapeHtml(r.email)}</a> ${r.phone ? '· ' + this.escapeHtml(r.phone) : ''}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Subject</div>
                    <div style="font-size:0.95rem;font-weight:500;color:#1e293b;margin-top:2px;">${this.escapeHtml(r.subject || 'General Inquiry')}</div>
                </div>
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Message</div>
                    <div style="margin-top:4px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.92rem;color:#334155;line-height:1.6;white-space:pre-wrap;max-height:180px;overflow-y:auto;">
                        ${this.escapeHtml(r.message)}
                    </div>
                </div>
            `;
            actionButtons = `
                ${r.status !== 'responded' ? `
                    <button id="inqModalRespondBtn" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                        <i class="fas fa-check"></i> Mark Responded
                    </button>
                ` : ''}
                <button id="inqModalDeleteBtn" style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            `;
        } else if (type === 'partner') {
            title = 'Partnership Proposal';
            contentHtml = `
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Organization</div>
                    <div style="font-size:1.05rem;font-weight:600;color:#0f172a;margin-top:2px;">${this.escapeHtml(r.organization_name)}</div>
                    ${r.website ? `<div style="font-size:0.85rem;"><a href="${this.escapeHtml(r.website)}" target="_blank" style="color:#003366;">${this.escapeHtml(r.website)}</a></div>` : ''}
                </div>
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Contact Person</div>
                    <div style="font-size:0.92rem;color:#1e293b;margin-top:2px;">${this.escapeHtml(r.contact_name)} &lt;<a href="mailto:${this.escapeHtml(r.email)}" style="color:#003366;">${this.escapeHtml(r.email)}</a>&gt;</div>
                    ${r.phone ? `<small style="color:#64748b;">Phone: ${this.escapeHtml(r.phone)}</small>` : ''}
                </div>
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Proposal Details</div>
                    <div style="margin-top:4px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.92rem;color:#334155;line-height:1.6;white-space:pre-wrap;max-height:180px;overflow-y:auto;">
                        ${this.escapeHtml(r.proposed_collaboration || r.message || r.details || 'No details provided')}
                    </div>
                </div>
            `;
            actionButtons = `
                <button id="inqModalApproveBtn" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-check"></i> Approve Proposal
                </button>
                <button id="inqModalRejectBtn" style="background:#d97706;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-archive"></i> Archive Proposal
                </button>
                <button id="inqModalDeleteBtn" style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            `;
        } else {
            title = 'Volunteer Application';
            contentHtml = `
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Applicant</div>
                    <div style="font-size:1.05rem;font-weight:600;color:#0f172a;margin-top:2px;">${this.escapeHtml(r.full_name)}</div>
                    <div style="font-size:0.88rem;color:#475569;margin-top:2px;">
                        <a href="mailto:${this.escapeHtml(r.email)}" style="color:#003366;">${this.escapeHtml(r.email)}</a> ${r.phone ? '· ' + this.escapeHtml(r.phone) : ''} · Location: ${this.escapeHtml(r.location || 'Liberia')}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Skills & Availability</div>
                    <div style="font-size:0.92rem;color:#1e293b;margin-top:2px;"><strong>Skills:</strong> ${this.escapeHtml(r.skills || 'N/A')}</div>
                    ${r.availability ? `<div style="font-size:0.88rem;color:#64748b;margin-top:2px;">Availability: ${this.escapeHtml(r.availability)}</div>` : ''}
                </div>
                <div>
                    <div style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Motivation</div>
                    <div style="margin-top:4px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:0.92rem;color:#334155;line-height:1.6;white-space:pre-wrap;max-height:180px;overflow-y:auto;">
                        ${this.escapeHtml(r.motivation || 'No motivation note')}
                    </div>
                </div>
            `;
            actionButtons = `
                <button id="inqModalApproveBtn" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-check"></i> Approve Application
                </button>
                <button id="inqModalRejectBtn" style="background:#d97706;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button id="inqModalDeleteBtn" style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            `;
        }

        const modal = document.createElement('div');
        modal.id = 'inquiryDetailModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box;';

        modal.innerHTML = `
            <div style="background:#fff;border-radius:12px;max-width:580px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;animation:fadeIn 0.2s ease-out;">
                <div style="padding:18px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:1.15rem;color:#0f172a;display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-inbox" style="color:#003366;"></i> ${title}
                    </h3>
                    <button id="closeInquiryModal" style="background:none;border:none;font-size:1.25rem;color:#64748b;cursor:pointer;padding:4px;">&times;</button>
                </div>
                <div style="padding:24px;display:flex;flex-direction:column;gap:14px;">
                    ${contentHtml}
                    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #f1f5f9;">
                        <div>
                            <span style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;">Received: </span>
                            <span style="font-size:0.85rem;color:#475569;">${dateStr}</span>
                        </div>
                        <div>
                            <span style="padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;text-transform:capitalize;background:#f1f5f9;color:#334155;">
                                ${r.status || 'new'}
                            </span>
                        </div>
                    </div>
                </div>
                <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
                    ${actionButtons}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('#closeInquiryModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        modal.querySelector('#inqModalRespondBtn')?.addEventListener('click', async () => {
            await this.updateStatus(type, id, 'responded');
            closeModal();
        });
        modal.querySelector('#inqModalApproveBtn')?.addEventListener('click', async () => {
            await this.updateStatus(type, id, 'approved');
            closeModal();
        });
        modal.querySelector('#inqModalRejectBtn')?.addEventListener('click', async () => {
            await this.updateStatus(type, id, 'rejected');
            closeModal();
        });
        modal.querySelector('#inqModalDeleteBtn')?.addEventListener('click', async () => {
            await this.deleteRecord(type, id);
            closeModal();
        });

        // Automatically mark unread contact messages as read when viewed
        if (type === 'contact' && (r.status === 'unread' || r.status === 'new')) {
            this.updateStatus(type, id, 'read');
        }
    }

    async updateStatus(type, id, newStatus) {
        try {
            const res = await Inquiries.updateStatus(type, id, newStatus);
            if (res.success) {
                const target = this.records.find(r => r.id === id);
                if (target) target.status = newStatus;
                this.applyFilters();
                this.loadStats();
                window.updateSidebarBadges?.();
            } else {
                alert(res.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Status update error:', err);
            alert('Failed to update status: ' + err.message);
        }
    }

    async deleteRecord(type, id) {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const res = await Inquiries.delete(type, id);
            if (res.success) {
                this.records = this.records.filter(r => r.id !== id);
                this.applyFilters();
                this.loadStats();
                window.updateSidebarBadges?.();
            } else {
                alert(res.error || 'Failed to delete record');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete record: ' + err.message);
        }
    }

    showError(msg) {
        const tbody = document.getElementById('inquiryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:#dc2626;">
                        <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom:10px;"></i>
                        <p>${this.escapeHtml(msg)}</p>
                    </td>
                </tr>`;
        }
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}

const manageInquiries = new ManageInquiries();
window.manageInquiries = manageInquiries;
