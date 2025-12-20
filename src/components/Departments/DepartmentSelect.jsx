import { useEffect, useState } from 'react';
import { getDepartments } from './../../api/departmentApi';
import './departmentSelect.css';

export default function DepartmentSelect({ value, onChange }) {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getDepartments().then((res) => {
      setDepartments(res.data);
    });
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="dept-select">
      <input
        type="text"
        placeholder="Type department name..."
        value={value || search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange('');
          setOpen(true);
        }}
      />

      {open && filtered.length > 0 && (
        <div className="dept-dropdown">
          {filtered.map((dept) => (
            <div
              key={dept.id}
              className="dept-option"
              onClick={() => {
                onChange(dept.name); // 🔥 string as backend expects
                setSearch(dept.name);
                setOpen(false);
              }}
            >
              {dept.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
