import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Command, Ellipsis, LayoutDashboard,
  ListFilter, Mail, MoreHorizontal, Pencil, Plus, Search, Settings2, ShieldCheck,
  Sparkles, Trash2, Users, X,
} from 'lucide-react';

const blankEmployee = {
  employeeId: '', firstName: '', lastName: '', email: '', phone: '', department: '',
  jobTitle: '', employmentType: 'Full-time', startDate: '', status: 'Active',
};
const departments = ['Engineering', 'Design', 'Marketing', 'People', 'Finance', 'Operations', 'Sales'];
const initials = (employee) => `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
const colors = ['#e8eaff', '#fce9df', '#e1f3eb', '#f4e7f7', '#e5effa', '#f8efda'];
const avatarColor = (id) => colors[Number(id || 0) % colors.length];

async function request(url, options) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result;
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [status, setStatus] = useState('All statuses');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankEmployee);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  async function loadEmployees() {
    setLoading(true);
    try {
      setEmployees(await request('/api/employees'));
      setLoadError('');
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesDepartment = department === 'All departments' || employee.department === department;
      const matchesStatus = status === 'All statuses' || employee.status === status;
      const searchable = [employee.firstName, employee.lastName, employee.employeeId, employee.email, employee.department, employee.jobTitle].join(' ').toLowerCase();
      return matchesDepartment && matchesStatus && (!query || searchable.includes(query));
    });
  }, [employees, search, department, status]);

  const activeCount = employees.filter((employee) => employee.status === 'Active').length;
  const departmentCount = new Set(employees.map((employee) => employee.department)).size;
  const recentCount = employees.filter((employee) => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return new Date(`${employee.startDate}T00:00:00`) >= monthAgo;
  }).length;

  function openCreate() {
    setEditing(null);
    setForm(blankEmployee);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(employee) {
    setEditing(employee);
    setForm(Object.fromEntries(Object.keys(blankEmployee).map((key) => [key, employee[key] || (key === 'status' ? 'Active' : '')])));
    setFormError('');
    setModalOpen(true);
  }

  async function submitEmployee(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await request(editing ? `/api/employees/${editing.id}` : '/api/employees', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setToast(editing ? 'Employee details updated' : 'Employee added to your directory');
      await loadEmployees();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Remove ${employee.firstName} ${employee.lastName} from the directory? This cannot be undone.`)) return;
    try {
      await request(`/api/employees/${employee.id}`, { method: 'DELETE' });
      setToast('Employee removed from your directory');
      await loadEmployees();
    } catch (error) {
      setToast(error.message);
    }
  }

  const fieldChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="People home"><span className="brand-mark"><span /><span /><span /><span /></span><span>people<span className="brand-dot">.</span></span></a>
        <div className="workspace-switcher"><div className="workspace-icon">N</div><div className="workspace-copy"><strong>Northstar Studio</strong><span>Workspace</span></div><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a href="#overview"><LayoutDashboard size={18} /> Overview</a>
          <a className="selected" href="#employees"><Users size={18} /> Employees <span className="nav-count">{employees.length}</span></a>
          <a href="#teams"><BriefcaseBusiness size={18} /> Teams</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><strong>Need a hand?</strong><p>Find answers and get the most out of People.</p><button type="button" className="help-link" onClick={() => setToast('Help center is coming soon')}>Visit help center <ArrowUpRight size={14} /></button></div>
          <button className="profile-button" type="button"><div className="profile-avatar">JD</div><div className="profile-copy"><strong>Jordan Davis</strong><span>Workspace admin</span></div><MoreHorizontal size={18} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Employees</strong></div><div className="topbar-actions"><button className="icon-button keyboard-hint" type="button" title="Quick search"><Command size={15} /><span>K</span></button><button className="top-help" type="button" onClick={() => setToast('Help center is coming soon')}><CircleHelp size={16} /> Help</button><div className="top-avatar">JD</div></div></header>

        <section className="page-wrap">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> PEOPLE OPERATIONS</div><h1>Your people, <span>all in one place.</span></h1><p className="page-subtitle">A little organization goes a long way. Manage your growing team here.</p></div><button className="primary-button" type="button" onClick={openCreate}><Plus size={17} strokeWidth={2.4} /> Add employee</button></div>

          <section className="stats-grid" aria-label="Employee summary">
            <article className="stat-card"><div className="stat-top"><span>Total employees</span><span className="stat-icon lavender"><Users size={17} /></span></div><div className="stat-value">{employees.length}<span className="stat-caption">people</span></div><div className="stat-foot"><span className="stat-trend"><ArrowUpRight size={14} /> {recentCount} joined</span><span>in the last 30 days</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Active members</span><span className="stat-icon mint"><ShieldCheck size={17} /></span></div><div className="stat-value">{activeCount}<span className="stat-caption">people</span></div><div className="stat-foot"><span className="active-dot" /> {employees.length ? `${Math.round((activeCount / employees.length) * 100)}% of your team` : 'Ready for your first hire'}</div></article>
            <article className="stat-card"><div className="stat-top"><span>Departments</span><span className="stat-icon peach"><BriefcaseBusiness size={17} /></span></div><div className="stat-value">{departmentCount}<span className="stat-caption">teams</span></div><div className="stat-foot">Across your organization</div></article>
            <article className="stat-card accent-stat"><div className="sparkle-orb"><Sparkles size={19} /></div><div className="accent-content"><span>Make room to grow</span><strong>Your people deserve a great start.</strong><button type="button" onClick={openCreate}>Add your first employee <ArrowUpRight size={14} /></button></div><div className="accent-shape shape-one" /><div className="accent-shape shape-two" /></article>
          </section>

          <section className="directory-card">
            <div className="directory-heading"><div><div className="section-title-line"><h2>All employees</h2><span className="total-pill">{filteredEmployees.length}</span></div><p>A complete list of everyone on your team.</p></div><button type="button" className="secondary-button" onClick={() => setToast('Your directory is up to date')}><ArrowDown size={15} /> Export list</button></div>
            <div className="toolbar"><label className="search-box"><Search size={17} /><input aria-label="Search employees" placeholder="Search by name, role, email..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label><div className="filter-controls"><label className="select-wrap"><ListFilter size={15} /><select aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option>{[...new Set([...departments, ...employees.map((employee) => employee.department)])].sort().map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={14} /></label><label className="select-wrap status-select"><span className="filter-dot" /><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>On leave</option><option>Inactive</option></select><ChevronDown size={14} /></label><button type="button" className="filter-button" title="Filters"><Settings2 size={16} /></button></div></div>
            {loadError ? <div className="message-state error-state"><div className="state-icon"><CircleHelp size={21} /></div><h3>We couldn’t load your team</h3><p>{loadError}</p><button type="button" className="secondary-button" onClick={loadEmployees}>Try again</button></div> : loading ? <div className="loading-state"><span className="spinner" />Loading your directory…</div> : filteredEmployees.length ? <div className="table-scroll"><table><thead><tr><th><span className="check-box" /></th><th>EMPLOYEE <ArrowDown size={12} /></th><th>DEPARTMENT</th><th>JOB TITLE</th><th>EMPLOYMENT</th><th>START DATE</th><th>STATUS</th><th aria-label="Actions" /></tr></thead><tbody>{filteredEmployees.map((employee) => <tr key={employee.id}><td><span className="check-box" /></td><td><div className="employee-cell"><div className="employee-avatar" style={{ backgroundColor: avatarColor(employee.id) }}>{initials(employee)}</div><div className="employee-info"><strong>{employee.firstName} {employee.lastName}</strong><span>{employee.email}</span></div></div></td><td><span className="department-name"><span className="department-mark">{employee.department.slice(0, 1).toUpperCase()}</span>{employee.department}</span></td><td className="role-cell">{employee.jobTitle}</td><td><span className="employment-label">{employee.employmentType}</span></td><td className="date-cell"><CalendarDays size={14} />{new Date(`${employee.startDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className={`status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}><span />{employee.status}</span></td><td><div className="row-actions"><button type="button" aria-label={`Edit ${employee.firstName} ${employee.lastName}`} onClick={() => openEdit(employee)}><Pencil size={15} /></button><button type="button" aria-label={`Delete ${employee.firstName} ${employee.lastName}`} onClick={() => deleteEmployee(employee)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table><div className="table-footer"><span>Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees</span><div className="pagination"><button type="button" disabled aria-label="Previous page"><ChevronLeft size={16} /></button><span>1</span><button type="button" disabled aria-label="Next page"><ChevronRight size={16} /></button></div></div></div> : <div className="message-state"><div className="empty-illustration"><div className="empty-person"><span /><span /><span /></div><div className="empty-sparkle"><Sparkles size={17} /></div></div><h3>{employees.length ? 'No matching employees' : 'Every great team starts somewhere'}</h3><p>{employees.length ? 'Try adjusting your search or filters.' : 'Add your first team member to get your people directory started.'}</p>{employees.length ? <button type="button" className="text-button" onClick={() => { setSearch(''); setDepartment('All departments'); setStatus('All statuses'); }}>Clear filters</button> : <button type="button" className="primary-button" onClick={openCreate}><Plus size={16} /> Add your first employee</button>}</div>}
          </section>
          <footer className="page-footer"><span>Made for the people who make it happen <span className="footer-heart">♥</span></span><span>People directory <span className="footer-divider">·</span> Private workspace</span></footer>
        </section>
      </main>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="employee-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><div className="modal-kicker">PEOPLE DIRECTORY</div><h2 id="modal-title">{editing ? 'Edit employee' : 'Add a new employee'}</h2><p>{editing ? 'Update their details below.' : 'Add someone wonderful to your team.'}</p></div><button type="button" className="close-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={19} /></button></div><form onSubmit={submitEmployee}><div className="form-grid"><label className="form-field"><span>First name <i>*</i></span><input name="firstName" value={form.firstName} onChange={fieldChange} placeholder="e.g. Alex" required maxLength={200} autoFocus /></label><label className="form-field"><span>Last name <i>*</i></span><input name="lastName" value={form.lastName} onChange={fieldChange} placeholder="e.g. Morgan" required maxLength={200} /></label><label className="form-field"><span>Employee ID <i>*</i></span><input name="employeeId" value={form.employeeId} onChange={fieldChange} placeholder="e.g. NS-1042" required maxLength={200} /></label><label className="form-field"><span>Work email <i>*</i></span><div className="input-with-icon"><Mail size={15} /><input name="email" type="email" value={form.email} onChange={fieldChange} placeholder="alex@company.com" required maxLength={200} /></div></label><label className="form-field"><span>Department <i>*</i></span><select name="department" value={form.department} onChange={fieldChange} required><option value="" disabled>Select department</option>{[...new Set([...departments, ...(form.department ? [form.department] : [])])].sort().map((name) => <option key={name}>{name}</option>)}</select></label><label className="form-field"><span>Job title <i>*</i></span><input name="jobTitle" value={form.jobTitle} onChange={fieldChange} placeholder="e.g. Product designer" required maxLength={200} /></label><label className="form-field"><span>Phone number</span><input name="phone" type="tel" value={form.phone} onChange={fieldChange} placeholder="+1 (555) 000-0000" maxLength={200} /></label><label className="form-field"><span>Employment type</span><select name="employmentType" value={form.employmentType} onChange={fieldChange}>{['Full-time', 'Part-time', 'Contract', 'Intern'].map((type) => <option key={type}>{type}</option>)}</select></label><label className="form-field"><span>Start date <i>*</i></span><input name="startDate" type="date" value={form.startDate} onChange={fieldChange} required /></label><label className="form-field"><span>Status</span><select name="status" value={form.status} onChange={fieldChange}>{['Active', 'On leave', 'Inactive'].map((option) => <option key={option}>{option}</option>)}</select></label></div>{formError && <div className="form-error" role="alert">{formError}</div>}<div className="modal-footer"><span><i>*</i> Required fields</span><div><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? <><Check size={16} /> Save changes</> : <><Plus size={16} /> Add employee</>}</button></div></div></form></section></div>}
      {toast && <div className="toast" role="status"><span><Check size={15} /></span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}

export default App;
