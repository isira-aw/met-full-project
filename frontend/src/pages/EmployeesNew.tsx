import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Modal, Input, Select, LoadingSpinner, ErrorMessage, StatusBadge } from '../components/ui';
import { useApi } from '../hooks/useApi';
import ApiService from '../services/api';

interface Employee {
  email: string;
  name: string;
  contactNumber: string;
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: string;
}

const EmployeesNew: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // API hooks with automatic loading/error handling
  const {
    data: employees,
    loading: loadingEmployees,
    error: employeesError,
    execute: fetchEmployees,
  } = useApi<Employee[]>(ApiService.getAllEmployees);

  const {
    loading: creatingEmployee,
    error: createError,
    execute: createEmployee,
  } = useApi(ApiService.createEmployee);

  const {
    loading: updatingEmployee,
    error: updateError,
    execute: updateEmployee,
  } = useApi(ApiService.updateEmployee);

  const {
    loading: deletingEmployee,
    execute: deleteEmployee,
  } = useApi(ApiService.deleteEmployee);

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle create employee
  const handleCreate = async (formData: any) => {
    const result = await createEmployee(formData);
    if (result) {
      setIsCreateModalOpen(false);
      fetchEmployees(); // Refresh list
    }
  };

  // Handle update employee
  const handleUpdate = async (email: string, formData: any) => {
    const result = await updateEmployee(email, formData);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees(); // Refresh list
    }
  };

  // Handle delete employee
  const handleDelete = async (email: string) => {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      const result = await deleteEmployee(email);
      if (result) {
        fetchEmployees(); // Refresh list
      }
    }
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Name',
      accessor: 'name' as keyof Employee,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof Employee,
    },
    {
      header: 'Contact',
      accessor: 'contactNumber' as keyof Employee,
    },
    {
      header: 'Role',
      accessor: ((row: Employee) => (
        <StatusBadge
          status={row.role === 'ADMIN' ? 'COMPLETED' : 'PENDING'}
        />
      )) as any,
    },
    {
      header: 'Actions',
      accessor: ((row: Employee) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedEmployee(row);
              setIsEditModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.email)}
            loading={deletingEmployee}
          >
            Delete
          </Button>
        </div>
      )) as any,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage employee accounts and permissions
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            + Add Employee
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        {loadingEmployees && <LoadingSpinner message="Loading employees..." />}

        {employeesError && (
          <ErrorMessage message={employeesError} onRetry={fetchEmployees} />
        )}

        {!loadingEmployees && !employeesError && employees && (
          <>
            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Admins</p>
                <p className="text-2xl font-bold text-green-900">
                  {employees.filter((e) => e.role === 'ADMIN').length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Employees</p>
                <p className="text-2xl font-bold text-purple-900">
                  {employees.filter((e) => e.role === 'EMPLOYEE').length}
                </p>
              </div>
            </div>

            {/* Employees Table */}
            <Table
              data={employees}
              columns={columns}
              keyExtractor={(row) => row.email}
              emptyMessage="No employees found. Create one to get started."
            />
          </>
        )}
      </Card>

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Employee"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-employee-form"
              loading={creatingEmployee}
            >
              Create Employee
            </Button>
          </>
        }
      >
        <EmployeeForm
          onSubmit={handleCreate}
          loading={creatingEmployee}
          error={createError}
        />
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        title="Edit Employee"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-employee-form"
              loading={updatingEmployee}
            >
              Update Employee
            </Button>
          </>
        }
      >
        {selectedEmployee && (
          <EmployeeForm
            initialData={selectedEmployee}
            onSubmit={(data) => handleUpdate(selectedEmployee.email, data)}
            loading={updatingEmployee}
            error={updateError}
            isEdit
          />
        )}
      </Modal>
    </div>
  );
};

// Employee Form Component
interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: any) => void;
  loading: boolean;
  error: string | null;
  isEdit?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  onSubmit,
  loading,
  error,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    contactNumber: initialData?.contactNumber || '',
    role: initialData?.role || 'EMPLOYEE',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form
      id={isEdit ? 'edit-employee-form' : 'create-employee-form'}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {error && <ErrorMessage message={error} />}

      <Input
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        fullWidth
        placeholder="Enter employee name"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        fullWidth
        disabled={isEdit}
        placeholder="employee@example.com"
      />

      <Input
        label="Contact Number"
        name="contactNumber"
        type="tel"
        value={formData.contactNumber}
        onChange={handleChange}
        required
        fullWidth
        placeholder="+1234567890"
      />

      <Select
        label="Role"
        name="role"
        value={formData.role}
        onChange={handleChange}
        options={[
          { value: 'EMPLOYEE', label: 'Employee' },
          { value: 'ADMIN', label: 'Administrator' },
        ]}
        required
        fullWidth
      />

      {!isEdit && (
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          fullWidth
          placeholder="Enter password"
          helperText="Minimum 8 characters"
        />
      )}
    </form>
  );
};

export default EmployeesNew;
