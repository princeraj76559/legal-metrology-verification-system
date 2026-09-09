import { AppLayout } from './layouts/AppLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicantDashboard } from './pages/applicant/ApplicantDashboard';
import { OfficerJobs } from './pages/officer/OfficerJobs';

const route = window.location.pathname;
const page = route.startsWith('/admin') ? <AdminDashboard /> : route.startsWith('/officer') ? <OfficerJobs /> : <ApplicantDashboard />;
const role = route.startsWith('/admin') ? 'ADMIN' : route.startsWith('/officer') ? 'OFFICER' : 'APPLICANT';

export default function App() { return <AppLayout role={role}>{page}</AppLayout>; }

