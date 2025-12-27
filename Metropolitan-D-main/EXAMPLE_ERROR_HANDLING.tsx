/**
 * EXAMPLE: Proper Error Handling in React Components
 *
 * This file demonstrates best practices for handling errors
 * when making API calls with Axios in React components.
 */

import React, { useState, useEffect } from 'react';
import { apiService } from './services/api';
import { extractErrorMessage, logError } from './utils/errorHandler';
import type { EmployeeResponse } from './types/api';

/**
 * Example 1: Simple GET Request with Error Handling
 */
export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      const response = await apiService.getAllEmployees();

      if (response.status && response.data) {
        setEmployees(response.data);
      } else {
        // Backend returned unsuccessful response
        setError(response.message || 'Failed to load employees');
      }
    } catch (error: unknown) {
      // Extract and display backend error message
      const errorInfo = extractErrorMessage(error, 'Unable to load employees');
      logError(errorInfo, 'EmployeeList.loadEmployees');
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading employees...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadEmployees}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Employees ({employees.length})</h2>
      <ul>
        {employees.map((emp) => (
          <li key={emp.email}>{emp.name}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example 2: POST Request with Error Handling (Form Submission)
 */
export const CreateEmployee: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);

      const response = await apiService.register({
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        password: formData.password,
        role: 'EMPLOYEE',
      });

      if (response.status && response.data) {
        setSuccess(`Employee ${response.data.name} created successfully!`);
        // Reset form
        setFormData({ name: '', email: '', contactNumber: '', password: '' });
      } else {
        setError(response.message || 'Failed to create employee');
      }
    } catch (error: unknown) {
      // Extract real backend error (e.g., "Email already exists")
      const errorInfo = extractErrorMessage(error, 'Failed to create employee');
      logError(errorInfo, 'CreateEmployee.handleSubmit');

      // Display specific backend error to user
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Employee</h2>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="tel"
          placeholder="Contact Number"
          value={formData.contactNumber}
          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
};

/**
 * Example 3: DELETE Request with Confirmation and Error Handling
 */
export const DeleteEmployee: React.FC<{ email: string; onDelete: () => void }> = ({
  email,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete employee ${email}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiService.deleteEmployee(email);

      if (response.status) {
        alert('Employee deleted successfully');
        onDelete(); // Callback to refresh list
      } else {
        setError(response.message || 'Failed to delete employee');
      }
    } catch (error: unknown) {
      const errorInfo = extractErrorMessage(error, 'Unable to delete employee');
      logError(errorInfo, 'DeleteEmployee.handleDelete');
      setError(errorInfo.message);
      alert(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </button>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

/**
 * Example 4: Multiple Parallel Requests with Error Handling
 */
export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    employeeCount: 0,
    generatorCount: 0,
    taskCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setErrors([]);

      // Make parallel requests
      const [employeesRes, generatorsRes, tasksRes] = await Promise.allSettled([
        apiService.getAllEmployees(),
        apiService.getAllGeneratorsCount(),
        apiService.getAllMiniJobCards(),
      ]);

      const newErrors: string[] = [];

      // Process employees result
      if (employeesRes.status === 'fulfilled' && employeesRes.value.status) {
        setStats((prev) => ({ ...prev, employeeCount: employeesRes.value.data?.length || 0 }));
      } else if (employeesRes.status === 'rejected') {
        const errorInfo = extractErrorMessage(employeesRes.reason, 'Failed to load employees');
        newErrors.push(errorInfo.message);
      }

      // Process generators result
      if (generatorsRes.status === 'fulfilled' && generatorsRes.value.status) {
        setStats((prev) => ({ ...prev, generatorCount: generatorsRes.value.data || 0 }));
      } else if (generatorsRes.status === 'rejected') {
        const errorInfo = extractErrorMessage(generatorsRes.reason, 'Failed to load generators');
        newErrors.push(errorInfo.message);
      }

      // Process tasks result
      if (tasksRes.status === 'fulfilled' && tasksRes.value.status) {
        setStats((prev) => ({ ...prev, taskCount: tasksRes.value.data?.length || 0 }));
      } else if (tasksRes.status === 'rejected') {
        const errorInfo = extractErrorMessage(tasksRes.reason, 'Failed to load tasks');
        newErrors.push(errorInfo.message);
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
      }
    } catch (error: unknown) {
      const errorInfo = extractErrorMessage(error, 'Failed to load dashboard data');
      logError(errorInfo, 'DashboardStats.loadDashboardStats');
      setErrors([errorInfo.message]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Dashboard Statistics</h2>

      {errors.length > 0 && (
        <div className="error-list">
          {errors.map((err, idx) => (
            <p key={idx} className="error-message">{err}</p>
          ))}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Employees</h3>
          <p>{stats.employeeCount}</p>
        </div>
        <div className="stat-card">
          <h3>Generators</h3>
          <p>{stats.generatorCount}</p>
        </div>
        <div className="stat-card">
          <h3>Tasks</h3>
          <p>{stats.taskCount}</p>
        </div>
      </div>

      {loading && <p>Loading...</p>}
    </div>
  );
};

/**
 * KEY TAKEAWAYS:
 *
 * 1. Always use try-catch when making API calls
 * 2. Use extractErrorMessage() to get user-friendly error messages
 * 3. Use logError() in development to debug issues
 * 4. Display extracted error.message to users, NOT generic messages
 * 5. Handle both response.status === false and caught errors
 * 6. Clear errors before making new requests
 * 7. Use Promise.allSettled for parallel requests to handle partial failures
 * 8. Always set loading state to false in finally block
 */
