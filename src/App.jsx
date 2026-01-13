import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { getAuthUser } from './utils/auth';

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
  const role = String(getAuthUser()?.role || '').toUpperCase();
  const isHOD = role === 'HOD';

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
        {/* HOD should not see Dashboard; send directly to Skills */}
        <Route index element={isHOD ? <Navigate to="/skills" replace /> : <Dashboard />} />

        <Route
          path="users"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <UserList />
            </RoleRoute>
          }
        />
        <Route
          path="users/create"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <CreateUser />
            </RoleRoute>
          }
        />
        <Route
          path="users/edit/:id"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <EditUser />
            </RoleRoute>
          }
        />

        <Route
          path="departments"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <DepartmentList />
            </RoleRoute>
          }
        />
        <Route
          path="departments/add"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <AddDepartment />
            </RoleRoute>
          }
        />

        <Route
          path="designations"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <DesignationList />
            </RoleRoute>
          }
        />
        <Route
          path="designations/add"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <AddDesignation />
            </RoleRoute>
          }
        />
        <Route
          path="designations/:id/map-skills"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <MapDesignationSkills />
            </RoleRoute>
          }
        />

        <Route
          path="skills"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <SkillList />
            </RoleRoute>
          }
        />
        <Route
          path="skills/add"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <CreateSkill />
            </RoleRoute>
          }
        />
        <Route
          path="skills/edit/:id"
          element={
            <RoleRoute allow={["ADMIN", "HR", "HOD"]}>
              <EditSkill />
            </RoleRoute>
          }
        />

        <Route
          path="training"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <Training />
            </RoleRoute>
          }
        />
        <Route
          path="training/add"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <AddTraining />
            </RoleRoute>
          }
        />

        <Route
          path="skill-matrix"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <SkillMatrix />
            </RoleRoute>
          }
        />
        <Route
          path="skill-matrix/org"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <OrgSkillMatrix />
            </RoleRoute>
          }
        />

        <Route
          path="competency-matrix"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <CompetencyMatrix />
            </RoleRoute>
          }
        />
        <Route
          path="competency-matrix/org"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <OrgCompetencyMatrix />
            </RoleRoute>
          }
        />
        <Route
          path="skill-gap"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <SkillGap />
            </RoleRoute>
          }
        />
        <Route
          path="training-requirements"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <TrainingRequirements />
            </RoleRoute>
          }
        />

        <Route
          path="calendar"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <TrainingCalendar />
            </RoleRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <Attendance />
            </RoleRoute>
          }
        />
        <Route
          path="my-profile"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <MyProfile />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AuditLogs />
            </RoleRoute>
          }
        />
        <Route
          path="/users/update-password"
          element={
            <RoleRoute allow={["ADMIN", "HR"]}>
              <UpdateUserPassword />
            </RoleRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
