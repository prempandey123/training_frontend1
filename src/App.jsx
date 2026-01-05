import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import UserList from './pages/Users/UserList';
import Training from './pages/Training/Training';
import SkillMatrix from './pages/SkillMatrix/SkillMatrix';
import CompetencyMatrix from './pages/SkillMatrix/CompetencyMatrix';
import Reports from './pages/Reports/Reports';
import CreateUser from './pages/Users/CreateUser';
import AddDesignation from './pages/Designations/AddDesignation';
import DesignationList from './pages/Designations/DesignationList';
import SkillList from './pages/Skills/SkillList';
import CreateSkill from './pages/Skills/AddSkill';
import AddTraining from './pages/Training/AddTraining';
import MyProfile from './pages/Profile/MyProfile';
import Attendance from './pages/Attendance/Attendance';
import TrainingCalendar from './pages/Calendar/TrainingCalendar';
import SkillGap from './pages/SkillGap/SkillGap';
import TrainingRequirements from './pages/TrainingRequirements/TrainingRequirements';
import EditSkill from './pages/Skills/EditSkill';
import EditUser from './pages/Users/EditUser';
import MapDesignationSkills from './pages/Designations/MapDesignationSkills';
import DepartmentList from './pages/Departments/DepartmentList';
import AddDepartment from './pages/Departments/AddDepartment';
import UpdateUserPassword from './pages/UpdateUserPassword/UpdateUserPassword';
import OrgSkillMatrix from './pages/SkillMatrix/OrgSkillMatrix';
import OrgCompetencyMatrix from './pages/SkillMatrix/OrgCompetencyMatrix';
import AuditLogs from './pages/AuditLogs/AuditLogs';


export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected app */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path="users" element={<UserList />} />
        <Route path="users/create" element={<CreateUser />} />
        <Route path="users/edit/:id" element={<EditUser />} />

        <Route path="departments" element={<DepartmentList />} />
        <Route path="departments/add" element={<AddDepartment />} />

        <Route path="designations" element={<DesignationList />} />
        <Route path="designations/add" element={<AddDesignation />} />
        <Route path="designations/:id/map-skills" element={<MapDesignationSkills />} />

        <Route path="skills" element={<SkillList />} />
        <Route path="skills/add" element={<CreateSkill />} />
        <Route path="skills/edit/:id" element={<EditSkill />} />

        <Route path="training" element={<Training />} />
        <Route path="training/add" element={<AddTraining />} />

        <Route path="skill-matrix" element={<SkillMatrix />} />
        <Route path="skill-matrix/org" element={<OrgSkillMatrix />} />

        <Route path="competency-matrix" element={<CompetencyMatrix />} />
        <Route path="competency-matrix/org" element={<OrgCompetencyMatrix />} />
        <Route path="skill-gap" element={<SkillGap />} />
        <Route path="training-requirements" element={<TrainingRequirements />} />

        <Route path="calendar" element={<TrainingCalendar />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="my-profile" element={<MyProfile />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="/users/update-password" element={<UpdateUserPassword />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
