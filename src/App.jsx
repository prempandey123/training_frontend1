import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout/Layout';

import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import UserList from './pages/Users/UserList';
import Training from './pages/Training/Training';
import SkillMatrix from './pages/SkillMatrix/SkillMatrix';
import Reports from './pages/Reports/Reports';
import CreateUser from './pages/Users/CreateUser';
import AddDesignation from './pages/Designations/AddDesignation';
import DesignationList from './pages/Designations/DesignationList';
import SkillList from './pages/Skills/SkillList';
import AddSkill from './pages/Skills/AddSkill';
import AddTraining from './pages/Training/AddTraining';
import MyProfile from './pages/Profile/MyProfile';
import Attendance from './pages/Attendance/Attendance';
import TrainingCalendar from './pages/Calendar/TrainingCalendar';
import EditSkill from './pages/Skills/EditSkill';
import EditUser from './pages/Users/EditUser';
import EditDesignation from './pages/Designations/EditDesignation';
import DepartmentList from './pages/Departments/DepartmentList';
import AddDepartment from './pages/Departments/AddDepartment';

function App() {
  return (
    <Routes>

      {/* LOGIN ROUTE (future use) */}
      <Route path="/login" element={<Login />} />

      {/* APP ROUTES */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/users/create" element={<CreateUser />} />
              <Route path="/training" element={<Training />} />
              <Route path="/training/add" element={<AddTraining />} />
              <Route path="/skill-matrix" element={<SkillMatrix />} />
              <Route path="/designations" element={<DesignationList />} />
              <Route path="/designations/add" element={<AddDesignation />} />
              <Route path="/skills" element={<SkillList />} />
              <Route path="/skills/add" element={<AddSkill />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/my-profile" element={<MyProfile />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/calendar" element={<TrainingCalendar />} />
              <Route path="/skills/edit/:id" element={<EditSkill />} />
              <Route path="/users/edit/:id" element={<EditUser />} />
              <Route path="/designations/edit/:id" element={<EditDesignation />} />
              <Route path="/departments" element={<DepartmentList />} />
              <Route path="/departments/add" element={<AddDepartment />} />


              
            </Routes>
          </Layout>
        }
      />

    </Routes>
  );
}

export default App;
